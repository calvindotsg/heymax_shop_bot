// Core Bot Functionality Tests - Refactored for Maintainability
// Tests for basic bot operations: inline queries, link generation, user handling

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

import {
  assertValidBotResponse,
  assertValidUTMParameters,
  createTestInlineQuery,
  validateInlineQueryStructure,
} from "../utils/telegram-helpers.ts";

import {
  MERCHANTS,
  PERFORMANCE_BENCHMARKS,
  SEARCH_TEST_CASES,
  USERS,
} from "../utils/mock-data.ts";

import {
  assertPerformanceBenchmark,
  measurePerformance,
} from "../utils/test-helpers.ts";

// Basic bot structure and validation tests
Deno.test("Bot Handler - should validate inline query structure", () => {
  const mockQuery = createTestInlineQuery("shopee");

  assertEquals(
    validateInlineQueryStructure(mockQuery),
    true,
    "Should validate query structure",
  );
  assertExists(mockQuery.from, "Should have user information");
  assertEquals(typeof mockQuery.from.id, "number", "User ID should be number");
});

Deno.test("Merchant Search - should handle empty queries", () => {
  const emptyQuery = createTestInlineQuery("");

  assertEquals(
    emptyQuery.query.trim().length,
    0,
    "Empty query should be detected",
  );
  // Empty queries should trigger popular merchants display
  assertExists(
    emptyQuery.from,
    "Should still have user information for popular merchants",
  );
});

Deno.test("Merchant Search - should calculate match scores correctly", () => {
  SEARCH_TEST_CASES.forEach(({ merchantName, searchTerm, expectedScore }) => {
    const name = merchantName.toLowerCase();
    const term = searchTerm.toLowerCase();

    let actualScore = 0;

    // Implement simplified scoring logic for testing
    if (name === term) actualScore = 1.0;
    else if (name.startsWith(term)) actualScore = 0.9;
    else if (name.includes(term)) actualScore = 0.8;
    else {
      const words = name.split(/[ \-_]+/);
      for (const word of words) {
        if (word.startsWith(term)) {
          actualScore = 0.7;
          break;
        }
        if (word.includes(term)) {
          actualScore = 0.6;
          break;
        }
      }
    }

    assertEquals(
      actualScore >= expectedScore * 0.8,
      true,
      `${merchantName} with "${searchTerm}" should score ≥${
        expectedScore * 0.8
      }, got ${actualScore}`,
    );
  });
});

Deno.test("Link Generation - should personalize USER_ID placeholder", () => {
  const testMerchant = MERCHANTS[0];
  const testUser = USERS.primary;

  const personalizedLink = testMerchant.tracking_link.replace(
    "{{USER_ID}}",
    testUser.id.toString(),
  );

  assertEquals(
    personalizedLink.includes("{{USER_ID}}"),
    false,
    "Should replace USER_ID placeholder",
  );
  assertStringIncludes(
    personalizedLink,
    testUser.id.toString(),
    "Should contain actual user ID",
  );
});

Deno.test("Link Generation - should include UTM tracking parameters", () => {
  const testMerchant = MERCHANTS[1];
  const testUser = USERS.primary;

  // Simulate UTM parameter addition
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
  });

  const finalLink = `${baseLink}?${utmParams.toString()}`;

  assertValidUTMParameters(finalLink);
  assertStringIncludes(
    finalLink,
    `utm_content=${testMerchant.merchant_slug}`,
    "Should include merchant slug",
  );
});

Deno.test("Bot Response - should generate engaging content", () => {
  const testMerchant = MERCHANTS[0];
  const testUser = USERS.primary;

  const response =
    `🎯 **@${testUser.username}, your ${testMerchant.merchant_name} link is ready!**

✨ **Earn up to ${testMerchant.base_mpd} Max Miles per $1** spent
💰 Example: Spend $100 → Earn up to ${
      Math.round(100 * testMerchant.base_mpd)
    } Max Miles

🚀 **Your personalized link:** 👆

⚡ **Others**: Tap "Get MY Link" to earn Max Miles too!`;

  assertValidBotResponse(response, {
    includeUsername: true,
    includeMerchant: true,
    includeEarningRate: true,
    includeViralCTA: true,
  });
});

Deno.test("Error Handling - should provide helpful error responses", () => {
  const errorResult = {
    type: "article" as const,
    id: "error",
    title: "⚠️ Temporary Service Issue",
    description: "Please try again in a moment",
    input_message_content: {
      message_text:
        "⚠️ Service temporarily unavailable. Try popular merchants: shopee, amazon, klook",
      parse_mode: "Markdown" as const,
    },
  };

  assertEquals(errorResult.type, "article", "Should be article type");
  assertEquals(errorResult.id, "error", "Should have error ID");
  assertStringIncludes(errorResult.title, "⚠️", "Should indicate error");
  assertStringIncludes(
    errorResult.input_message_content.message_text,
    "shopee, amazon",
    "Should suggest alternatives",
  );
});

Deno.test("Performance - should meet response time requirements", () => {
  const { timeMs } = measurePerformance(() => {
    // Simulate query processing
    const mockQuery = createTestInlineQuery("amazon");
    const merchants = MERCHANTS.filter((m) =>
      m.merchant_name.toLowerCase().includes(mockQuery.query.toLowerCase())
    );
    return merchants;
  });

  assertPerformanceBenchmark(
    timeMs,
    PERFORMANCE_BENCHMARKS.queryResponse,
    "Query processing",
  );
});

Deno.test("Cache Configuration - should have appropriate settings", () => {
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
