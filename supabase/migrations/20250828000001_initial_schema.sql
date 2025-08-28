-- Initial database schema for HeyMax_shop_bot
-- Following TDD approach: GREEN phase - make tests pass

-- Users table for Telegram user tracking
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_seen TIMESTAMP DEFAULT NOW(),
  link_count INTEGER DEFAULT 0,
  CONSTRAINT check_link_count_positive CHECK (link_count >= 0)
);

-- Index for performance optimization
CREATE INDEX idx_users_username ON users(username);

-- Merchants table for Singapore affiliate dataset
CREATE TABLE merchants (
  merchant_slug TEXT PRIMARY KEY,
  merchant_name TEXT NOT NULL,
  tracking_link TEXT NOT NULL,
  base_mpd DECIMAL(4,1) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for search performance
CREATE INDEX idx_merchants_name ON merchants(merchant_name);

-- Link generations table for tracking viral growth
CREATE TABLE link_generations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  merchant_slug TEXT REFERENCES merchants(merchant_slug),
  generated_at TIMESTAMP DEFAULT NOW(),
  chat_id BIGINT,
  chat_type TEXT, -- 'group', 'supergroup', 'channel'
  unique_link TEXT NOT NULL
);

-- Performance indexes for link_generations table
CREATE INDEX idx_link_generations_user_id ON link_generations(user_id);
CREATE INDEX idx_link_generations_merchant ON link_generations(merchant_slug);
CREATE INDEX idx_link_generations_chat ON link_generations(chat_id);
CREATE INDEX idx_link_generations_generated_at ON link_generations(generated_at);

-- Performance optimization for viral tracking queries
CREATE INDEX idx_link_generations_viral_metrics ON link_generations(generated_at, chat_id, merchant_slug);

-- RLS (Row Level Security) policies for production security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_generations ENABLE ROW LEVEL SECURITY;

-- Allow public read access for bot functionality (suitable for MVP)
CREATE POLICY "Public read access for users" ON users FOR SELECT USING (true);
CREATE POLICY "Public insert access for users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for users" ON users FOR UPDATE USING (true);

CREATE POLICY "Public read access for merchants" ON merchants FOR SELECT USING (true);
CREATE POLICY "Public insert access for merchants" ON merchants FOR INSERT WITH CHECK (true);

CREATE POLICY "Public access for link_generations" ON link_generations FOR ALL USING (true);