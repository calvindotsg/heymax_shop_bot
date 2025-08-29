import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

import {
  type AffiliateData,
  calculateMatchScore,
  countCommonChars,
  generateAffiliateLink,
  generateEnhancedBotResponse,
  generateInlineQueryResult,
  generateViralKeyboard,
  type Merchant,
  MOCK_MERCHANTS,
  validateUserUpsertData,
} from "../../src/utils/bot-functions.ts";

// Additional comprehensive tests to improve coverage

Deno.test("Count Common Characters - should count correctly", () => {
  // Test common character counting
  assertEquals(
    countCommonChars("hello", "world"),
    2,
    "Should count 2 common chars (l, o)",
  );
  assertEquals(
    countCommonChars("amazon", "maze"),
    3,
    "Should count 3 common chars (m, a, z)",
  );
  assertEquals(countCommonChars("", "test"), 0, "Empty string should return 0");
  assertEquals(
    countCommonChars("abc", "def"),
    0,
    "No common chars should return 0",
  );
});

Deno.test("Generate Enhanced Bot Response - should include all required elements", () => {
  const mockMerchant: Merchant = MOCK_MERCHANTS[0];
  const mockAffiliateData: AffiliateData = {
    affiliate_link: "https://example.com?ref=123",
    tracking_id: "test_tracking_123",
    merchant: mockMerchant,
  };

  const response = generateEnhancedBotResponse(
    123456,
    "testuser",
    mockMerchant,
    mockAffiliateData,
  );

  assertStringIncludes(response, "@testuser", "Should include username");
  assertStringIncludes(
    response,
    mockMerchant.merchant_name,
    "Should include merchant name",
  );
  assertStringIncludes(
    response,
    mockMerchant.base_mpd.toString(),
    "Should include MPD rate",
  );
  assertStringIncludes(response, "Max Miles", "Should mention Max Miles");
  assertStringIncludes(response, "🎯", "Should include engaging emoji");
});

Deno.test("Generate Viral Keyboard - should have proper structure", () => {
  const mockMerchant: Merchant = MOCK_MERCHANTS[1];
  const affiliateLink = "https://example.com?ref=123";

  const keyboard = generateViralKeyboard(
    123456,
    "testuser",
    mockMerchant,
    affiliateLink,
  );

  assertExists(keyboard.inline_keyboard, "Should have inline keyboard");
  assertEquals(
    keyboard.inline_keyboard.length,
    2,
    "Should have 2 rows of buttons",
  );

  // Check first button (shop button)
  const shopButton = keyboard.inline_keyboard[0][0];
  assertStringIncludes(
    shopButton.text,
    mockMerchant.merchant_name,
    "Shop button should include merchant name",
  );
  if ("url" in shopButton) {
    assertEquals(
      shopButton.url,
      affiliateLink,
      "Shop button should have correct URL",
    );
  }

  // Check second button (viral button)
  const viralButton = keyboard.inline_keyboard[1][0];
  assertStringIncludes(
    viralButton.text,
    "Get MY Unique Link",
    "Viral button should have correct text",
  );
  if ("callback_data" in viralButton) {
    assertStringIncludes(
      viralButton.callback_data,
      `generate:${mockMerchant.merchant_slug}:123456`,
      "Should have correct callback data",
    );
  }
});

Deno.test("Validate User Upsert Data - should return correct structure", () => {
  const userId = 123456;
  const username = "testuser";

  const userData = validateUserUpsertData(userId, username);

  assertEquals(userData.id, userId, "Should have correct user ID");
  assertEquals(userData.username, username, "Should have correct username");
  assertExists(userData.first_seen, "Should have first_seen timestamp");

  // Test timestamp is valid ISO string
  const timestamp = new Date(userData.first_seen);
  assertEquals(
    isNaN(timestamp.getTime()),
    false,
    "Should have valid timestamp",
  );
});

Deno.test("Generate Affiliate Link - should include all tracking parameters", () => {
  const userId = 123456;
  const merchantSlug = "amazon";
  const trackingLink = "https://amazon.sg/?ref={{USER_ID}}";

  const affiliateData = generateAffiliateLink(
    userId,
    merchantSlug,
    trackingLink,
  );

  // Check basic structure
  assertExists(affiliateData.affiliate_link, "Should have affiliate link");
  assertExists(affiliateData.tracking_id, "Should have tracking ID");
  assertExists(affiliateData.merchant, "Should have merchant data");

  // Check UTM parameters
  assertStringIncludes(
    affiliateData.affiliate_link,
    "utm_source=telegram",
    "Should include utm_source",
  );
  assertStringIncludes(
    affiliateData.affiliate_link,
    "utm_medium=heymax_shop_bot",
    "Should include utm_medium",
  );
  assertStringIncludes(
    affiliateData.affiliate_link,
    "utm_campaign=viral_social_commerce",
    "Should include utm_campaign",
  );
  assertStringIncludes(
    affiliateData.affiliate_link,
    `utm_content=${merchantSlug}`,
    "Should include utm_content",
  );
  assertStringIncludes(
    affiliateData.affiliate_link,
    `user_${userId}`,
    "Should include user term",
  );
  assertStringIncludes(
    affiliateData.affiliate_link,
    `telegram_${userId}`,
    "Should include heymax_ref",
  );

  // Check tracking ID format
  assertEquals(
    affiliateData.tracking_id.startsWith(`tg_${userId}_${merchantSlug}_`),
    true,
    "Should have correct tracking ID format",
  );
});

Deno.test("Generate Inline Query Result - should have correct structure", () => {
  const result = generateInlineQueryResult(
    "test_id",
    "Test Title",
    "Test Description",
    "Test Message Content",
    { inline_keyboard: [[{ text: "Test Button", url: "https://test.com" }]] },
  );

  assertEquals(result.type, "article", "Should be article type");
  assertEquals(result.id, "test_id", "Should have correct ID");
  assertEquals(result.title, "Test Title", "Should have correct title");
  assertEquals(
    result.description,
    "Test Description",
    "Should have correct description",
  );
  assertEquals(
    result.input_message_content.message_text,
    "Test Message Content",
    "Should have correct message text",
  );
  assertEquals(
    result.input_message_content.parse_mode,
    "Markdown",
    "Should use Markdown parse mode",
  );
  assertExists(result.reply_markup, "Should have reply markup");
  assertExists(result.thumbnail_url, "Should have thumbnail URL");
});

Deno.test("Mock Merchants Data - should be properly structured", () => {
  assertEquals(
    MOCK_MERCHANTS.length >= 3,
    true,
    "Should have at least 3 mock merchants",
  );

  MOCK_MERCHANTS.forEach((merchant, index) => {
    assertExists(merchant.merchant_slug, `Merchant ${index} should have slug`);
    assertExists(merchant.merchant_name, `Merchant ${index} should have name`);
    assertExists(
      merchant.tracking_link,
      `Merchant ${index} should have tracking link`,
    );
    assertExists(merchant.base_mpd, `Merchant ${index} should have base MPD`);

    assertEquals(
      typeof merchant.base_mpd,
      "number",
      "Base MPD should be number",
    );
    assertEquals(merchant.base_mpd > 0, true, "Base MPD should be positive");
    assertStringIncludes(
      merchant.tracking_link,
      "{{USER_ID}}",
      "Tracking link should contain placeholder",
    );
  });
});

Deno.test("Calculate Match Score - comprehensive scoring tests", () => {
  // Test all scoring scenarios

  // Exact match
  assertEquals(
    calculateMatchScore("amazon", "amazon"),
    1.0,
    "Exact match should be 1.0",
  );

  // Starts with
  assertEquals(
    calculateMatchScore("amazon singapore", "amazon"),
    0.9,
    "Starts with should be 0.9",
  );

  // Contains
  assertEquals(
    calculateMatchScore("singapore amazon", "amazon"),
    0.8,
    "Contains should be 0.8",
  );

  // Word boundary - starts with
  assertEquals(
    calculateMatchScore("singapore amazon store", "amazon"),
    0.8,
    "Word contains should be 0.8",
  );

  // Case insensitive
  assertEquals(
    calculateMatchScore("AMAZON", "amazon"),
    1.0,
    "Should be case insensitive",
  );
  assertEquals(
    calculateMatchScore("Amazon Singapore", "AMAZON"),
    0.9,
    "Should handle mixed case",
  );

  // Word separators
  assertEquals(
    calculateMatchScore("food-panda", "food"),
    0.9,
    "Should handle hyphens",
  );
  assertEquals(
    calculateMatchScore("food_panda", "food"),
    0.9,
    "Should handle underscores",
  );
  assertEquals(
    calculateMatchScore("food panda", "food"),
    0.9,
    "Should handle spaces",
  );

  // No match scenarios
  assertEquals(calculateMatchScore("amazon", "xyz"), 0, "No match should be 0");
  assertEquals(
    calculateMatchScore("amazon", ""),
    0,
    "Empty search should be 0",
  );
});

Deno.test("Performance Tests - functions should be efficient", () => {
  const startTime = performance.now();

  // Test match scoring performance
  for (let i = 0; i < 1000; i++) {
    calculateMatchScore("Amazon Singapore Store", "amazon");
  }

  const matchScoreTime = performance.now() - startTime;
  assertEquals(
    matchScoreTime < 100,
    true,
    "Match scoring should be fast (< 100ms for 1000 operations)",
  );

  const startTime2 = performance.now();

  // Test common chars performance
  for (let i = 0; i < 1000; i++) {
    countCommonChars("amazon singapore", "singapore amazon");
  }

  const commonCharsTime = performance.now() - startTime2;
  assertEquals(
    commonCharsTime < 50,
    true,
    "Common chars should be fast (< 50ms for 1000 operations)",
  );
});
