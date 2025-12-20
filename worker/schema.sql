-- Create semantic cache table
CREATE TABLE IF NOT EXISTS semantic_cache (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'chat' or 'completion'
  text TEXT NOT NULL,
  embedding TEXT NOT NULL, -- JSON array of floats
  response TEXT NOT NULL, -- JSON response
  model TEXT NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  tokens_total INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_kind ON semantic_cache(project_id, kind);
CREATE INDEX IF NOT EXISTS idx_timestamp ON semantic_cache(timestamp);
