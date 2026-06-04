export type RaceStatus = "pending" | "active" | "finished";

export interface RaceCategory {
  name: string;
  laps_count: number;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  description: string | null;
  laps_count: number;
  lap_distance_m: number;
  status: RaceStatus;
  started_at: string | null;
  created_at: string;
  categories: RaceCategory[];
  ended_at: string | null;
  is_visible: boolean;
}

export interface Runner {
  id: string;
  race_id: string;
  bib_number: number;
  name: string | null;
  gender: string | null;
  team: string | null;
  country: string | null;
  laps_count: number | null; // overrides race default if set
}

export interface Lap {
  id: string;
  race_id: string;
  runner_id: string;
  lap_number: number;
  recorded_at: string;
  elapsed_ms: number;
}
