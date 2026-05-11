"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronDown, FileText } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { Cat, DailyRecord } from "@/lib/types";
import { getCats, getRecords } from "@/lib/storage";

export default function HistoryPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [records, setRecords] = useState<DailyRecord[]>([]);

  useEffect(() => {
    const loaded = getCats();
    setCats(loaded);
    if (loaded.length > 0) setSelectedCatId(loaded[0].id);
  }, []);

  useEffect(() => {
    if (!selectedCatId) return;
    const all = getRecords(selectedCatId).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    setRecords(all);
  }, [selectedCatId]);

  const cat = cats.find((c) => c.id === selectedCatId);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="bg-purple-600 text-white px-4 py-4">
        <h1 className="text-lg font-bold">記録履歴</h1>
        {cats.length > 1 && (
          <div className="relative mt-2">
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full bg-white/20 text-white rounded-lg px-3 py-2 pr-8 appearance-none font-semibold focus:outline-none"
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id} className="text-gray-800">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        )}
      </header>

      <main className="flex-1 p-4 space-y-3">
        {cat && records.length > 0 && (
          <Link
            href={`/pdf?catId=${selectedCatId}`}
            className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-purple-700"
          >
            <FileText size={18} />
            <span className="font-semibold">{cat.name} のPDFを出力</span>
          </Link>
        )}

        {records.length === 0 && (
          <p className="text-center text-gray-400 mt-12">記録がありません</p>
        )}

        {records.map((rec) => {
          const dateLabel = format(new Date(rec.date), "M月d日(E)", { locale: ja });
          return (
            <div key={rec.id} className="bg-white rounded-xl p-4 shadow-sm space-y-2">
              <p className="font-semibold text-gray-700">{dateLabel}</p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span>🚽 おしっこ {rec.urineCount}回</span>
                <span>💩 うんち {rec.poopCount}回</span>
                {rec.weight && <span>⚖️ {rec.weight}kg</span>}
              </div>
              {rec.medications.length > 0 && (
                <div className="text-sm text-gray-500">
                  💊 {rec.medications.map((m) => `${m.name}${m.given ? "✓" : ""}`).join("、")}
                </div>
              )}
              {rec.events.length > 0 && (
                <div className="text-sm text-orange-600">
                  📋 {rec.events.map((e) => e.label).join("、")}
                </div>
              )}
              {rec.note && (
                <p className="text-sm text-gray-500 border-t border-gray-100 pt-2">
                  {rec.note}
                </p>
              )}
            </div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
