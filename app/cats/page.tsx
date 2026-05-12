"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { Cat as CatIcon, Plus, Trash2, ChevronLeft, Pencil, Check, X, Camera } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { Cat } from "@/lib/types";
import { getCats, saveCat, deleteCat } from "@/lib/storage";

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate + "T00:00:00");
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years === 0) return `${months}か月`;
  if (months === 0) return `${years}歳`;
  return `${years}歳${months}か月`;
}

async function resizeImage(file: File, size = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(size / img.width, size / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = url;
  });
}

interface CatFormState {
  name: string;
  breed: string;
  birthDate: string;
  sex: "male" | "female" | "";
  photoUrl: string;
}

function emptyForm(): CatFormState {
  return { name: "", breed: "", birthDate: "", sex: "", photoUrl: "" };
}

function catToForm(cat: Cat): CatFormState {
  return {
    name: cat.name,
    breed: cat.breed ?? "",
    birthDate: cat.birthDate ?? "",
    sex: cat.sex ?? "",
    photoUrl: cat.photoUrl ?? "",
  };
}

// 写真選択ボタン＋アバター表示
function AvatarPicker({
  photoUrl,
  onChange,
}: {
  photoUrl: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file);
    onChange(resized);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="cat" className="w-full h-full object-cover" />
        ) : (
          <CatIcon size={32} className="text-orange-400" />
        )}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </div>
      </button>
      <span className="text-xs text-gray-400">タップして写真を変更</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// 編集・追加フォーム
function CatForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CatFormState;
  onSave: (form: CatFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CatFormState>(initial);

  function set(patch: Partial<CatFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  return (
    <div className="space-y-4">
      <AvatarPicker photoUrl={form.photoUrl} onChange={(url) => set({ photoUrl: url })} />

      <div>
        <label className="text-xs text-gray-400">名前 *</label>
        <input
          className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="例：たま"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">品種</label>
        <input
          className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="例：スコティッシュフォールド"
          value={form.breed}
          onChange={(e) => set({ breed: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">誕生日</label>
        <input
          type="date"
          className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={form.birthDate}
          onChange={(e) => set({ birthDate: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs text-gray-400">性別</label>
        <div className="flex gap-2 mt-1">
          {(["male", "female"] as const).map((s) => {
            const label = s === "male" ? "♂ オス" : "♀ メス";
            const selected = form.sex === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => set({ sex: selected ? "" : s })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  selected
                    ? s === "male"
                      ? "bg-blue-50 border-blue-300 text-blue-600"
                      : "bg-pink-50 border-pink-300 text-pink-600"
                    : "bg-gray-50 border-gray-100 text-gray-500"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-200 rounded-xl py-2.5 text-gray-500 text-sm flex items-center justify-center gap-1"
        >
          <X size={15} /> キャンセル
        </button>
        <button
          onClick={() => form.name.trim() && onSave(form)}
          disabled={!form.name.trim()}
          className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Check size={15} /> 保存する
        </button>
      </div>
    </div>
  );
}

export default function CatsPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setCats(getCats());
  }, []);

  function handleSaveEdit(id: string, form: CatFormState) {
    const existing = cats.find((c) => c.id === id)!;
    saveCat({
      ...existing,
      name: form.name.trim(),
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      photoUrl: form.photoUrl || undefined,
    });
    setCats(getCats());
    setEditingId(null);
  }

  function handleAdd(form: CatFormState) {
    saveCat({
      id: uuid(),
      name: form.name.trim(),
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      photoUrl: form.photoUrl || undefined,
      createdAt: new Date().toISOString(),
    });
    setCats(getCats());
    setShowAddForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm("この猫のデータをすべて削除しますか？")) return;
    deleteCat(id);
    setCats(getCats());
    if (editingId === id) setEditingId(null);
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-orange-500 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="p-1">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">猫の管理</h1>
      </header>

      <main className="flex-1 p-4 space-y-3">
        {cats.length === 0 && !showAddForm && (
          <p className="text-center text-gray-400 mt-12">まだ猫が登録されていません</p>
        )}

        {cats.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {editingId === cat.id ? (
              // 編集フォーム
              <div className="p-4">
                <p className="font-semibold text-gray-700 mb-4">編集中</p>
                <CatForm
                  initial={catToForm(cat)}
                  onSave={(form) => handleSaveEdit(cat.id, form)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              // 通常表示
              <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center">
                  {cat.photoUrl ? (
                    <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <CatIcon size={22} className="text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
                    {cat.sex && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        cat.sex === "male"
                          ? "bg-blue-50 text-blue-500"
                          : "bg-pink-50 text-pink-500"
                      }`}>
                        {cat.sex === "male" ? "♂" : "♀"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {[cat.breed, cat.birthDate ? calcAge(cat.birthDate) : undefined].filter(Boolean).join(" / ")}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingId(cat.id); setShowAddForm(false); }}
                  className="text-gray-400 p-2"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-gray-300 p-2"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            )}
          </div>
        ))}

        {showAddForm ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold text-gray-700 mb-4">新しい猫を追加</p>
            <CatForm
              initial={emptyForm()}
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-200 text-orange-400 rounded-2xl py-4"
          >
            <Plus size={20} />
            猫を追加する
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
