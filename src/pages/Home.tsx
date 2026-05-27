import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { v4 as uuid } from "uuid";
import { Plus, X, Cat as CatIcon, CalendarDays, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import Counter from "../components/Counter";
import { useAuth } from "../context/AuthContext";
import { getCats, getRecord, saveRecord } from "../lib/db";
import type { Cat, DailyRecord, HealthEvent, Medication } from "../lib/types";

const EVENT_PRESETS: { type: HealthEvent["type"]; label: string; emoji: string }[] = [
  { type: "vomit", label: "嘔吐", emoji: "🤢" },
  { type: "diarrhea", label: "下痢", emoji: "💧" },
  { type: "hospital", label: "通院", emoji: "🏥" },
  { type: "vaccine", label: "ワクチン接種", emoji: "💉" },
  { type: "flea", label: "ノミダニ薬", emoji: "🐛" },
];

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function emptyRecord(catId: string, date: string): DailyRecord {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    catId,
    date,
    urineCount: 0,
    poopCount: 0,
    medications: [],
    events: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function Home() {
  const { signOut } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [medName, setMedName] = useState("");
  const [eventNote, setEventNote] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 猫一覧を取得
  useEffect(() => {
    getCats()
      .then((loaded) => {
        setCats(loaded);
        if (loaded.length > 0) setSelectedCatId(loaded[0].id);
      })
      .finally(() => setLoadingCats(false));
  }, []);

  // 選択中の猫・日付の記録を取得
  const loadRecord = useCallback(async (catId: string, date: string) => {
    const existing = await getRecord(catId, date);
    setRecord(existing ?? emptyRecord(catId, date));
    setSaved(false);
  }, []);

  useEffect(() => {
    if (selectedCatId) loadRecord(selectedCatId, selectedDate);
  }, [selectedCatId, selectedDate, loadRecord]);

  function update(patch: Partial<DailyRecord>) {
    setRecord((r) => r ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r);
    setSaved(false);
  }

  async function handleSave() {
    if (!record) return;
    setSaving(true);
    try {
      await saveRecord(record);
      setSaved(true);
    } catch (err) {
      console.error("保存エラー:", err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  function addMedication() {
    if (!medName.trim()) return;
    const med: Medication = { id: uuid(), name: medName.trim(), given: false };
    update({ medications: [...(record?.medications ?? []), med] });
    setMedName("");
  }

  function toggleMed(id: string) {
    update({
      medications: record!.medications.map((m) =>
        m.id === id ? { ...m, given: !m.given } : m
      ),
    });
  }

  function removeMed(id: string) {
    update({ medications: record!.medications.filter((m) => m.id !== id) });
  }

  function addEvent(type: HealthEvent["type"], label: string) {
    const ev: HealthEvent = {
      id: uuid(),
      type,
      label,
      note: type === "custom" ? eventNote : undefined,
    };
    update({ events: [...(record?.events ?? []), ev] });
    setEventNote("");
  }

  function removeEvent(id: string) {
    update({ events: record!.events.filter((e) => e.id !== id) });
  }

  const isToday = selectedDate === todayStr();
  const dateLabel = format(new Date(selectedDate + "T00:00:00"), "M月d日(E)", { locale: ja });

  if (loadingCats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">読み込み中…</p>
      </div>
    );
  }

  if (cats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 pb-24">
        <CatIcon size={64} className="text-orange-300" />
        <p className="text-gray-500 text-center">まず猫を登録してください</p>
        <Link to="/cats" className="bg-orange-500 text-white px-6 py-3 rounded-full font-semibold">
          猫を登録する
        </Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="bg-orange-500 text-white px-4 pt-4 pb-3">
        {/* タイトルとログアウト */}
        <div className="flex items-center justify-between">
          <div className="w-8" />
          <h1 className="text-xl font-bold tracking-wide">Nyarte</h1>
          <button onClick={signOut} className="p-1 opacity-70 hover:opacity-100">
            <LogOut size={18} />
          </button>
        </div>

        {/* 猫セレクター */}
        {cats.length === 1 ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/30 flex-shrink-0 flex items-center justify-center">
              {cats[0].photoUrl
                ? <img src={cats[0].photoUrl} alt={cats[0].name} className="w-full h-full object-cover" />
                : <CatIcon size={16} className="text-white" />}
            </div>
            <span className="font-semibold">{cats[0].name}</span>
          </div>
        ) : (
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

        {/* 日付セレクター */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2 text-sm font-medium pointer-events-none">
              <CalendarDays size={15} />
              <span>{dateLabel}</span>
              {isToday && (
                <span className="ml-auto text-xs bg-white/30 rounded-full px-2 py-0.5">今日</span>
              )}
            </div>
            {/* 透明な input を重ねてネイティブカレンダーを呼び出す */}
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </div>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              className="text-xs bg-white/20 rounded-xl px-3 py-2 font-medium whitespace-nowrap"
            >
              今日に戻る
            </button>
          )}
        </div>
      </header>

      {record && (
        <main className="flex-1 p-4 space-y-3">
          {/* おしっこ */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">🚽 おしっこ</h2>
            <Counter value={record.urineCount} onChange={(v) => update({ urineCount: v })} />
            <input
              className="mt-3 w-full text-sm border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="メモ（色・量など）"
              value={record.urineNote ?? ""}
              onChange={(e) => update({ urineNote: e.target.value })}
            />
          </section>

          {/* うんち */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">💩 うんち</h2>
            <Counter value={record.poopCount} onChange={(v) => update({ poopCount: v })} />
            <input
              className="mt-3 w-full text-sm border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="メモ（硬さ・色など）"
              value={record.poopNote ?? ""}
              onChange={(e) => update({ poopNote: e.target.value })}
            />
          </section>

          {/* 体重 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">⚖️ 体重</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="30"
                className="w-28 border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="0.00"
                value={record.weight ?? ""}
                onChange={(e) =>
                  update({ weight: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <span className="text-gray-500">kg</span>
            </div>
          </section>

          {/* 投薬 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">💊 投薬</h2>
            <div className="space-y-2 mb-3">
              {record.medications.map((med) => (
                <div key={med.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMed(med.id)}
                    className={`flex-1 text-left text-sm px-3 py-2 rounded-xl border transition-colors ${
                      med.given
                        ? "bg-green-50 border-green-200 text-green-700 line-through"
                        : "border-gray-100 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {med.given ? "✓ " : ""}{med.name}
                  </button>
                  <button onClick={() => removeMed(med.id)} className="text-gray-300 p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="薬の名前を入力"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMedication()}
              />
              <button onClick={addMedication} className="bg-orange-100 text-orange-500 rounded-xl px-3">
                <Plus size={18} />
              </button>
            </div>
          </section>

          {/* イベント */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">📋 イベント</h2>
            <div className="space-y-2 mb-3">
              {record.events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                  <span className="text-sm flex-1 text-orange-800">
                    {EVENT_PRESETS.find((p) => p.type === ev.type)?.emoji ?? "📝"} {ev.label}
                    {ev.note && <span className="text-orange-500 ml-1">— {ev.note}</span>}
                  </span>
                  <button onClick={() => removeEvent(ev.id)} className="text-orange-300 p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {EVENT_PRESETS.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => addEvent(preset.type, preset.label)}
                  className="border border-gray-100 bg-gray-50 rounded-xl py-2 text-sm text-gray-600 active:bg-orange-50"
                >
                  {preset.emoji} {preset.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="その他（自由入力）"
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && eventNote.trim() && addEvent("custom", eventNote.trim())
                }
              />
              <button
                onClick={() => eventNote.trim() && addEvent("custom", eventNote.trim())}
                className="bg-orange-100 text-orange-500 rounded-xl px-3"
              >
                <Plus size={18} />
              </button>
            </div>
          </section>

          {/* メモ */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">📝 メモ</h2>
            <textarea
              className="w-full text-sm border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              rows={3}
              placeholder="体調全般のメモ"
              value={record.note ?? ""}
              onChange={(e) => update({ note: e.target.value })}
            />
          </section>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-colors text-base ${
              saved ? "bg-green-400" : "bg-orange-500 active:bg-orange-600"
            } disabled:opacity-50`}
          >
            {saving ? "保存中…" : saved ? "✓ 保存しました" : "保存する"}
          </button>
        </main>
      )}

      <BottomNav />
    </div>
  );
}
