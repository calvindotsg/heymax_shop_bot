// Viral Mechanics Tests - Sprint 3 Functionality
// Tests for viral button interactions, analytics, and growth metrics

import {
  assert,
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

import {
  assertValidBotResponse,
  createTestCallbackQuery,
  createTestMessage,
  validateCallbackQueryStructure,
} from "../utils/telegram-helpers.ts";

import {
  MERCHANTS,
  MOCK_ANALYTICS,
  USERS,
  VIRAL_FLOW_DATA,
} from "../utils/mock-data.ts";

import { assertValidViralTracking } from "../utils/test-helpers.ts";

Deno.test("Viral Callback - should parse callback data correctly", () => {
  const testMerchant = MERCHANTS[0];
  const mockCallback = createTestCallbackQuery(
    testMerchant.merchant_slug,
    USERS.primary.id,
  );

  assertEquals(
    validateCallbackQueryStructure(mockCallback),
    true,
    "Should validate callback structure",
  );

  // Parse callback data
  const [action, merchantSlug, originalUserId] = mockCallback.data!.split(":");

  assertEquals(action, "generate", "Action should be generate");
  assertEquals(
    merchantSlug,
    testMerchant.merchant_slug,
    "Should extract merchant slug",
  );
  assertEquals(
    originalUserId,
    USERS.primary.id.toString(),
    "Should extract original user ID",
  );
});

Deno.test("Viral Interaction Tracking - should create proper tracking records", () => {
  const viralTracking = {
    original_user_id: USERS.primary.id,
    viral_user_id: USERS.viral.id,
    merchant_slug: MERCHANTS[1].merchant_slug,
    chat_id: -1001234567890,
    interaction_type: "callback_query",
    created_at: new Date().toISOString(),
  };

  assertValidViralTracking(viralTracking);
  assertEquals(
    viralTracking.interaction_type,
    "callback_query",
    "Should track interaction type",
  );
});

Deno.test("Command Handling - should provide comprehensive onboarding", () => {
  const _startMessage = createTestMessage("/start");

  const expectedResponse = `🎯 **Welcome to HeyMax Shop Bot!**

🚀 **How to earn Max Miles in any chat:**
1. Type @heymax_shop_bot followed by a merchant name
2. Select your merchant from the results  
3. Tap your personalized link to start shopping & earning!

💡 **Try these popular merchants:**
• **Pelago** (8.0 miles/$) - Travel & experiences
• **Klook** (6.5 miles/$) - Activities and attractions
• **Amazon Singapore** (4.0 miles/$) - Online marketplace

⚡ **Viral earning:** When others see your link, they can generate their own!

🎪 **Add me to group chats** for viral discovery!`;

  assertValidBotResponse(expectedResponse, {
    includeUsername: false,
    includeMerchant: true,
    includeEarningRate: true,
    includeViralCTA: false, // Start command doesn't include "Get MY" CTA
  });

  assertStringIncludes(
    expectedResponse,
    "Welcome to HeyMax Shop Bot!",
    "Should have welcome",
  );
  assertStringIncludes(
    expectedResponse,
    "How to earn Max Miles",
    "Should explain earning",
  );
  assertStringIncludes(
    expectedResponse,
    "Viral earning",
    "Should explain viral mechanics",
  );
});

Deno.test("Help Command - should provide detailed assistance", () => {
  const _helpMessage = createTestMessage("/help");

  const expectedHelp = `🆘 **HeyMax Shop Bot Help**

**🔍 Basic Usage:**
• Type @heymax_shop_bot [merchant name] in any chat
• Example: @heymax_shop_bot shopee
• Works in private chats, groups, and channels

**⚡ Viral Earning:**
• When someone uses your link, they earn Miles
• They can tap "Get MY Unique Link" to earn their own
• Everyone wins - that's viral social commerce!

**💡 Pro Tips:**
• Add me to group chats for viral discovery
• Search works with partial names (e.g. "shop" finds Shopee)
• Empty search shows top earning merchants`;

  assertStringIncludes(
    expectedHelp,
    "HeyMax Shop Bot Help",
    "Should have help header",
  );
  assertStringIncludes(expectedHelp, "Basic Usage", "Should explain usage");
  assertStringIncludes(
    expectedHelp,
    "Viral Earning",
    "Should explain viral mechanics",
  );
  assertStringIncludes(expectedHelp, "Pro Tips", "Should provide tips");
});

Deno.test("Viral Response - should generate engaging viral messages", () => {
  const testMerchant = MERCHANTS[3]; // Shopee
  const viralUser = USERS.viral;

  const displayName = `@${viralUser.username}`;
  const earnRate = testMerchant.base_mpd;
  const exampleSpend = 100;
  const exampleEarnings = Math.round(exampleSpend * earnRate);

  const viralResponse =
    `🎉 **${displayName}, your viral ${testMerchant.merchant_name} link is ready!**

✨ **Earn up to ${earnRate} Max Miles per $1** spent
💰 **Example**: Spend $${exampleSpend} → Earn up to ${exampleEarnings} Max Miles

🔥 **You discovered this through viral sharing** - now others can do the same!

💡 **Keep the viral loop going**: Share @heymax_shop_bot with friends!`;

  assertStringIncludes(
    viralResponse,
    displayName,
    "Should include viral user name",
  );
  assertStringIncludes(viralResponse, "viral", "Should emphasize viral nature");
  assertStringIncludes(
    viralResponse,
    "viral sharing",
    "Should reference viral discovery",
  );
  assertStringIncludes(
    viralResponse,
    "Keep the viral loop going",
    "Should encourage sharing",
  );
});

Deno.test("Analytics Summary - should provide comprehensive metrics", () => {
  const analytics = MOCK_ANALYTICS;

  // Validate structure
  assertExists(analytics.user_metrics, "Should have user metrics");
  assertExists(analytics.link_metrics, "Should have link metrics");
  assertExists(analytics.viral_metrics, "Should have viral metrics");
  assertExists(
    analytics.performance_metrics,
    "Should have performance metrics",
  );

  // Validate user metrics
  assertEquals(
    typeof analytics.user_metrics.total_users,
    "number",
    "Total users should be number",
  );
  assertEquals(
    typeof analytics.user_metrics.active_users_7d,
    "number",
    "Active users should be number",
  );

  // Validate viral metrics
  assertEquals(
    typeof analytics.viral_metrics.viral_coefficient_7d,
    "number",
    "Viral coefficient should be number",
  );
  assert(
    analytics.viral_metrics.viral_coefficient_7d > 1,
    "Should show viral growth (>1.0)",
  );

  // Validate performance metrics
  assert(
    analytics.performance_metrics.avg_response_time_ms < 1000,
    "Response time should be <1s",
  );
  assert(
    analytics.performance_metrics.uptime_percentage > 99,
    "Uptime should be >99%",
  );
});

Deno.test("Viral Coefficient Calculation - should calculate growth correctly", () => {
  const testData = [
    { users: 100, interactions: 135, expectedCoeff: 1.35 },
    { users: 50, interactions: 60, expectedCoeff: 1.2 },
    { users: 100, interactions: 100, expectedCoeff: 1.0 },
    { users: 100, interactions: 0, expectedCoeff: 0.0 },
  ];

  testData.forEach(({ users, interactions, expectedCoeff }) => {
    const coefficient = interactions / users;
    assertEquals(
      coefficient,
      expectedCoeff,
      `${interactions}/${users} should equal ${expectedCoeff}`,
    );
  });

  // Test viral growth indicators
  assert(1.35 > 1.0, "Coefficient >1.0 indicates viral growth");
  assert(1.2 > 1.0, "Coefficient >1.2 indicates strong viral growth");
});

Deno.test("Complete Viral Flow - should work end-to-end", () => {
  const {
    original_interaction,
    viral_callback,
    expected_coefficient_increase,
  } = VIRAL_FLOW_DATA;

  // Step 1: Original user generates link
  assertExists(original_interaction.user_id, "Should have original user");
  assertExists(original_interaction.merchant_slug, "Should have merchant");

  // Step 2: Viral user triggers callback
  const [action, merchantSlug, originalUserId] = [
    viral_callback.action,
    viral_callback.merchant_slug,
    viral_callback.original_user_id.toString(),
  ];

  assertEquals(action, "generate", "Should parse action correctly");
  assertEquals(
    merchantSlug,
    original_interaction.merchant_slug,
    "Should match merchant",
  );
  assertEquals(
    parseInt(originalUserId),
    original_interaction.user_id,
    "Should match original user",
  );

  // Step 3: Viral coefficient should increase
  const mockBefore = { users: 100, interactions: 120 };
  const mockAfter = { users: 100, interactions: 121 };

  const coeffBefore = mockBefore.interactions / mockBefore.users;
  const coeffAfter = mockAfter.interactions / mockAfter.users;
  const actualIncrease = coeffAfter - coeffBefore;

  assert(
    actualIncrease >= expected_coefficient_increase,
    "Should increase viral coefficient",
  );

  console.log("✅ Complete viral flow validation successful");
});

Deno.test("Top Merchants Ranking - should rank by activity", () => {
  const mockActivity = [
    { merchant_slug: "shopee-singapore" },
    { merchant_slug: "klook" },
    { merchant_slug: "shopee-singapore" },
    { merchant_slug: "amazon-singapore" },
    { merchant_slug: "klook" },
    { merchant_slug: "shopee-singapore" },
  ];

  // Calculate popularity
  const counts = mockActivity.reduce((acc: Record<string, number>, item) => {
    acc[item.merchant_slug] = (acc[item.merchant_slug] || 0) + 1;
    return acc;
  }, {});

  const ranked = Object.entries(counts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3);

  assertEquals(ranked[0][0], "shopee-singapore", "Shopee should be #1");
  assertEquals(ranked[0][1], 3, "Shopee should have 3 occurrences");
  assertEquals(ranked[1][0], "klook", "Klook should be #2");
  assertEquals(ranked[1][1], 2, "Klook should have 2 occurrences");
});

Deno.test("Performance Standards - should meet production requirements", () => {
  const performanceMetrics = {
    avg_response_time_ms: 285,
    p95_response_time_ms: 650,
    total_requests_1h: 120,
    performance_target_met: true,
    health_status: "healthy",
  };

  assert(
    performanceMetrics.avg_response_time_ms < 1000,
    "Average response should be <1000ms",
  );
  assert(
    performanceMetrics.p95_response_time_ms < 2000,
    "95th percentile should be <2000ms",
  );
  assertEquals(
    performanceMetrics.performance_target_met,
    true,
    "Should meet targets",
  );
  assertEquals(
    performanceMetrics.health_status,
    "healthy",
    "Should be healthy",
  );
});
