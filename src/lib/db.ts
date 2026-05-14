import { supabase } from "./supabase";
import type { Cat, DailyRecord } from "./types";

// ---- 型変換ヘルパー ----

/** DB行 → TypeScript の Cat 型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCat(row: any): Cat {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed ?? undefined,
    birthDate: row.birth_date ?? undefined,
    sex: row.sex ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.created_at,
  };
}

/** TypeScript の Cat 型 → DB行 */
function catToRow(cat: Cat, userId: string) {
  return {
    id: cat.id,
    user_id: userId,
    name: cat.name,
    breed: cat.breed ?? null,
    birth_date: cat.birthDate ?? null,
    sex: cat.sex ?? null,
    photo_url: cat.photoUrl ?? null,
    color: cat.color ?? null,
    created_at: cat.createdAt,
  };
}

/** DB行 → TypeScript の DailyRecord 型 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecord(row: any): DailyRecord {
  return {
    id: row.id,
    catId: row.cat_id,
    date: row.date,
    urineCount: row.urine_count,
    urineNote: row.urine_note ?? undefined,
    poopCount: row.poop_count,
    poopNote: row.poop_note ?? undefined,
    weight: row.weight ?? undefined,
    medications: row.medications ?? [],
    events: row.events ?? [],
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** TypeScript の DailyRecord 型 → DB行 */
function recordToRow(record: DailyRecord, userId: string) {
  return {
    id: record.id,
    cat_id: record.catId,
    user_id: userId,
    date: record.date,
    urine_count: record.urineCount,
    urine_note: record.urineNote ?? null,
    poop_count: record.poopCount,
    poop_note: record.poopNote ?? null,
    weight: record.weight ?? null,
    medications: record.medications,
    events: record.events,
    note: record.note ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

/** 現在のログインユーザーIDを取得 */
async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("未ログインです");
  return user.id;
}

// ---- Cats ----

/** ログインユーザーの猫一覧を取得 */
export async function getCats(): Promise<Cat[]> {
  const { data, error } = await supabase
    .from("cats")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(rowToCat);
}

/** 猫を保存（新規 or 更新） */
export async function saveCat(cat: Cat): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("cats")
    .upsert(catToRow(cat, userId), { onConflict: "id" });

  if (error) throw error;
}

/** 猫を削除（関連する記録も CASCADE で削除される） */
export async function deleteCat(id: string): Promise<void> {
  const { error } = await supabase.from("cats").delete().eq("id", id);
  if (error) throw error;
}

// ---- Daily Records ----

/** 指定した猫の記録一覧を取得（日付降順） */
export async function getRecords(catId: string): Promise<DailyRecord[]> {
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("cat_id", catId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data.map(rowToRecord);
}

/** 指定した猫の特定日の記録を取得（なければ null） */
export async function getRecord(
  catId: string,
  date: string
): Promise<DailyRecord | null> {
  const { data, error } = await supabase
    .from("daily_records")
    .select("*")
    .eq("cat_id", catId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRecord(data) : null;
}

/** 記録を保存（新規 or 更新） */
export async function saveRecord(record: DailyRecord): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("daily_records")
    .upsert(recordToRow(record, userId), { onConflict: "id" });

  if (error) throw error;
}
