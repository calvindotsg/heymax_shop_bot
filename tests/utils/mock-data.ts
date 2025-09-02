// Mock data and test fixtures for HeyMax Shop Bot tests
// Centralized test data to ensure consistency across test files

export interface MockMerchant {
  merchant_slug: string;
  merchant_name: string;
  tracking_link: string;
  base_mpd: number;
}

export interface MockUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  language_code?: string;
}

// Comprehensive merchant test data
export const MERCHANTS: MockMerchant[] = [
  {
    merchant_slug: "pelago",
    merchant_name: "Pelago by Singapore Airlines",
    tracking_link: "https://pelago.com/?ref={{USER_ID}}",
    base_mpd: 8.0,
  },
  {
    merchant_slug: "klook",
    merchant_name: "Klook",
    tracking_link: "https://klook.com/?ref={{USER_ID}}",
    base_mpd: 6.5,
  },
  {
    merchant_slug: "amazon-singapore",
    merchant_name: "Amazon Singapore",
    tracking_link: "https://amazon.sg/?ref={{USER_ID}}",
    base_mpd: 4.0,
  },
  {
    merchant_slug: "shopee-singapore",
    merchant_name: "Shopee Singapore",
    tracking_link: "https://shopee.sg/?ref={{USER_ID}}",
    base_mpd: 3.5,
  },
  {
    merchant_slug: "apple-singapore",
    merchant_name: "Apple Singapore",
    tracking_link: "https://apple.com/sg/?ref={{USER_ID}}",
    base_mpd: 2.0,
  },
];

// Test users
export const MOCK_USER: MockUser = {
  id: 123456789,
  is_bot: false,
  first_name: "TestUser",
  username: "testuser",
  language_code: "en",
};

export const MOCK_VIRAL_USER: MockUser = {
  id: 987654321,
  is_bot: false,
  first_name: "ViralUser",
  username: "viraluser",
};

export const MOCK_CHAT = {
  id: -1001234567890,
  type: "supergroup",
  title: "Test Supergroup",
};

export const USERS: Record<string, MockUser> = {
  primary: {
    id: 123456789,
    is_bot: false,
    first_name: "PrimaryUser",
    username: "primaryuser",
    language_code: "en",
  },
  viral: {
    id: 987654321,
    is_bot: false,
    first_name: "ViralUser",
    username: "viraluser",
    language_code: "en",
  },
  noUsername: {
    id: 555666777,
    is_bot: false,
    first_name: "NoUsernameUser",
  },
};

// Search test cases for match scoring
export const SEARCH_TEST_CASES = [
  {
    merchantName: "Shopee Singapore",
    searchTerm: "shopee",
    expectedScore: 0.9,
  },
  { merchantName: "Shopee Singapore", searchTerm: "shop", expectedScore: 0.9 },
  {
    merchantName: "Amazon Singapore",
    searchTerm: "amazon",
    expectedScore: 0.9,
  },
  { merchantName: "Klook", searchTerm: "klook", expectedScore: 1.0 },
  { merchantName: "Food Panda", searchTerm: "food", expectedScore: 0.9 },
  { merchantName: "McDonald's", searchTerm: "mcd", expectedScore: 0.6 },
  { merchantName: "Starbucks", searchTerm: "star", expectedScore: 0.9 },
  { merchantName: "Apple Store", searchTerm: "apple", expectedScore: 0.9 },
];

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  matchScoring: 100, // ms for 1000 operations
  commonChars: 50, // ms for 1000 operations
  queryResponse: 1000, // ms for full query processing
  databaseQuery: 500, // ms for database operations
};

// Expected UTM parameters for affiliate links
export const EXPECTED_UTM_PARAMS = [
  "utm_source=telegram",
  "utm_medium=heymax_shop_bot",
  "utm_campaign=viral_social_commerce",
];

// Analytics test data
export const MOCK_ANALYTICS = {
  user_metrics: {
    total_users: 150,
    active_users_24h: 25,
    active_users_7d: 80,
  },
  link_metrics: {
    total_links_generated: 320,
    links_generated_24h: 45,
    links_generated_7d: 180,
  },
  viral_metrics: {
    total_viral_interactions: 85,
    viral_interactions_7d: 60,
    viral_coefficient_7d: 1.35,
  },
  performance_metrics: {
    avg_response_time_ms: 245,
    uptime_percentage: 99.8,
    error_rate_percentage: 0.2,
  },
};

// Viral flow test data
export const VIRAL_FLOW_DATA = {
  original_interaction: {
    user_id: USERS.primary.id,
    merchant_slug: "shopee-singapore",
    generated_at: new Date().toISOString(),
  },
  viral_callback: {
    action: "generate",
    merchant_slug: "shopee-singapore",
    original_user_id: USERS.primary.id,
    viral_user_id: USERS.viral.id,
  },
  expected_coefficient_increase: 0.01, // Minimum expected increase
};
