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
  created_at: string;
  updated_at: string;
};
