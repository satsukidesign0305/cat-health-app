import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, Printer } from "lucide-react";
import { getCats, getRecords } from "../lib/db";
import type { Cat, DailyRecord } from "../lib/types";

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

const EVENT_LABEL: Record<string, string> = {
  vomit: "[嘔吐]",
  diarrhea: "[下痢]",
  hospital: "[通院]",
  custom: "[その他]",
};

/** 月別体調記録の印刷エリア */
function RecordsPrintArea({ cat, records, monthLabel }: {
  cat: Cat; records: DailyRecord[]; monthLabel: string;
}) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const today = format(new Date(), "yyyy年M月d日", { locale: ja });

  return (
    <div id="print-area">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute;
            top: 0; left: 0;
            width: 100%;
            font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
            color: #000;
          }
          @page { size: A4 landscape; margin: 12mm 15mm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        #print-area { font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; color: #000; }
        #print-area table { border-collapse: collapse; width: 100%; font-size: 9.5px; }
        #print-area th {
          background: #222; color: #fff; font-weight: bold;
          padding: 5px 6px; border: 1px solid #000; text-align: left; white-space: nowrap;
        }
        #print-area td { border: 1px solid #555; padding: 4px 6px; vertical-align: top; line-height: 1.4; }
        #print-area tbody tr:nth-child(even) td { background: #f0f0f0; }
        .med-done { text-decoration: line-through; }
      `}</style>

      <div style={{ marginBottom: 6, borderBottom: "2px solid #000", paddingBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: "bold" }}>体調記録　{cat.name}　{monthLabel}</div>
        <div style={{ fontSize: 9, marginTop: 2 }}>
          {cat.birthDate && <span style={{ marginRight: 12 }}>年齢：{calcAge(cat.birthDate)}</span>}
          <span>出力日：{today}　全{sorted.length}件</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "9%" }}>日付</th>
            <th style={{ width: "7%", textAlign: "center" }}>おしっこ</th>
            <th style={{ width: "7%", textAlign: "center" }}>うんち</th>
            <th style={{ width: "7%", textAlign: "center" }}>体重(kg)</th>
            <th style={{ width: "22%" }}>投薬</th>
            <th style={{ width: "20%" }}>イベント</th>
            <th style={{ width: "28%" }}>メモ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((rec) => {
            const dateLabel = format(new Date(rec.date + "T00:00:00"), "M/d(E)", { locale: ja });
            const events = rec.events
              .map((e) => `${EVENT_LABEL[e.type] ?? "[その他]"}${e.note ? `(${e.note})` : ""}`)
              .join(" ");
            const notes = [rec.urineNote, rec.poopNote, rec.note].filter(Boolean).join(" / ");
            return (
              <tr key={rec.id}>
                <td style={{ whiteSpace: "nowrap" }}>{dateLabel}</td>
                <td style={{ textAlign: "center" }}>{rec.urineCount || "−"}</td>
                <td style={{ textAlign: "center" }}>{rec.poopCount || "−"}</td>
                <td style={{ textAlign: "center" }}>{rec.weight ?? "−"}</td>
                <td>
                  {rec.medications.length === 0 ? "−" : rec.medications.map((m) => (
                    <span key={m.id} className={m.given ? "med-done" : ""} style={{ display: "block" }}>
                      {m.given ? "✓ " : "・"}{m.name}
                    </span>
                  ))}
                </td>
                <td>{events || "−"}</td>
                <td>{notes || "−"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Pdf() {
  const [searchParams] = useSearchParams();
  const catId = searchParams.get("catId") ?? "";
  const [cat, setCat] = useState<Cat | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    async function load() {
      const cats = await getCats();
      const found = cats.find((c) => c.id === catId) ?? null;
      setCat(found);
      if (found) setRecords(await getRecords(found.id));
      setLoading(false);
    }
    load();
  }, [catId]);

  const availableMonths = useMemo(() => (
    [...new Set(records.map((r) => r.date.slice(0, 7)))].sort().reverse()
  ), [records]);

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const monthLabel = selectedMonth
    ? `${selectedMonth.slice(0, 4)}年${parseInt(selectedMonth.slice(5, 7))}月`
    : "";
  const filteredRecords = records.filter((r) => r.date.startsWith(selectedMonth));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-orange-500 text-white px-4 py-4 flex items-center gap-3 print:hidden">
        <Link to="/history" className="p-1"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">体調記録 印刷</h1>
      </header>

      <main className="p-4 space-y-4 print:hidden">
        {!cat ? (
          <p className="text-center text-gray-400 mt-20">猫が見つかりません</p>
        ) : availableMonths.length === 0 ? (
          <p className="text-center text-gray-400 mt-20">記録がありません</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-semibold text-gray-700">{cat.name}</p>
              <p className="text-sm text-gray-400 mt-1">A4横向き・白黒印刷対応</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-semibold text-gray-700 text-sm">年月を選択</p>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              >
                {availableMonths.map((m) => {
                  const label = `${m.slice(0, 4)}年${parseInt(m.slice(5, 7))}月`;
                  const count = records.filter((r) => r.date.startsWith(m)).length;
                  return <option key={m} value={m}>{label}（{count}件）</option>;
                })}
              </select>
              <p className="text-xs text-gray-400">{monthLabel}の記録：{filteredRecords.length}件</p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white bg-orange-500 active:bg-orange-600"
            >
              <Printer size={20} />
              印刷 / PDFで保存
            </button>
            <p className="text-xs text-center text-gray-400">
              印刷ダイアログで「PDFに保存」を選ぶとPDFになります
            </p>
          </>
        )}
      </main>

      {cat && selectedMonth && (
        <RecordsPrintArea cat={cat} records={filteredRecords} monthLabel={monthLabel} />
      )}
    </div>
  );
}
