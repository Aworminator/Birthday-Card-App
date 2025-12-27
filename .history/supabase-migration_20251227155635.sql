-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'neutral' CHECK (theme IN ('birthday', 'christmas', 'neutral')),
  header_text TEXT NOT NULL DEFAULT '',
  custom_music_url TEXT,
  use_default_music BOOLEAN NOT NULL DEFAULT false,
  automatic_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add project_id to birthday_cards table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='birthday_cards' AND column_name='project_id') THEN
    ALTER TABLE birthday_cards ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
    ALTER TABLE birthday_cards ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add sort_order column to birthday_cards for drag-and-drop ordering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='birthday_cards' AND column_name='sort_order'
  ) THEN
    ALTER TABLE birthday_cards ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
    -- Backfill sort_order per project based on created_at ascending
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) - 1 AS rn
      FROM birthday_cards
    )
    UPDATE birthday_cards bc
    SET sort_order = ranked.rn
    FROM ranked
    WHERE bc.id = ranked.id;
  END IF;
END $$;

-- Create share_sessions table
CREATE TABLE IF NOT EXISTS share_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create invite_sessions table for guest card submissions
CREATE TABLE IF NOT EXISTS invite_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_birthday_cards_project_id ON birthday_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_birthday_cards_user_id ON birthday_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_share_sessions_share_id ON share_sessions(share_id);
CREATE INDEX IF NOT EXISTS idx_share_sessions_project_id ON share_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_invite_sessions_invite_id ON invite_sessions(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_sessions_project_id ON invite_sessions(project_id);

-- Add expires_at column to invite_sessions for automatic expiry (48 hours)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='invite_sessions' AND column_name='expires_at'
  ) THEN
    ALTER TABLE invite_sessions ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '48 hours');
    CREATE INDEX IF NOT EXISTS idx_invite_sessions_expires_at ON invite_sessions(expires_at);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view their own cards" ON birthday_cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON birthday_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON birthday_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON birthday_cards;

-- Public read access for shared content (drop if exists to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can view shared projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view cards of shared projects" ON birthday_cards;

DROP POLICY IF EXISTS "Anyone can read share sessions" ON share_sessions;
DROP POLICY IF EXISTS "Authenticated users can create share sessions for their projects" ON share_sessions;

DROP POLICY IF EXISTS "Anyone can read invite sessions" ON invite_sessions;
DROP POLICY IF EXISTS "Authenticated users can create invite sessions for their projects" ON invite_sessions;
DROP POLICY IF EXISTS "Anyone can update invite session used status" ON invite_sessions;

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Birthday cards policies
CREATE POLICY "Users can view their own cards"
  ON birthday_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON birthday_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON birthday_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON birthday_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Share sessions policies
CREATE POLICY "Anyone can read share sessions"
  ON share_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create share sessions for their projects"
  ON share_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = share_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Invite sessions policies
CREATE POLICY "Anyone can read invite sessions"
  ON invite_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create invite sessions for their projects"
  ON invite_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = invite_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can update invite session used status"
  ON invite_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Public read access for shared projects and their cards
-- Allow anyone (including anonymous users) to SELECT projects that have an active share_session
CREATE POLICY "Anyone can view shared projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_sessions
      WHERE share_sessions.project_id = projects.id
    )
  );

-- Allow anyone to SELECT birthday_cards that belong to a project with an active share_session
CREATE POLICY "Anyone can view cards of shared projects"
  ON birthday_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_sessions
      WHERE share_sessions.project_id = birthday_cards.project_id
    )
  );

-- Schedule deletion of expired invites using pg_cron (runs hourly)
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete_expired_invites') THEN
    PERFORM cron.schedule(
      'delete_expired_invites',
      '0 * * * *',
      $$DELETE FROM invite_sessions WHERE expires_at IS NOT NULL AND expires_at < NOW();$$
    );
  END IF;
END $$;
