-- State of Cibola Election Portal Database Schema (Updated)
-- Run this in Supabase SQL Editor

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voters table
CREATE TABLE IF NOT EXISTS voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id TEXT UNIQUE NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table (supports both slider scores and rankings)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  phase INTEGER NOT NULL CHECK (phase >= 1 AND phase <= 4),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('slider', 'ranking')),
  vote_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, phase)
);

-- Phase locks table (renamed from round_locks)
CREATE TABLE IF NOT EXISTS phase_locks (
  phase INTEGER PRIMARY KEY CHECK (phase >= 1 AND phase <= 4),
  phase_name TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE
);

-- Bonus points table
CREATE TABLE IF NOT EXISTS bonus_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INTEGER REFERENCES teams(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  awarded_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Enable read access for all users" ON teams FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON teams FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON voters FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON voters FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON voters FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON voters FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON phase_locks FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON phase_locks FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON bonus_points FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON bonus_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON bonus_points FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON app_settings FOR UPDATE USING (true);

-- Insert initial data
INSERT INTO teams (id, name, code) VALUES
  (1, 'Vega', 'NOVA47'),
  (2, 'Spence', 'ORBIT92'),
  (3, 'Sterling', 'COSMO38'),
  (4, 'Strongbow', 'LUNAR65'),
  (5, 'Thorne', 'ASTRO21')
ON CONFLICT (id) DO NOTHING;

INSERT INTO phase_locks (phase, phase_name, is_locked) VALUES
  (1, 'THE LAUNCH', false),
  (2, 'THE GOVERNANCE TEST', false),
  (3, 'THE DATA BLACKOUT', false),
  (4, 'THE FINAL ELECTION', false)
ON CONFLICT (phase) DO NOTHING;

-- Migration note: If upgrading from old schema, run these commands:
-- DROP TABLE IF EXISTS criteria CASCADE;
-- DROP TABLE IF EXISTS round_locks CASCADE;
-- You may need to migrate existing votes data manually
