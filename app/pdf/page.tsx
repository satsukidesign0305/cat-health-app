"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, Printer } from "lucide-react";
import Link from "next/link";
import { Cat, DailyRecord } from "@/lib/types";
import { getCats, getRecords } from "@/lib/storage";

const EVENT_EMOJI: Record<string, string> = {
  vomit: "🤢",
  diarrhea: "💧",
  hospital: "🏥",
  custom: "📝",
};

function PrintTable({ cat, records }: { cat: Cat; records: DailyRecord[] }) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const today = format(new Date(), "yyyy年M月d日", { locale: ja });

  return (
    <div id="print-area">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
          }
          @page { size: A4 landscape; margin: 15mm; }
        }
        #print-area table { border-collapse: collapse; width: 100%; font-size: 10px; }
        #print-area th, #print-area td {
          border: 1px solid #ccc; padding: 4px 6px; text-align: left;
        }
        #print-area th { background: #f3e8ff; font-weight: bold; }
      `}</style>

      <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 4 }}>
        猫の健康記録 — {cat.name}
      </h2>
      <p style={{ fontSize: 11, color: "#666", marginBottom: 12 }}>
        {cat.breed ? `品種：${cat.breed}　` : ""}出力日：{today}
      </p>

      <table>
        <thead>
          <tr>
            <th style={{ width: "10%" }}>日付</th>
            <th style={{ width: "8%" }}>おしっこ</th>
            <th style={{ width: "8%" }}>うんち</th>
            <th style={{ width: "8%" }}>体重(kg)</th>
            <th style={{ width: "22%" }}>投薬</th>
            <th style={{ width: "18%" }}>イベント</th>
            <th style={{ width: "26%" }}>メモ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((rec) => {
            const dateLabel = format(new Date(rec.date), "M/d(E)", { locale: ja });
            const meds = rec.medications.map((m) => `${m.name}${m.given ? "✓" : ""}`).join("、");
            const events = rec.events.map((e) => `${EVENT_EMOJI[e.type] ?? ""}${e.label}`).join("、");
            return (
              <tr key={rec.id}>
                <td>{dateLabel}</td>
                <td style={{ textAlign: "center" }}>{rec.urineCount}</td>
                <td style={{ textAlign: "center" }}>{rec.poopCount}</td>
                <td style={{ textAlign: "center" }}>{rec.weight ?? ""}</td>
                <td>{meds}</td>
                <td>{events}</td>
                <td>{[rec.urineNote, rec.poopNote, rec.note].filter(Boolean).join(" / ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PdfPageContent() {
  const params = useSearchParams();
  const catId = params.get("catId") ?? "";
  const [cat, setCat] = useState<Cat | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);

  useEffect(() => {
    const cats = getCats();
    const found = cats.find((c) => c.id === catId) ?? null;
    setCat(found);
    if (found) setRecords(getRecords(found.id));
  }, [catId]);

  if (!cat) {
    return <p className="text-center text-gray-400 mt-20">猫が見つかりません</p>;
  }

  return (
    <main className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="font-semibold text-gray-700">{cat.name}</p>
        <p className="text-sm text-gray-400 mt-1">
          {records.length}件の記録 / A4横向きで印刷・PDF保存できます
        </p>
      </div>

      {records.length === 0 ? (
        <p className="text-center text-gray-400">記録がありません</p>
      ) : (
        <>
          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white bg-purple-600 active:bg-purple-700"
          >
            <Printer size={20} />
            印刷 / PDFで保存
          </button>
          <p className="text-xs text-center text-gray-400">
            印刷ダイアログで「PDFに保存」を選ぶとPDFになります
          </p>
          <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
            <PrintTable cat={cat} records={records} />
          </div>
        </>
      )}
    </main>
  );
}

export default function PdfPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-purple-600 text-white px-4 py-4 flex items-center gap-3 print:hidden">
        <Link href="/history" className="p-1">
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">PDF出力</h1>
      </header>
      <Suspense fallback={<p className="text-center mt-20 text-gray-400">読み込み中…</p>}>
        <PdfPageContent />
      </Suspense>
    </div>
  );
}
