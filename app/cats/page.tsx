"use client";

import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Cat as CatIcon, Plus, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { Cat } from "@/lib/types";
import { getCats, saveCat, deleteCat } from "@/lib/storage";

export default function CatsPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    setCats(getCats());
  }, []);

  function handleAdd() {
    if (!name.trim()) return;
    const cat: Cat = {
      id: uuid(),
      name: name.trim(),
      breed: breed.trim() || undefined,
      birthDate: birthDate || undefined,
      createdAt: new Date().toISOString(),
    };
    saveCat(cat);
    setCats(getCats());
    setName("");
    setBreed("");
    setBirthDate("");
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm("この猫のデータをすべて削除しますか？")) return;
    deleteCat(id);
    setCats(getCats());
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
        {cats.length === 0 && !showForm && (
          <p className="text-center text-gray-400 mt-12">まだ猫が登録されていません</p>
        )}

        {cats.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
              <CatIcon size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{cat.name}</p>
              <p className="text-xs text-gray-400">
                {[cat.breed, cat.birthDate].filter(Boolean).join(" / ")}
              </p>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="text-gray-300 p-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="font-semibold text-gray-700">新しい猫を追加</p>
            <div>
              <label className="text-xs text-gray-400">名前 *</label>
              <input
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="例：たま"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">品種</label>
              <input
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="例：スコティッシュフォールド"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">誕生日</label>
              <input
                type="date"
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-gray-500 text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm disabled:opacity-40"
              >
                追加する
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
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
