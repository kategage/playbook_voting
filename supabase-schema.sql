-- State of Cibola Election Portal Database Schema
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

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  round INTEGER NOT NULL CHECK (round >= 1 AND round <= 4),
  criterion TEXT NOT NULL,
  rankings JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, round, criterion)
);

-- Round locks table
CREATE TABLE IF NOT EXISTS round_locks (
  round INTEGER PRIMARY KEY CHECK (round >= 1 AND round <= 4),
  is_locked BOOLEAN DEFAULT FALSE
);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Criteria table (configurable assessment criteria)
CREATE TABLE IF NOT EXISTS criteria (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  rounds INTEGER[] NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Enable read access for all users" ON round_locks FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON round_locks FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON app_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON app_settings FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON criteria FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON criteria FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON criteria FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON criteria FOR DELETE USING (true);

-- Insert initial data
INSERT INTO teams (id, name, code) VALUES
  (1, 'Vega', 'NOVA47'),
  (2, 'Spence', 'ORBIT92'),
  (3, 'Sterling', 'COSMO38'),
  (4, 'Strongbow', 'LUNAR65'),
  (5, 'Thorne', 'ASTRO21')
ON CONFLICT (id) DO NOTHING;

INSERT INTO round_locks (round, is_locked) VALUES
  (1, false),
  (2, false),
  (3, false),
  (4, false)
ON CONFLICT (round) DO NOTHING;

INSERT INTO criteria (id, name, icon, rounds, description, display_order, is_active) VALUES
  ('creativity', 'Creativity', '🎨', ARRAY[1,2,3,4], 'Originality and innovative thinking', 1, true),
  ('effectiveness', 'Effectiveness', '⚡', ARRAY[1,2,3,4], 'Impact and measurable results', 2, true),
  ('adaptation', 'Adaptation', '🔄', ARRAY[4], 'Ability to adjust and improve based on feedback', 3, true)
ON CONFLICT (id) DO NOTHING;
