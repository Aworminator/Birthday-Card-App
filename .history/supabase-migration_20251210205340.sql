-- Create share_sessions table
CREATE TABLE IF NOT EXISTS share_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  theme TEXT NOT NULL CHECK (theme IN ('birthday', 'christmas', 'neutral')),
  header_text TEXT NOT NULL DEFAULT '',
  custom_music_url TEXT,
  use_default_music BOOLEAN NOT NULL DEFAULT false,
  automatic_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on share_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_share_sessions_share_id ON share_sessions(share_id);

-- Enable Row Level Security
ALTER TABLE share_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read share sessions
CREATE POLICY "Anyone can read share sessions"
  ON share_sessions
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert share sessions
CREATE POLICY "Anyone can create share sessions"
  ON share_sessions
  FOR INSERT
  WITH CHECK (true);
