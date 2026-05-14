export interface MedicalHistoryItem {
  id: string;
  date: string;        // 例："2023年5月"
  description: string; // 例："尿路結石で手術"
}

export interface FoodItem {
  id: string;
  name: string; // 例："ロイヤルカナン 腎臓サポート"
  note: string; // 例："朝晩各40g"
}

export interface Cat {
  id: string;
  name: string;
  breed?: string;
  birthDate?: string;
  sex?: "male" | "female";
  photoUrl?: string;
  color?: string;
  // かかりつけ医
  vetName?: string;
  vetPhone?: string;
  vetAddress?: string;
  // 健康情報
  medicalHistory?: MedicalHistoryItem[];
  allergies?: string;
  // 食事情報
  foodNotes?: FoodItem[];
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dose?: string;
  given: boolean;
  time?: string;
}

export type HealthEventType = "vomit" | "diarrhea" | "hospital" | "custom";

export interface HealthEvent {
  id: string;
  type: HealthEventType;
  label: string;
  time?: string;
  note?: string;
}

export interface DailyRecord {
  id: string;
  catId: string;
  date: string; // YYYY-MM-DD
  urineCount: number;
  urineNote?: string;
  poopCount: number;
  poopNote?: string;
  weight?: number;
  medications: Medication[];
  events: HealthEvent[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}
