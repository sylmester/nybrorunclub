export type RaceStatus = "pending" | "active" | "finished";

export interface Race {
  id: string;
  name: string;
  date: string;
  laps_count: number;
  lap_distance_m: number;
  status: RaceStatus;
  started_at: string | null;
  created_at: string;
}

export interface Runner {
  id: string;
  race_id: string;
  bib_number: number;
  name: string | null;
}

export interface Lap {
  id: string;
  race_id: string;
  runner_id: string;
  lap_number: number;
  recorded_at: string;
  elapsed_ms: number;
}
