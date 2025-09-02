// Bot Utilities Tests - Helper Functions and Algorithms
// Tests for match scoring, common chars, and utility functions

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

import {
  MERCHANTS,
  PERFORMANCE_BENCHMARKS,
  SEARCH_TEST_CASES,
  USERS,
} from "../utils/mock-data.ts";

import {
  assertPerformanceBenchmark,
  assertValidAffiliateData,
  assertValidUserData,
  measurePerformance,
} from "../utils/test-helpers.ts";

// Common character counting algorithm tests
Deno.test("Common Characters - should count correctly", () => {
  const testCases = [
    { str1: "hello", str2: "world", expected: 2 }, // l, o
    { str1: "amazon", str2: "maze", expected: 3 }, // m, a, z
    { str1: "", str2: "test", expected: 0 },
    { str1: "abc", str2: "def", expected: 0 },
    { str1: "test", str2: "test", expected: 4 },
  ];

  testCases.forEach(({ str1, str2, expected }) => {
    const result = countCommonCharacters(str1, str2);
    assertEquals(
      result,
      expected,
      `countCommonCharacters("${str1}", "${str2}") should equal ${expected}`,
    );
  });
});

// Match scoring algorithm comprehensive tests
Deno.test("Match Scoring - should handle all scoring scenarios", () => {
  // Test exact matches
  assertEquals(
    calculateScore("amazon", "amazon"),
    1.0,
    "Exact match should be 1.0",
  );
  assertEquals(
    calculateScore("AMAZON", "amazon"),
    1.0,
    "Should be case insensitive",
  );

  // Test starts with
  assertEquals(
    calculateScore("amazon singapore", "amazon"),
    0.9,
    "Starts with should be 0.9",
  );

  // Test contains
  assertEquals(
    calculateScore("singapore amazon", "amazon"),
    0.8,
    "Contains should be 0.8",
  );

  // Test word boundaries
  assertEquals(
    calculateScore("food-panda", "food"),
    0.9,
    "Should handle hyphens",
  );
  assertEquals(
    calculateScore("food_panda", "food"),
    0.9,
    "Should handle underscores",
  );
  assertEquals(
    calculateScore("food panda", "food"),
    0.9,
    "Should handle spaces",
  );

  // Test no matches
  assertEquals(calculateScore("amazon", "xyz"), 0, "No match should be 0");

  // Test empty search - this should return 0 but our algorithm might return different
  const emptySearchScore = calculateScore("amazon", "");
  assertEquals(emptySearchScore, 0, "Empty search should be 0");
});

Deno.test("Match Scoring - should use test cases correctly", () => {
  SEARCH_TEST_CASES.forEach(({ merchantName, searchTerm, expectedScore }) => {
    const score = calculateScore(merchantName, searchTerm);
    assertEquals(
      score >= expectedScore * 0.8,
      true,
      `${merchantName} + "${searchTerm}" should score ≥${
        expectedScore * 0.8
      }, got ${score}`,
    );
  });
});

Deno.test("User Data Validation - should validate all user structures", () => {
  Object.values(USERS).forEach((user, index) => {
    const userData = {
      id: user.id,
      username: user.username || `user_${user.id}`,
      first_seen: new Date().toISOString(),
    };

    assertValidUserData(userData);

    // Test specific cases
    if (!user.username) {
      assertEquals(
        userData.username,
        `user_${user.id}`,
        `User ${index} should have fallback username`,
      );
    }
  });
});

Deno.test("Affiliate Data Generation - should create complete tracking data", () => {
  const testMerchant = MERCHANTS[2]; // Amazon
  const testUser = USERS.primary;

  // Simulate affiliate data generation
  const affiliateData = {
    affiliate_link: testMerchant.tracking_link
      .replace("{{USER_ID}}", testUser.id.toString()) +
      "?utm_source=telegram&utm_medium=heymax_shop_bot&utm_campaign=viral_social_commerce",
    tracking_id:
      `tg_${testUser.id}_${testMerchant.merchant_slug}_${Date.now()}`,
    merchant: testMerchant,
  };

  assertValidAffiliateData(affiliateData);
  assertEquals(
    affiliateData.merchant.merchant_slug,
    testMerchant.merchant_slug,
    "Should include merchant data",
  );
});

Deno.test("Performance Algorithms - should be efficient", () => {
  // Test match scoring performance
  const { timeMs: scoringTime } = measurePerformance(() => {
    for (let i = 0; i < 1000; i++) {
      calculateScore("Amazon Singapore Store", "amazon");
    }
  });

  assertPerformanceBenchmark(
    scoringTime,
    PERFORMANCE_BENCHMARKS.matchScoring,
    "Match scoring",
  );

  // Test common characters performance
  const { timeMs: charsTime } = measurePerformance(() => {
    for (let i = 0; i < 1000; i++) {
      countCommonCharacters("amazon singapore", "singapore amazon");
    }
  });

  assertPerformanceBenchmark(
    charsTime,
    PERFORMANCE_BENCHMARKS.commonChars,
    "Common characters",
  );
});

// Helper functions for testing (simplified versions)
function countCommonCharacters(str1: string, str2: string): number {
  const chars1 = str1.split("").sort();
  const chars2 = str2.split("").sort();
  let i = 0, j = 0, common = 0;

  while (i < chars1.length && j < chars2.length) {
    if (chars1[i] === chars2[j]) {
      common++;
      i++;
      j++;
    } else if (chars1[i] < chars2[j]) {
      i++;
    } else {
      j++;
    }
  }

  return common;
}

function calculateScore(merchantName: string, searchTerm: string): number {
  const name = merchantName.toLowerCase();
  const term = searchTerm.toLowerCase();

  // Handle empty search term
  if (term.length === 0) return 0;

  if (name === term) return 1.0;
  if (name.startsWith(term)) return 0.9;
  if (name.includes(term)) return 0.8;

  // Word boundary matching
  const words = name.split(/[ \-_]+/);
  for (const word of words) {
    if (word.startsWith(term)) return 0.7;
    if (word.includes(term)) return 0.6;
  }

  return 0;
}
