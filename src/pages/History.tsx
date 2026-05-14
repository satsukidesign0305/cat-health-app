import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Cat as CatIcon, Printer } from "lucide-react";
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
          <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  c.id === selectedCatId ? "bg-white text-orange-500" : "bg-white/20 text-white"
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center">
                  {c.photoUrl
                    ? <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                    : <CatIcon size={11} className="text-orange-400" />}
                </div>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 p-4 space-y-3">
        {/* PDF出力リンク */}
        {cat && records.length > 0 && (
          <Link
            to={`/pdf?catId=${selectedCatId}`}
            className="flex items-center justify-center bg-orange-50 border border-orange-200 rounded-2xl p-3 text-orange-500"
          >
            <Printer size={22} />
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
