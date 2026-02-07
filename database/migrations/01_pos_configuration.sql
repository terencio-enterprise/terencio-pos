-- Create POS Configuration Table
-- This table stores the POS identity and sync information from the backend
CREATE TABLE IF NOT EXISTS pos_configuration (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one row allowed
  pos_id TEXT NOT NULL,
  pos_name TEXT NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  device_id TEXT NOT NULL,
  registration_code TEXT,
  registered_at TEXT NOT NULL,
  last_sync_at TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_pos_config_active ON pos_configuration(is_active);
