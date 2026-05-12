export interface Cat {
  id: string;
  name: string;
  breed?: string;
  birthDate?: string;
  color?: string;
  sex?: "male" | "female";
  photoUrl?: string;
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
