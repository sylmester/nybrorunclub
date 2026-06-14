export type RaceStatus = "pending" | "active" | "finished";

export interface Race {
  id: string;
  name: string;
  date: string;
  description: string | null;
  laps_count: number;
  lap_distance_m: number;
  available_laps: number[];
  status: RaceStatus;
  started_at: string | null;
  created_at: string;
  ended_at: string | null;
  is_visible: boolean;
}

export interface Participant {
  id: string;
  race_id: string;
  bib_number: number | null;
  name: string;
  email: string | null;
  gender: string | null;
  birth_year: number | null;
  team: string | null;
  is_member: boolean;
  comments: string | null;
  paid: boolean;
  laps_count: number | null;
  created_at: string;
}

export interface Lap {
  id: string;
  race_id: string;
  participant_id: string;
  lap_number: number;
  recorded_at: string;
  elapsed_ms: number;
}

export type Post = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  hero_image_url: string | null;
  images: string[] | null;
  is_visible: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
