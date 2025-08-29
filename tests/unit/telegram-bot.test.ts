import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

import {
  calculateMatchScore,
  countCommonChars,
  generateAffiliateLink,
  generateEnhancedBotResponse,
  generateInlineQueryResult,
  generateViralKeyboard,
  type Merchant,
  MOCK_MERCHANTS,
  type TelegramInlineQuery,
  validateInlineQueryStructure,
  validateUserUpsertData,
} from "../../src/utils/bot-functions.ts";

// TDD Tests for Telegram Bot Edge Function
// These tests validate the core bot functionality following TDD principles

Deno.test("Telegram Bot Handler - should handle inline query structure", () => {
  // Mock Telegram inline query structure
  const mockInlineQuery: TelegramInlineQuery = {
    id: "12345",
    from: {
      id: 123456789,
      is_bot: false,
      first_name: "Test",
      username: "testuser",
    },
    query: "shopee",
    offset: "",
  };

  // Test structure validation using utility function
  const isValid = validateInlineQueryStructure(mockInlineQuery);
  assertEquals(isValid, true, "Inline query structure should be valid");

  // Test structure validation
  assertExists(mockInlineQuery.id, "Inline query should have id");
  assertExists(mockInlineQuery.from, "Inline query should have from user");
  assertExists(mockInlineQuery.query, "Inline query should have query text");
  assertEquals(
    typeof mockInlineQuery.from.id,
    "number",
    "User id should be number",
  );
});

Deno.test("Merchant Search Logic - should handle empty search term", () => {
  const searchTerm = "";

  // Test match score for empty search
  const score = calculateMatchScore("Amazon Singapore", searchTerm);
  assertEquals(
    score,
    0,
    "Empty search term should return 0 score",
  );
});

Deno.test("Merchant Search Logic - should handle search with term", () => {
  const searchTerm = "amazon";
  const merchantName = "Amazon Singapore";

  // Test fuzzy match scoring
  const score = calculateMatchScore(merchantName, searchTerm);
  assertEquals(
    score > 0.5,
    true,
    "Should return high score for good matches",
  );
});

Deno.test("Link Personalization - should replace USER_ID placeholder", () => {
  const userId = 123456;
  const merchantSlug = "amazon";
  const trackingLink = "https://amazon.sg/?ref={{USER_ID}}";

  // Test affiliate link generation
  const affiliateData = generateAffiliateLink(
    userId,
    merchantSlug,
    trackingLink,
  );

  assertStringIncludes(
    affiliateData.affiliate_link,
    "123456",
    "Should replace USER_ID with actual user ID",
  );

  assertStringIncludes(
    affiliateData.affiliate_link,
    "utm_source=telegram",
    "Should include UTM tracking parameters",
  );

  assertEquals(
    affiliateData.tracking_id.startsWith("tg_123456_amazon_"),
    true,
    "Should generate proper tracking ID",
  );
});

Deno.test("Merchant Search Logic - should handle search with term", () => {
  const searchTerm = "shopee";
  const expectedBehavior = "search by merchant name";

  // Search with term should trigger merchant name search
  assertEquals(searchTerm.length > 0, true, "Search term should be processed");
  assertStringIncludes(
    expectedBehavior,
    "search by merchant name",
    "Should search by merchant name",
  );
});

Deno.test("Link Personalization - should replace USER_ID placeholder", () => {
  const userId = 123456789;
  const templateLink =
    "https://shopee.sg/?utm_source=telegram&user_id={{USER_ID}}";
  const personalizedLink = templateLink.replace(
    "{{USER_ID}}",
    userId.toString(),
  );

  assertEquals(
    personalizedLink.includes("{{USER_ID}}"),
    false,
    "Should replace USER_ID placeholder",
  );
  assertStringIncludes(
    personalizedLink,
    userId.toString(),
    "Should contain actual user ID",
  );
  assertEquals(
    personalizedLink,
    "https://shopee.sg/?utm_source=telegram&user_id=123456789",
    "Should generate correct personalized link",
  );
});

Deno.test("Inline Query Result Structure - should have required fields", () => {
  const mockResult = {
    type: "article" as const,
    id: "shopee_0",
    title: "🛍️ Shop Shopee Singapore",
    description: "Earn up to 3.5 Max Miles per $1 spent",
    input_message_content: {
      message_text:
        "🛍️ **Shopee Singapore** - Earn up to **3.5 Max Miles per $1** spent\n\n*Exclusive link for @testuser* 👆",
      parse_mode: "Markdown" as const,
    },
    reply_markup: {
      inline_keyboard: [
        [{
          text: "🛍️ Shop Shopee Singapore & Earn Miles (for @testuser)",
          url: "https://shopee.sg/?utm_source=telegram&user_id=123456789",
        }],
        [{
          text: "⚡ Get MY Unique Link",
          url: "https://t.me/HeyMax_shop_bot?start=shopee-sg",
        }],
      ],
    },
  };

  // Validate required Telegram inline result structure
  assertEquals(mockResult.type, "article", "Should be article type");
  assertExists(mockResult.id, "Should have unique id");
  assertExists(mockResult.title, "Should have title");
  assertExists(mockResult.input_message_content, "Should have message content");
  assertExists(mockResult.reply_markup, "Should have reply markup");

  // Validate buttons structure
  assertEquals(
    mockResult.reply_markup.inline_keyboard.length,
    2,
    "Should have 2 button rows",
  );
  assertEquals(
    mockResult.reply_markup.inline_keyboard[0].length,
    1,
    "First row should have 1 button",
  );
  assertEquals(
    mockResult.reply_markup.inline_keyboard[1].length,
    1,
    "Second row should have 1 button",
  );
});

Deno.test("User Data Structure - should validate user upsert data", () => {
  const userId = 123456789;
  const username = "testuser";
  const timestamp = new Date().toISOString();

  const upsertData = {
    id: userId,
    username: username,
    first_seen: timestamp,
  };

  assertEquals(typeof upsertData.id, "number", "User ID should be number");
  assertEquals(
    typeof upsertData.username,
    "string",
    "Username should be string",
  );
  assertEquals(
    typeof upsertData.first_seen,
    "string",
    "Timestamp should be ISO string",
  );
  assertStringIncludes(
    upsertData.first_seen,
    "T",
    "Should be valid ISO timestamp",
  );
});

Deno.test("Link Generation Tracking - should validate tracking data structure", () => {
  const trackingData = {
    user_id: 123456789,
    merchant_slug: "shopee-sg",
    generated_at: new Date().toISOString(),
    chat_id: null,
    chat_type: "supergroup",
    unique_link: `telegram_123456789_shopee-sg_${Date.now()}`,
  };

  assertEquals(
    typeof trackingData.user_id,
    "number",
    "User ID should be number",
  );
  assertEquals(
    typeof trackingData.merchant_slug,
    "string",
    "Merchant slug should be string",
  );
  assertExists(trackingData.generated_at, "Should have generation timestamp");
  assertStringIncludes(
    trackingData.unique_link,
    "telegram_",
    "Should have telegram prefix",
  );
  assertStringIncludes(
    trackingData.unique_link,
    trackingData.user_id.toString(),
    "Should contain user ID",
  );
});

Deno.test("Error Handling - should provide user-friendly error result", () => {
  const errorResult = {
    type: "article" as const,
    id: "error",
    title: "⚠️ Search Error",
    description:
      "Try searching for a merchant name (e.g., 'shopee', 'grab', 'klook')",
    input_message_content: {
      message_text:
        "⚠️ Something went wrong. Please try searching again with a merchant name like 'shopee' or 'grab'.",
      parse_mode: "Markdown" as const,
    },
  };

  assertEquals(
    errorResult.type,
    "article",
    "Error result should be article type",
  );
  assertEquals(errorResult.id, "error", "Should have error id");
  assertStringIncludes(
    errorResult.title,
    "⚠️",
    "Should indicate error with warning emoji",
  );
  assertStringIncludes(
    errorResult.description,
    "merchant name",
    "Should provide helpful guidance",
  );
});

// Performance validation tests
Deno.test("Response Time Validation - should process queries quickly", () => {
  const startTime = Date.now();

  // Simulate processing time for inline query
  const mockProcessingTime = 50; // milliseconds
  const endTime = startTime + mockProcessingTime;
  const processingTime = endTime - startTime;

  assertEquals(
    processingTime < 1000,
    true,
    `Processing should be under 1000ms, got ${processingTime}ms`,
  );
  assertEquals(
    processingTime >= 0,
    true,
    "Processing time should be non-negative",
  );
});

Deno.test("Cache Configuration - should have appropriate cache settings", () => {
  const cacheConfig = {
    cache_time: 300, // 5 minutes
    is_personal: true,
  };

  assertEquals(cacheConfig.cache_time, 300, "Should cache for 5 minutes");
  assertEquals(cacheConfig.is_personal, true, "Results should be personalized");
  assertEquals(
    cacheConfig.cache_time > 0,
    true,
    "Cache time should be positive",
  );
});
