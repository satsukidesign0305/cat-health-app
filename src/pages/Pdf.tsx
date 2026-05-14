import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, Printer } from "lucide-react";
import { getCats, getRecords } from "../lib/db";
import type { Cat, DailyRecord } from "../lib/types";

const EVENT_LABEL: Record<string, string> = {
  vomit: "[嘔吐]",
  diarrhea: "[下痢]",
  hospital: "[通院]",
  custom: "[その他]",
};

const SEX_LABEL: Record<string, string> = {
  male: "オス",
  female: "メス",
};

const CELL_HEAD: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #bbb",
  backgroundColor: "#f0f0f0",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  width: "28%",
};
const CELL_BODY: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #bbb",
};

/** 1ページ目：プロフィールシート */
function ProfilePage({ cat }: { cat: Cat }) {
  const today = format(new Date(), "yyyy年M月d日", { locale: ja });
  const sectionHead: React.CSSProperties = {
    fontSize: 11,
    fontWeight: "bold",
    borderLeft: "4px solid #000",
    paddingLeft: 6,
    marginBottom: 6,
    marginTop: 14,
  };

  return (
    <div style={{ fontFamily: "'Hiragino Sans','Yu Gothic','Meiryo',sans-serif", color: "#000", fontSize: 10 }}>
      {/* ヘッダー */}
      <div style={{ borderBottom: "2px solid #000", paddingBottom: 5, marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: "bold" }}>{cat.name}　プロフィール</div>
        <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>出力日：{today}</div>
      </div>

      {/* 基本情報 */}
      <div style={sectionHead}>基本情報</div>
      <table style={{ borderCollapse: "collapse", width: "60%" }}>
        <tbody>
          {cat.breed && <tr><td style={CELL_HEAD}>品種</td><td style={CELL_BODY}>{cat.breed}</td></tr>}
          {cat.sex && <tr><td style={CELL_HEAD}>性別</td><td style={CELL_BODY}>{SEX_LABEL[cat.sex]}</td></tr>}
          {cat.birthDate && <tr><td style={CELL_HEAD}>生年月日</td><td style={CELL_BODY}>{cat.birthDate}</td></tr>}
          {!cat.breed && !cat.sex && !cat.birthDate && (
            <tr><td style={CELL_BODY} colSpan={2}>（未登録）</td></tr>
          )}
        </tbody>
      </table>

      {/* かかりつけ医 */}
      {cat.vetName && (
        <>
          <div style={sectionHead}>かかりつけ医</div>
          <table style={{ borderCollapse: "collapse", width: "80%" }}>
            <tbody>
              <tr><td style={CELL_HEAD}>病院名</td><td style={CELL_BODY}>{cat.vetName}</td></tr>
              {cat.vetPhone && <tr><td style={CELL_HEAD}>電話番号</td><td style={CELL_BODY}>{cat.vetPhone}</td></tr>}
              {cat.vetAddress && <tr><td style={CELL_HEAD}>住所</td><td style={CELL_BODY}>{cat.vetAddress}</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {/* 既往歴 */}
      {cat.medicalHistory && cat.medicalHistory.length > 0 && (
        <>
          <div style={sectionHead}>既往歴</div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ ...CELL_HEAD, backgroundColor: "#222", color: "#fff", width: "25%" }}>時期</th>
                <th style={{ ...CELL_BODY, backgroundColor: "#222", color: "#fff", textAlign: "left" }}>内容</th>
              </tr>
            </thead>
            <tbody>
              {cat.medicalHistory.map((m, i) => (
                <tr key={m.id}>
                  <td style={{ ...CELL_BODY, backgroundColor: i % 2 === 1 ? "#f5f5f5" : undefined }}>{m.date || "−"}</td>
                  <td style={{ ...CELL_BODY, backgroundColor: i % 2 === 1 ? "#f5f5f5" : undefined }}>{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* アレルギー・注意事項 */}
      {cat.allergies && (
        <>
          <div style={sectionHead}>アレルギー・注意事項</div>
          <div style={{ ...CELL_BODY, whiteSpace: "pre-wrap" }}>{cat.allergies}</div>
        </>
      )}

      {/* 食事 */}
      {cat.foodNotes && cat.foodNotes.length > 0 && (
        <>
          <div style={sectionHead}>食事</div>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ ...CELL_BODY, backgroundColor: "#222", color: "#fff", textAlign: "left" }}>食品名</th>
                <th style={{ ...CELL_HEAD, backgroundColor: "#222", color: "#fff", textAlign: "left" }}>備考（量など）</th>
              </tr>
            </thead>
            <tbody>
              {cat.foodNotes.map((f, i) => (
                <tr key={f.id}>
                  <td style={{ ...CELL_BODY, backgroundColor: i % 2 === 1 ? "#f5f5f5" : undefined }}>{f.name}</td>
                  <td style={{ ...CELL_BODY, backgroundColor: i % 2 === 1 ? "#f5f5f5" : undefined }}>{f.note || "−"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/** 2ページ目：月別体調記録テーブル */
function RecordsPage({ cat, records, monthLabel }: { cat: Cat; records: DailyRecord[]; monthLabel: string }) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const today = format(new Date(), "yyyy年M月d日", { locale: ja });

  return (
    <div style={{ fontFamily: "'Hiragino Sans','Yu Gothic','Meiryo',sans-serif", color: "#000" }}>
      <div style={{ marginBottom: 6, borderBottom: "2px solid #000", paddingBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: "bold" }}>体調記録　{cat.name}　{monthLabel}</div>
        <div style={{ fontSize: 9, marginTop: 2 }}>出力日：{today}　全{sorted.length}件</div>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "9.5px" }}>
        <thead>
          <tr>
            {[
              ["9%", "日付"],
              ["7%", "おしっこ"],
              ["7%", "うんち"],
              ["7%", "体重(kg)"],
              ["22%", "投薬"],
              ["20%", "イベント"],
              ["28%", "メモ"],
            ].map(([w, label]) => (
              <th key={label} style={{
                width: w, backgroundColor: "#222", color: "#fff", fontWeight: "bold",
                padding: "5px 6px", border: "1px solid #000", textAlign: "left", whiteSpace: "nowrap",
              }}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((rec, i) => {
            const dateLabel = format(new Date(rec.date + "T00:00:00"), "M/d(E)", { locale: ja });
            const events = rec.events
              .map((e) => `${EVENT_LABEL[e.type] ?? "[その他]"}${e.note ? `(${e.note})` : ""}`)
              .join(" ");
            const notes = [rec.urineNote, rec.poopNote, rec.note].filter(Boolean).join(" / ");
            const bg = i % 2 === 1 ? "#f0f0f0" : undefined;
            const td = (content: React.ReactNode, extra?: React.CSSProperties) => (
              <td style={{ border: "1px solid #555", padding: "4px 6px", verticalAlign: "top", lineHeight: 1.4, backgroundColor: bg, ...extra }}>{content}</td>
            );
            return (
              <tr key={rec.id}>
                {td(dateLabel, { whiteSpace: "nowrap" })}
                {td(rec.urineCount || "−", { textAlign: "center" })}
                {td(rec.poopCount || "−", { textAlign: "center" })}
                {td(rec.weight ?? "−", { textAlign: "center" })}
                {td(rec.medications.length === 0 ? "−" : rec.medications.map((m) => (
                  <span key={m.id} style={{ display: "block", textDecoration: m.given ? "line-through" : undefined }}>
                    {m.given ? "✓ " : "・"}{m.name}
                  </span>
                )))}
                {td(events || "−")}
                {td(notes || "−")}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** 印刷エリア（プロフィール＋体調記録の2ページ構成） */
function PrintArea({ cat, records, selectedMonth, monthLabel }: {
  cat: Cat; records: DailyRecord[]; selectedMonth: string; monthLabel: string;
}) {
  const filtered = records.filter((r) => r.date.startsWith(selectedMonth));

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
          }
          @page { size: A4 landscape; margin: 12mm 15mm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { break-after: page; }
        }
      `}</style>

      {/* 1ページ目：プロフィール */}
      <div className="page-break">
        <ProfilePage cat={cat} />
      </div>

      {/* 2ページ目：体調記録 */}
      <RecordsPage cat={cat} records={filtered} monthLabel={monthLabel} />
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

  // 記録がある年月の一覧（新しい順）
  const availableMonths = useMemo(() => (
    [...new Set(records.map((r) => r.date.slice(0, 7)))].sort().reverse()
  ), [records]);

  // 記録ロード後に最新月をデフォルト選択
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const monthLabel = selectedMonth
    ? `${selectedMonth.slice(0, 4)}年${parseInt(selectedMonth.slice(5, 7))}月`
    : "";
  const filteredCount = records.filter((r) => r.date.startsWith(selectedMonth)).length;

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
        <h1 className="text-lg font-bold">PDF出力</h1>
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
              <p className="text-sm text-gray-400 mt-1">A4横向き・白黒印刷 / 2ページ構成</p>
            </div>

            {/* 月選択 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <p className="font-semibold text-gray-700 text-sm">体調記録の年月を選択</p>
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
              <div className="text-xs text-gray-400 space-y-0.5">
                <p>📄 1ページ目：プロフィール（かかりつけ医・既往歴・食事など）</p>
                <p>📄 2ページ目：{monthLabel}の体調記録（{filteredCount}件）</p>
              </div>
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

      {/* 印刷専用エリア */}
      {cat && selectedMonth && (
        <PrintArea
          cat={cat}
          records={records}
          selectedMonth={selectedMonth}
          monthLabel={monthLabel}
        />
      )}
    </div>
  );
}
