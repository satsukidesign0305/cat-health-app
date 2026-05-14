import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronDown, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getCats, getRecords } from "../lib/db";
import type { Cat, DailyRecord } from "../lib/types";

export default function History() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 猫一覧を取得
  useEffect(() => {
    getCats()
      .then((loaded) => {
        setCats(loaded);
        if (loaded.length > 0) setSelectedCatId(loaded[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  // 選択中の猫の記録を取得
  useEffect(() => {
    if (!selectedCatId) return;
    getRecords(selectedCatId).then(setRecords);
  }, [selectedCatId]);

  const cat = cats.find((c) => c.id === selectedCatId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="bg-orange-500 text-white px-4 py-4">
        <h1 className="text-lg font-bold">記録履歴</h1>
        {cats.length > 1 && (
          <div className="relative mt-2">
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full bg-white/20 text-white rounded-xl px-3 py-2 pr-8 appearance-none font-semibold focus:outline-none"
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id} className="text-gray-800">{c.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </header>

      <main className="flex-1 p-4 space-y-3">
        {/* PDF出力リンク */}
        {cat && records.length > 0 && (
          <Link
            to={`/pdf?catId=${selectedCatId}`}
            className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-orange-600"
          >
            <FileText size={18} />
            <span className="font-semibold">{cat.name} のPDFを出力</span>
          </Link>
        )}

        {records.length === 0 && (
          <p className="text-center text-gray-400 mt-12">記録がありません</p>
        )}

        {records.map((rec) => {
          const dateLabel = format(new Date(rec.date + "T00:00:00"), "M月d日(E)", { locale: ja });
          return (
            <div key={rec.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <p className="font-semibold text-gray-700">{dateLabel}</p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>🚽 {rec.urineCount}回</span>
                <span>💩 {rec.poopCount}回</span>
                {rec.weight && <span>⚖️ {rec.weight}kg</span>}
              </div>
              {rec.medications.length > 0 && (
                <p className="text-sm text-gray-400">
                  💊 {rec.medications.map((m) => `${m.name}${m.given ? "✓" : ""}`).join("、")}
                </p>
              )}
              {rec.events.length > 0 && (
                <p className="text-sm text-orange-500">
                  📋 {rec.events.map((e) => e.label).join("、")}
                </p>
              )}
              {rec.note && (
                <p className="text-sm text-gray-400 border-t border-gray-50 pt-2">{rec.note}</p>
              )}
            </div>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
