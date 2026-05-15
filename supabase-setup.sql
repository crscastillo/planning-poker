-- Create the sessions table with JSONB storage
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on expires_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since we're using anon key)
-- In production, you may want more restrictive policies
CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to automatically delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to clean up expired sessions
-- This requires the pg_cron extension (available in Supabase)
-- Run this in the Supabase SQL Editor:
-- SELECT cron.schedule(
--   'delete-expired-sessions',
--   '*/15 * * * *', -- Every 15 minutes
--   $$ SELECT delete_expired_sessions(); $$
-- );

-- Or you can manually run: SELECT delete_expired_sessions();
