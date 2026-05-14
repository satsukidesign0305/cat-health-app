import { useState, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { Cat as CatIcon, Plus, Trash2, ChevronLeft, Pencil, Check, X, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getCats, saveCat, deleteCat } from "../lib/db";
import type { Cat, MedicalHistoryItem, FoodItem } from "../lib/types";

/** 誕生日から現在の年齢を計算する */
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

/** 画像を canvas でリサイズして base64 に変換する */
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
  vetName: string;
  vetPhone: string;
  vetAddress: string;
  medicalHistory: MedicalHistoryItem[];
  allergies: string;
  foodNotes: FoodItem[];
}

function emptyForm(): CatFormState {
  return {
    name: "", breed: "", birthDate: "", sex: "", photoUrl: "",
    vetName: "", vetPhone: "", vetAddress: "",
    medicalHistory: [], allergies: "", foodNotes: [],
  };
}

function catToForm(cat: Cat): CatFormState {
  return {
    name: cat.name,
    breed: cat.breed ?? "",
    birthDate: cat.birthDate ?? "",
    sex: cat.sex ?? "",
    photoUrl: cat.photoUrl ?? "",
    vetName: cat.vetName ?? "",
    vetPhone: cat.vetPhone ?? "",
    vetAddress: cat.vetAddress ?? "",
    medicalHistory: cat.medicalHistory ?? [],
    allergies: cat.allergies ?? "",
    foodNotes: cat.foodNotes ?? [],
  };
}

/** アバター表示と写真選択ボタン */
function AvatarPicker({ photoUrl, onChange }: { photoUrl: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await resizeImage(file));
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center"
      >
        {photoUrl
          ? <img src={photoUrl} alt="cat" className="w-full h-full object-cover" />
          : <CatIcon size={32} className="text-orange-400" />}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
          <Camera size={20} className="text-white" />
        </div>
      </button>
      <span className="text-xs text-gray-400">タップして写真を変更</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

/** 猫の追加・編集フォーム */
function CatForm({
  initial,
  onSave,
  onCancel,
  saving = false,
}: {
  initial: CatFormState;
  onSave: (form: CatFormState) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (patch: Partial<CatFormState>) => setForm((f) => ({ ...f, ...patch }));

  // 既往歴の入力下書き
  const [medInput, setMedInput] = useState({ date: "", description: "" });
  // 食事の入力下書き
  const [foodInput, setFoodInput] = useState({ name: "", note: "" });

  function addMedical() {
    if (!medInput.description.trim()) return;
    const item: MedicalHistoryItem = {
      id: uuid(),
      date: medInput.date.trim(),
      description: medInput.description.trim(),
    };
    set({ medicalHistory: [...form.medicalHistory, item] });
    setMedInput({ date: "", description: "" });
  }

  function removeMedical(id: string) {
    set({ medicalHistory: form.medicalHistory.filter((m) => m.id !== id) });
  }

  function addFood() {
    if (!foodInput.name.trim()) return;
    const item: FoodItem = {
      id: uuid(),
      name: foodInput.name.trim(),
      note: foodInput.note.trim(),
    };
    set({ foodNotes: [...form.foodNotes, item] });
    setFoodInput({ name: "", note: "" });
  }

  function removeFood(id: string) {
    set({ foodNotes: form.foodNotes.filter((f) => f.id !== id) });
  }

  return (
    <div className="space-y-4">
      <AvatarPicker photoUrl={form.photoUrl} onChange={(url) => set({ photoUrl: url })} />

      {/* 基本情報 */}
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
                {s === "male" ? "♂︎ オス" : "♀︎ メス"}
              </button>
            );
          })}
        </div>
      </div>

      {/* かかりつけ医 */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 mb-3">🏥 かかりつけ医</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">病院名</label>
            <input
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="例：○○動物病院"
              value={form.vetName}
              onChange={(e) => set({ vetName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">電話番号</label>
            <input
              type="tel"
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="例：03-1234-5678"
              value={form.vetPhone}
              onChange={(e) => set({ vetPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">住所</label>
            <input
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="例：東京都渋谷区○○1-2-3"
              value={form.vetAddress}
              onChange={(e) => set({ vetAddress: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* 健康情報 */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 mb-3">💉 健康情報</p>

        {/* 既往歴リスト */}
        <label className="text-xs text-gray-400">既往歴</label>
        <div className="space-y-2 mt-1 mb-2">
          {form.medicalHistory.map((item) => (
            <div key={item.id} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <div className="flex-1 text-sm">
                {item.date && <span className="text-gray-400 mr-2">{item.date}</span>}
                <span className="text-gray-700">{item.description}</span>
              </div>
              <button type="button" onClick={() => removeMedical(item.id)} className="text-gray-300 shrink-0 pt-0.5">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <input
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
            placeholder="時期（例：2023年5月）"
            value={medInput.date}
            onChange={(e) => setMedInput((p) => ({ ...p, date: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="内容（例：尿路結石で手術）"
              value={medInput.description}
              onChange={(e) => setMedInput((p) => ({ ...p, description: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addMedical()}
            />
            <button
              type="button"
              onClick={addMedical}
              className="bg-orange-100 text-orange-500 rounded-xl px-3"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* アレルギー */}
        <div className="mt-4">
          <label className="text-xs text-gray-400">アレルギー・注意事項</label>
          <textarea
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none"
            rows={2}
            placeholder="例：チキンアレルギー、ラテックスアレルギー"
            value={form.allergies}
            onChange={(e) => set({ allergies: e.target.value })}
          />
        </div>
      </div>

      {/* 食事情報 */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 mb-3">🍽️ 食事</p>
        <label className="text-xs text-gray-400">ごはん・おやつ</label>
        <div className="space-y-2 mt-1 mb-2">
          {form.foodNotes.map((item) => (
            <div key={item.id} className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <div className="flex-1 text-sm">
                <span className="text-gray-700">{item.name}</span>
                {item.note && <span className="text-gray-400 ml-2">（{item.note}）</span>}
              </div>
              <button type="button" onClick={() => removeFood(item.id)} className="text-gray-300 shrink-0 pt-0.5">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="食品名（例：ロイヤルカナン 腎臓サポート）"
              value={foodInput.name}
              onChange={(e) => setFoodInput((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addFood()}
            />
            <button
              type="button"
              onClick={addFood}
              className="bg-orange-100 text-orange-500 rounded-xl px-3"
            >
              <Plus size={18} />
            </button>
          </div>
          <input
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
            placeholder="備考（例：朝晩各40g）"
            value={foodInput.note}
            onChange={(e) => setFoodInput((p) => ({ ...p, note: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addFood()}
          />
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
          disabled={!form.name.trim() || saving}
          className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Check size={15} /> {saving ? "保存中…" : "保存する"}
        </button>
      </div>
    </div>
  );
}

export default function Cats() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    getCats().then(setCats).finally(() => setLoading(false));
  }, []);

  async function handleSaveEdit(id: string, form: CatFormState) {
    if (saving) return;
    const existing = cats.find((c) => c.id === id)!;
    const updated: Cat = {
      ...existing,
      name: form.name.trim(),
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      photoUrl: form.photoUrl || undefined,
      vetName: form.vetName.trim() || undefined,
      vetPhone: form.vetPhone.trim() || undefined,
      vetAddress: form.vetAddress.trim() || undefined,
      medicalHistory: form.medicalHistory.length > 0 ? form.medicalHistory : undefined,
      allergies: form.allergies.trim() || undefined,
      foodNotes: form.foodNotes.length > 0 ? form.foodNotes : undefined,
    };
    setSaving(true);
    try {
      await saveCat(updated);
      setCats(await getCats());
      setEditingId(null);
    } catch (err) {
      console.error("保存エラー:", err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(form: CatFormState) {
    if (saving) return;
    const cat: Cat = {
      id: uuid(),
      name: form.name.trim(),
      breed: form.breed.trim() || undefined,
      birthDate: form.birthDate || undefined,
      sex: form.sex || undefined,
      photoUrl: form.photoUrl || undefined,
      vetName: form.vetName.trim() || undefined,
      vetPhone: form.vetPhone.trim() || undefined,
      vetAddress: form.vetAddress.trim() || undefined,
      medicalHistory: form.medicalHistory.length > 0 ? form.medicalHistory : undefined,
      allergies: form.allergies.trim() || undefined,
      foodNotes: form.foodNotes.length > 0 ? form.foodNotes : undefined,
      createdAt: new Date().toISOString(),
    };
    setSaving(true);
    try {
      await saveCat(cat);
      setCats(await getCats());
      setShowAddForm(false);
    } catch (err) {
      console.error("保存エラー:", err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この猫のデータをすべて削除しますか？")) return;
    await deleteCat(id);
    setCats(await getCats());
    if (editingId === id) setEditingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="bg-orange-500 text-white px-4 py-4 flex items-center gap-3">
        <Link to="/" className="p-1"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">猫の管理</h1>
      </header>

      <main className="flex-1 p-4 space-y-3">
        {cats.length === 0 && !showAddForm && (
          <p className="text-center text-gray-400 mt-12">まだ猫が登録されていません</p>
        )}

        {cats.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {editingId === cat.id ? (
              <div className="p-4">
                <p className="font-semibold text-gray-700 mb-4">編集中</p>
                <CatForm
                  initial={catToForm(cat)}
                  onSave={(form) => handleSaveEdit(cat.id, form)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center">
                  {cat.photoUrl
                    ? <img src={cat.photoUrl} alt={cat.name} className="w-full h-full object-cover" />
                    : <CatIcon size={22} className="text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-800 truncate">{cat.name}</p>
                    {cat.sex && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        cat.sex === "male" ? "bg-blue-50 text-blue-500" : "bg-pink-50 text-pink-500"
                      }`}>
                        {cat.sex === "male" ? "♂︎" : "♀︎"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {[cat.breed, cat.birthDate ? calcAge(cat.birthDate) : undefined]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingId(cat.id); setShowAddForm(false); }}
                  className="text-gray-400 p-2"
                >
                  <Pencil size={17} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="text-gray-300 p-2">
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
              saving={saving}
            />
          </div>
        ) : (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-200 text-orange-400 rounded-2xl py-4"
          >
            <Plus size={20} /> 猫を追加する
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
