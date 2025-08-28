-- Sprint 2 Enhancement Migration for HeyMax_shop_bot
-- Enhanced analytics and tracking features for viral social commerce

-- Add new columns to link_generations table for enhanced tracking
ALTER TABLE link_generations ADD COLUMN tracking_id TEXT;
ALTER TABLE link_generations ADD COLUMN affiliate_link TEXT;
ALTER TABLE link_generations ADD COLUMN utm_source TEXT DEFAULT 'telegram';
ALTER TABLE link_generations ADD COLUMN utm_campaign TEXT DEFAULT 'viral_social_commerce';
ALTER TABLE link_generations ADD COLUMN search_term TEXT;
ALTER TABLE link_generations ADD COLUMN results_count INTEGER DEFAULT 0;

-- Add performance indexes for new columns
CREATE INDEX idx_link_generations_tracking_id ON link_generations(tracking_id);
CREATE INDEX idx_link_generations_search_term ON link_generations(search_term);

-- Add enhanced user tracking columns
ALTER TABLE users ADD COLUMN last_activity TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN language_code TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN search_count INTEGER DEFAULT 0;

-- Create search_analytics table for detailed search metrics
CREATE TABLE search_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  search_term TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  query_timestamp TIMESTAMP DEFAULT NOW(),
  chat_type TEXT,
  language_code TEXT DEFAULT 'en',
  response_time_ms INTEGER
);

-- Indexes for search analytics performance
CREATE INDEX idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_timestamp ON search_analytics(query_timestamp);
CREATE INDEX idx_search_analytics_search_term ON search_analytics(search_term);
CREATE INDEX idx_search_analytics_results ON search_analytics(results_count);

-- Create viral_interactions table for tracking viral mechanics (Sprint 3 prep)
CREATE TABLE viral_interactions (
  id BIGSERIAL PRIMARY KEY,
  original_user_id BIGINT REFERENCES users(id),
  viral_user_id BIGINT REFERENCES users(id),
  merchant_slug TEXT REFERENCES merchants(merchant_slug),
  chat_id BIGINT,
  interaction_type TEXT DEFAULT 'callback_query',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT different_users CHECK (original_user_id != viral_user_id)
);

-- Indexes for viral analytics
CREATE INDEX idx_viral_interactions_original_user ON viral_interactions(original_user_id);
CREATE INDEX idx_viral_interactions_viral_user ON viral_interactions(viral_user_id);
CREATE INDEX idx_viral_interactions_merchant ON viral_interactions(merchant_slug);
CREATE INDEX idx_viral_interactions_created_at ON viral_interactions(created_at);

-- Create user_stats table for performance metrics
CREATE TABLE user_stats (
  user_id BIGINT PRIMARY KEY REFERENCES users(id),
  total_searches INTEGER DEFAULT 0,
  total_links_generated INTEGER DEFAULT 0,
  total_viral_triggers INTEGER DEFAULT 0,
  first_search_at TIMESTAMP,
  last_search_at TIMESTAMP,
  most_searched_merchant TEXT,
  avg_results_per_search DECIMAL(4,2) DEFAULT 0.0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for user stats queries
CREATE INDEX idx_user_stats_updated_at ON user_stats(updated_at);
CREATE INDEX idx_user_stats_total_searches ON user_stats(total_searches);

-- RLS policies for new tables
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access for search_analytics" ON search_analytics FOR ALL USING (true);
CREATE POLICY "Public access for viral_interactions" ON viral_interactions FOR ALL USING (true);
CREATE POLICY "Public access for user_stats" ON user_stats FOR ALL USING (true);

-- Create stored procedure for updating user stats efficiently
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id BIGINT, p_action TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_searches, first_search_at, last_search_at, updated_at)
  VALUES (p_user_id, 1, NOW(), NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    total_searches = user_stats.total_searches + 1,
    last_search_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function for calculating viral coefficient
CREATE OR REPLACE FUNCTION calculate_viral_coefficient(days_back INTEGER DEFAULT 7)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  total_users INTEGER;
  viral_interactions INTEGER;
  coefficient DECIMAL(4,2);
BEGIN
  -- Get total active users in the specified period
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM link_generations
  WHERE generated_at > NOW() - INTERVAL '1 day' * days_back;
  
  -- Get total viral interactions in the same period
  SELECT COUNT(*) INTO viral_interactions
  FROM viral_interactions
  WHERE created_at > NOW() - INTERVAL '1 day' * days_back;
  
  -- Calculate coefficient (viral_interactions / total_users)
  IF total_users > 0 THEN
    coefficient := viral_interactions::DECIMAL / total_users::DECIMAL;
  ELSE
    coefficient := 0.0;
  END IF;
  
  RETURN coefficient;
END;
$$ LANGUAGE plpgsql;

-- Create view for analytics dashboard
CREATE VIEW analytics_summary AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT lg.user_id) as active_users_7d,
  COUNT(lg.id) as total_links_generated,
  AVG(sa.results_count) as avg_results_per_search,
  COUNT(DISTINCT sa.search_term) as unique_search_terms,
  calculate_viral_coefficient(7) as viral_coefficient_7d
FROM users u
LEFT JOIN link_generations lg ON u.id = lg.user_id AND lg.generated_at > NOW() - INTERVAL '7 days'
LEFT JOIN search_analytics sa ON u.id = sa.user_id AND sa.query_timestamp > NOW() - INTERVAL '7 days';

-- Grant necessary permissions for the analytics view
GRANT SELECT ON analytics_summary TO public;