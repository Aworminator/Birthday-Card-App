import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide clear guidance during dev rather than crashing obscurely
  console.error(
    "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
  );
  throw new Error("Supabase configuration missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BirthdayCard = {
  id: string;
  name: string;
  image_url: string;
  audio_url: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  theme: "birthday" | "christmas" | "neutral";
  header_text: string;
  custom_music_url: string | null;
  use_default_music: boolean;
  automatic_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type ShareSession = {
  id: string;
  share_id: string;
  project_id: string;
  created_at: string;
};

export type InviteSession = {
  id: string;
  invite_id: string;
  project_id: string;
  access_code: string;
  used: boolean;
  created_at: string;
  used_at: string | null;
};
