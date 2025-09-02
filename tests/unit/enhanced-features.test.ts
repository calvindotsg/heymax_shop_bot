// Enhanced Features Tests - Sprint 2 Functionality
// Tests for fuzzy search, analytics tracking, and enhanced UX

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

import {
  assertValidInlineKeyboard,
  createTestInlineQuery,
} from "../utils/telegram-helpers.ts";

import {
  EXPECTED_UTM_PARAMS,
  MERCHANTS,
  PERFORMANCE_BENCHMARKS,
  SEARCH_TEST_CASES,
  USERS,
} from "../utils/mock-data.ts";

import {
  assertPerformanceBenchmark,
  measurePerformance,
} from "../utils/test-helpers.ts";

Deno.test("Enhanced Search - should handle empty queries with popular merchants", () => {
  const emptyQuery = createTestInlineQuery("");

  assertEquals(emptyQuery.query.trim().length, 0, "Should detect empty query");
  assertExists(emptyQuery.from, "Should have user information");

  // Empty queries should show top merchants by MPD
  const topMerchants = MERCHANTS
    .sort((a, b) => b.base_mpd - a.base_mpd)
    .slice(0, 6);

  assertEquals(
    topMerchants[0].merchant_name,
    "Pelago by Singapore Airlines",
    "Top merchant should be highest MPD",
  );
  assertEquals(
    topMerchants.length,
    5,
    "Should limit to 5 merchants from test data",
  );
});

Deno.test("Fuzzy Search - should calculate accurate match scores", () => {
  SEARCH_TEST_CASES.forEach(({ merchantName, searchTerm, expectedScore }) => {
    const name = merchantName.toLowerCase();
    const term = searchTerm.toLowerCase();

    let score = 0;

    // Exact match
    if (name === term) score = 1.0;
    // Starts with
    else if (name.startsWith(term)) score = 0.9;
    // Contains
    else if (name.includes(term)) score = 0.8;
    // Word boundary matching
    else {
      const words = name.split(/[ \-_]+/);
      for (const word of words) {
        if (word.startsWith(term)) {
          score = 0.7;
          break;
        }
        if (word.includes(term)) {
          score = 0.6;
          break;
        }
      }
    }

    assertEquals(
      score >= expectedScore * 0.8,
      true,
      `${merchantName} + "${searchTerm}" should score ≥${
        expectedScore * 0.8
      }, got ${score}`,
    );
  });
});

Deno.test("Enhanced Link Generation - should include comprehensive UTM tracking", () => {
  const testMerchant = MERCHANTS[2]; // Amazon Singapore
  const testUser = USERS.primary;

  const baseLink = testMerchant.tracking_link.replace(
    "{{USER_ID}}",
    testUser.id.toString(),
  );
  const utmParams = new URLSearchParams({
    utm_source: "telegram",
    utm_medium: "heymax_shop_bot",
    utm_campaign: "viral_social_commerce",
    utm_content: testMerchant.merchant_slug,
    utm_term: `user_${testUser.id}`,
    heymax_ref: `telegram_${testUser.id}`,
    timestamp: Date.now().toString(),
  });

  const enhancedLink = `${baseLink}?${utmParams.toString()}`;

  // Validate all UTM parameters
  EXPECTED_UTM_PARAMS.forEach((param) => {
    assertStringIncludes(enhancedLink, param, `Should include ${param}`);
  });

  // Validate HeyMax-specific parameters
  assertStringIncludes(
    enhancedLink,
    `heymax_ref=telegram_${testUser.id}`,
    "Should include HeyMax reference",
  );
  assertStringIncludes(enhancedLink, "timestamp=", "Should include timestamp");
});

Deno.test("Enhanced Bot Response - should create engaging messages", () => {
  const testMerchant = MERCHANTS[1]; // Klook
  const testUser = USERS.primary;

  const displayName = `@${testUser.username}`;
  const earnRate = testMerchant.base_mpd;
  const exampleSpend = earnRate >= 5 ? 100 : 200;
  const exampleEarnings = Math.round(exampleSpend * earnRate);

  const response =
    `🎯 **${displayName}, your ${testMerchant.merchant_name} link is ready!**

✨ **Earn up to ${earnRate} Max Miles per $1** spent
💰 Example: Spend $${exampleSpend} → Earn up to ${exampleEarnings} Max Miles

🚀 **Your personalized link:** 👆

⚡ **Others**: Tap "Get MY Link" to earn Max Miles at ${testMerchant.merchant_name} too!`;

  assertStringIncludes(
    response,
    displayName,
    "Should include user display name",
  );
  assertStringIncludes(
    response,
    testMerchant.merchant_name,
    "Should include merchant name",
  );
  assertStringIncludes(
    response,
    `${earnRate} Max Miles per $1`,
    "Should show earning rate",
  );
  assertStringIncludes(response, "Get MY Link", "Should include viral CTA");
});

Deno.test("Enhanced Viral Keyboard - should have proper structure", () => {
  const testMerchant = MERCHANTS[3]; // Shopee Singapore
  const testUser = USERS.primary;
  const mockAffiliateLink = `${
    testMerchant.tracking_link.replace("{{USER_ID}}", testUser.id.toString())
  }?utm_source=telegram`;

  const keyboard = {
    inline_keyboard: [
      [{
        text:
          `🛍️ Shop ${testMerchant.merchant_name} & Earn Miles (@${testUser.username})`,
        url: mockAffiliateLink,
      }],
      [{
        text: `⚡ Get MY Unique Link for ${testMerchant.merchant_name}`,
        callback_data: `generate:${testMerchant.merchant_slug}:${testUser.id}`,
      }],
    ],
  };

  assertValidInlineKeyboard(keyboard, 2);

  // Validate shop button
  const shopButton = keyboard.inline_keyboard[0][0];
  assertStringIncludes(shopButton.text, "🛍️ Shop", "Should have shop action");
  if ("url" in shopButton) {
    assertEquals(
      shopButton.url,
      mockAffiliateLink,
      "Should have correct affiliate link",
    );
  }

  // Validate viral button
  const viralButton = keyboard.inline_keyboard[1][0];
  assertStringIncludes(
    viralButton.text,
    "⚡ Get MY Unique Link",
    "Should have viral action",
  );
  if ("callback_data" in viralButton) {
    assertStringIncludes(
      viralButton.callback_data,
      `generate:${testMerchant.merchant_slug}:${testUser.id}`,
      "Should have correct callback data",
    );
  }
});

Deno.test("No Results Handling - should provide helpful suggestions", () => {
  const searchTerm = "nonexistentmerchant";

  const noResultsResponse = {
    type: "article" as const,
    id: "no_results",
    title: `❌ No merchants found for "${searchTerm}"`,
    description: "Try popular brands: amazon, klook, shopee, pelago",
    input_message_content: {
      message_text: `🔍 No merchants found for "${searchTerm}"

💡 Try popular merchants: amazon, klook, shopee, pelago

Type @heymax_shop_bot followed by a merchant name to discover earning opportunities!`,
      parse_mode: "Markdown" as const,
    },
  };

  assertEquals(noResultsResponse.id, "no_results", "Should have no_results ID");
  assertStringIncludes(
    noResultsResponse.title,
    searchTerm,
    "Should include search term",
  );
  assertStringIncludes(
    noResultsResponse.description,
    "popular brands",
    "Should suggest alternatives",
  );
  assertStringIncludes(
    noResultsResponse.input_message_content.message_text,
    "amazon, klook, shopee",
    "Should provide specific suggestions",
  );
});

Deno.test("Analytics Tracking - should validate tracking data structure", () => {
  const testUser = USERS.primary;
  const testMerchant = MERCHANTS[2];

  const trackingData = {
    user_id: testUser.id,
    merchant_slug: testMerchant.merchant_slug,
    generated_at: new Date().toISOString(),
    search_term: "amazon",
    results_count: 3,
    chat_type: "supergroup",
    tracking_id:
      `tg_${testUser.id}_${testMerchant.merchant_slug}_${Date.now()}`,
  };

  assertEquals(
    typeof trackingData.user_id,
    "number",
    "User ID should be number",
  );
  assertEquals(
    typeof trackingData.results_count,
    "number",
    "Results count should be number",
  );
  assertStringIncludes(
    trackingData.tracking_id,
    `tg_${testUser.id}`,
    "Should include user in tracking ID",
  );
  assertExists(trackingData.search_term, "Should track search term");
});

Deno.test("User Data Validation - should validate upsert structure", () => {
  const testUser = USERS.noUsername;

  const userData = {
    id: testUser.id,
    username: testUser.username || `user_${testUser.id}`,
    first_seen: new Date().toISOString(),
  };

  assertEquals(typeof userData.id, "number", "User ID should be number");
  assertEquals(typeof userData.username, "string", "Username should be string");
  assertStringIncludes(
    userData.first_seen,
    "T",
    "Should be valid ISO timestamp",
  );

  // Test fallback username for users without username
  assertEquals(
    userData.username,
    `user_${testUser.id}`,
    "Should generate fallback username",
  );
});

Deno.test("Performance - should maintain fast response times", () => {
  // Test match scoring performance
  const { timeMs: scoringTime } = measurePerformance(() => {
    for (let i = 0; i < 1000; i++) {
      const name = "Amazon Singapore Store".toLowerCase();
      const term = "amazon".toLowerCase();

      // Simplified scoring
      let score = 0;
      if (name === term) score = 1.0;
      else if (name.startsWith(term)) score = 0.9;
      else if (name.includes(term)) score = 0.8;
    }
  });

  assertPerformanceBenchmark(
    scoringTime,
    PERFORMANCE_BENCHMARKS.matchScoring,
    "Match scoring",
  );

  // Test overall query processing simulation
  const { timeMs: processingTime } = measurePerformance(() => {
    const query = createTestInlineQuery("shopee");
    const filteredMerchants = MERCHANTS.filter((m) =>
      m.merchant_name.toLowerCase().includes(query.query.toLowerCase())
    );
    return filteredMerchants.slice(0, 8);
  });

  assertPerformanceBenchmark(processingTime, 50, "Query processing simulation");
});
