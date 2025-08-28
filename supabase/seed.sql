-- Seed data for HeyMax_shop_bot MVP
-- Loading Singapore merchant dataset for TDD testing

-- Insert sample merchants from Singapore dataset for testing
INSERT INTO merchants (merchant_slug, merchant_name, tracking_link, base_mpd) VALUES
  ('klook', 'Klook', 'https://affiliate.klook.com/redirect?aid=81875&aff_ext=telegram{{USER_ID}}&aff_offer_uuid=26m0jTFgTKSWP60vonAi4w&k_site=https%3A%2F%2Fwww.klook.com%2F', 2.0),
  ('hotels-com', 'Hotels.com', 'https://hotels.com/sg?user_id={{USER_ID}}&utm_source=telegram', 1.4),
  ('pelago-by-singapore-airlines', 'Pelago by Singapore Airlines', 'https://pelago.pxf.io/Wqa5xZ?subid1=telegram{{USER_ID}}', 8.0),
  ('shopee-sg', 'Shopee Singapore', 'https://shopee.sg/?utm_source=telegram&user_id={{USER_ID}}', 3.5),
  ('grab-sg', 'Grab Singapore', 'https://grab.com/sg/?ref=telegram{{USER_ID}}', 2.8);

-- Insert test users for TDD validation
INSERT INTO users (id, username, first_seen, link_count) VALUES
  (12345678, 'testuser1', NOW(), 0),
  (87654321, 'testuser2', NOW() - INTERVAL '1 day', 2),
  (11111111, 'maxtan', NOW() - INTERVAL '7 days', 15);

-- Insert sample link generations for viral tracking tests
INSERT INTO link_generations (user_id, merchant_slug, generated_at, chat_id, chat_type, unique_link) VALUES
  (12345678, 'pelago-by-singapore-airlines', NOW(), -1001234567890, 'supergroup', 'https://pelago.pxf.io/Wqa5xZ?subid1=telegram12345678'),
  (87654321, 'klook', NOW() - INTERVAL '2 hours', -1001234567890, 'supergroup', 'https://affiliate.klook.com/redirect?aid=81875&aff_ext=telegram87654321&aff_offer_uuid=26m0jTFgTKSWP60vonAi4w&k_site=https%3A%2F%2Fwww.klook.com%2F'),
  (11111111, 'shopee-sg', NOW() - INTERVAL '1 day', -1009876543210, 'group', 'https://shopee.sg/?utm_source=telegram&user_id=11111111');