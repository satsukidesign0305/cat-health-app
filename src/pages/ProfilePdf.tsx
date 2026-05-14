import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, Printer } from "lucide-react";
import { getCats } from "../lib/db";
import type { Cat } from "../lib/types";

const SEX_LABEL: Record<string, string> = { male: "オス", female: "メス" };

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

function ProfilePrintArea({ cat }: { cat: Cat }) {
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
          @page { size: A4; margin: 15mm 18mm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        #print-area {
          font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
          color: #000;
          font-size: 10px;
        }
      `}</style>

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
          {cat.birthDate && <tr><td style={CELL_HEAD}>生年月日</td><td style={CELL_BODY}>{cat.birthDate}（{calcAge(cat.birthDate)}）</td></tr>}
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

export default function ProfilePdf() {
  const [searchParams] = useSearchParams();
  const catId = searchParams.get("catId") ?? "";
  const [cat, setCat] = useState<Cat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCats()
      .then((cats) => setCat(cats.find((c) => c.id === catId) ?? null))
      .finally(() => setLoading(false));
  }, [catId]);

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
        <Link to="/cats" className="p-1"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">プロフィール印刷</h1>
      </header>

      <main className="p-4 space-y-4 print:hidden">
        {!cat ? (
          <p className="text-center text-gray-400 mt-20">猫が見つかりません</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="font-semibold text-gray-700">{cat.name}</p>
              <p className="text-sm text-gray-400 mt-1">A4縦向き・白黒印刷対応</p>
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

      {cat && <ProfilePrintArea cat={cat} />}
    </div>
  );
}
