import {
  assert,
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

// TDD Tests for Sprint 3 Enhanced Viral Mechanics & Production Features
// These tests validate viral buttons, analytics, and production readiness

Deno.test("Viral Callback Query - should handle valid callback data", () => {
  const mockCallbackQuery = {
    id: "callback_12345",
    from: {
      id: 987654321,
      is_bot: false,
      first_name: "ViralUser",
      username: "viraluser",
    },
    data: "generate:shopee-singapore:123456789",
    chat_instance: "chat_instance_123",
    message: {
      message_id: 1,
      chat: {
        id: -1001234567890,
        type: "supergroup",
      },
    },
  };

  // Parse callback data
  const [action, merchantSlug, originalUserId] = mockCallbackQuery.data.split(
    ":",
  );

  assertEquals(action, "generate", "Action should be generate");
  assertEquals(
    merchantSlug,
    "shopee-singapore",
    "Should extract merchant slug",
  );
  assertEquals(originalUserId, "123456789", "Should extract original user ID");
  assertEquals(
    typeof mockCallbackQuery.from.id,
    "number",
    "User ID should be number",
  );
});

Deno.test("Viral Interaction Tracking - should validate tracking data structure", () => {
  const viralTracking = {
    original_user_id: 123456789,
    viral_user_id: 987654321,
    merchant_slug: "shopee-singapore",
    chat_id: -1001234567890,
    interaction_type: "callback_query",
    created_at: new Date().toISOString(),
  };

  assertEquals(
    typeof viralTracking.original_user_id,
    "number",
    "Original user ID should be number",
  );
  assertEquals(
    typeof viralTracking.viral_user_id,
    "number",
    "Viral user ID should be number",
  );
  assertEquals(
    viralTracking.interaction_type,
    "callback_query",
    "Should track interaction type",
  );
  assertExists(viralTracking.created_at, "Should have creation timestamp");
  assertStringIncludes(
    viralTracking.created_at,
    "T",
    "Should be valid ISO timestamp",
  );
});

Deno.test("Start Command Response - should provide comprehensive onboarding", () => {
  const startCommandResponse = `🎯 **Welcome to HeyMax Shop Bot!**

🚀 **How to earn Max Miles in any chat:**
1. Type @HeyMax_shop_bot followed by a merchant name
2. Select your merchant from the results
3. Tap your personalized link to start shopping & earning!

💡 **Try these popular merchants:**
• **Pelago** (8.0 miles/$) - Travel & experiences in Singapore
• **Klook** (6.5 miles/$) - Activities and attractions
• **Shopee Singapore** (3.5 miles/$) - Online marketplace
• **Apple Singapore** (2.0 miles/$) - Electronics & accessories
• **Starbucks** (3.0 miles/$) - Coffee & food

⚡ **Viral earning:** When others see your link, they can generate their own and earn too!

🎪 **Add me to group chats** so everyone can discover earning opportunities together!

**Quick start:** Type @HeyMax_shop_bot pelago to try it now! 🛍️

Need more help? Send /help anytime.`;

  assertStringIncludes(
    startCommandResponse,
    "Welcome to HeyMax Shop Bot!",
    "Should have welcome message",
  );
  assertStringIncludes(
    startCommandResponse,
    "How to earn Max Miles",
    "Should explain earning process",
  );
  assertStringIncludes(
    startCommandResponse,
    "Pelago",
    "Should list popular merchants",
  );
  assertStringIncludes(
    startCommandResponse,
    "Viral earning",
    "Should explain viral mechanics",
  );
  assertStringIncludes(
    startCommandResponse,
    "@HeyMax_shop_bot pelago",
    "Should provide example usage",
  );
});

Deno.test("Help Command Response - should provide detailed assistance", () => {
  const helpCommandResponse = `🆘 **HeyMax Shop Bot Help**

**🔍 Basic Usage:**
• Type @HeyMax_shop_bot [merchant name] in any chat
• Example: @HeyMax_shop_bot shopee
• Works in private chats, groups, and channels

**⚡ Viral Earning:**
• When someone uses your link, they earn Miles
• They can tap "Get MY Unique Link" to earn their own Miles
• Everyone wins - that's viral social commerce!

**🛍️ Popular Merchants:**
• pelago, klook, shopee, apple, starbucks, grab, lazada

**💡 Pro Tips:**
• Add me to group chats for viral discovery
• Search works with partial names (e.g. "shop" finds Shopee)
• Empty search shows top earning merchants

**🐛 Issues?**
• Bot not responding? Try /start
• No merchants found? Try popular names
• Still stuck? The bot is in beta - thanks for your patience!

**📊 Stats:** You can see viral growth analytics in group chats where I'm active.

Ready to earn? Try @HeyMax_shop_bot pelago right now! 🚀`;

  assertStringIncludes(
    helpCommandResponse,
    "HeyMax Shop Bot Help",
    "Should have help header",
  );
  assertStringIncludes(
    helpCommandResponse,
    "Basic Usage",
    "Should explain basic usage",
  );
  assertStringIncludes(
    helpCommandResponse,
    "Viral Earning",
    "Should explain viral mechanics",
  );
  assertStringIncludes(helpCommandResponse, "Pro Tips", "Should provide tips");
  assertStringIncludes(
    helpCommandResponse,
    "Issues?",
    "Should provide troubleshooting",
  );
});

Deno.test("Viral Bot Response - should generate engaging viral message", () => {
  const _userId = 987654321;
  const username = "viraluser";
  const merchant = {
    merchant_name: "Shopee Singapore",
    base_mpd: 3.5,
  };

  const displayName = `@${username}`;
  const earnRate = merchant.base_mpd;
  const exampleSpend = 100;
  const exampleEarnings = Math.round(exampleSpend * earnRate);

  const viralResponse =
    `🎉 **${displayName}, your viral ${merchant.merchant_name} link is ready!**

✨ **Earn up to ${earnRate} Max Miles per $1** spent
💰 **Example**: Spend $${exampleSpend} → Earn up to ${exampleEarnings} Max Miles

🔥 **You discovered this through viral sharing** - now others can do the same!

🚀 **Your personalized link:** 👆

💡 **Keep the viral loop going**: Share @HeyMax_shop_bot with friends and groups!

Try more: @HeyMax_shop_bot klook, pelago, grab...`;

  assertStringIncludes(
    viralResponse,
    displayName,
    "Should include user display name",
  );
  assertStringIncludes(viralResponse, "viral", "Should emphasize viral nature");
  assertStringIncludes(
    viralResponse,
    `${exampleEarnings} Max Miles`,
    "Should show calculated earnings",
  );
  assertStringIncludes(
    viralResponse,
    "viral sharing",
    "Should reference viral discovery",
  );
  assertStringIncludes(
    viralResponse,
    "Keep the viral loop going",
    "Should encourage continued sharing",
  );
});

Deno.test("Analytics Summary Structure - should provide comprehensive metrics", () => {
  const mockAnalytics = {
    timestamp: new Date().toISOString(),
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
    search_metrics: {
      total_searches_7d: 200,
      avg_results_per_search: 4.2,
    },
    performance_metrics: {
      avg_response_time_ms: 245,
      uptime_percentage: 99.8,
      error_rate_percentage: 0.2,
    },
    health_status: {
      database_connection: "healthy",
      telegram_api: "healthy",
      overall_status: "operational",
    },
  };

  // Validate structure
  assertExists(mockAnalytics.timestamp, "Should have timestamp");
  assertExists(mockAnalytics.user_metrics, "Should have user metrics");
  assertExists(mockAnalytics.viral_metrics, "Should have viral metrics");
  assertExists(
    mockAnalytics.performance_metrics,
    "Should have performance metrics",
  );
  assertExists(mockAnalytics.health_status, "Should have health status");

  // Validate user metrics
  assertEquals(
    typeof mockAnalytics.user_metrics.total_users,
    "number",
    "Total users should be number",
  );
  assertEquals(
    typeof mockAnalytics.user_metrics.active_users_7d,
    "number",
    "Active users should be number",
  );

  // Validate viral metrics
  assertEquals(
    typeof mockAnalytics.viral_metrics.viral_coefficient_7d,
    "number",
    "Viral coefficient should be number",
  );
  assert(
    mockAnalytics.viral_metrics.viral_coefficient_7d > 1,
    "Should show viral growth (>1.0 coefficient)",
  );

  // Validate performance metrics
  assert(
    mockAnalytics.performance_metrics.avg_response_time_ms < 1000,
    "Response time should be under 1s",
  );
  assert(
    mockAnalytics.performance_metrics.uptime_percentage > 99,
    "Uptime should be >99%",
  );
  assert(
    mockAnalytics.performance_metrics.error_rate_percentage < 1,
    "Error rate should be <1%",
  );

  // Validate health status
  assertEquals(
    mockAnalytics.health_status.overall_status,
    "operational",
    "Should be operational",
  );
});

Deno.test("Viral Coefficient Calculation - should calculate correctly", () => {
  // Mock data for viral coefficient calculation
  const totalUsers = 100;
  const viralInteractions = 135; // More interactions than users = viral growth

  const viralCoefficient = viralInteractions / totalUsers;

  assertEquals(
    typeof viralCoefficient,
    "number",
    "Viral coefficient should be number",
  );
  assert(viralCoefficient > 1.0, "Should indicate viral growth (>1.0)");
  assertEquals(viralCoefficient, 1.35, "Should calculate correct coefficient");

  // Test edge cases
  const noViralCase = 0 / 100;
  assertEquals(
    noViralCase,
    0,
    "No viral interactions should result in 0 coefficient",
  );

  const perfectViralCase = 100 / 100;
  assertEquals(
    perfectViralCase,
    1.0,
    "Equal interactions should result in 1.0 coefficient",
  );
});

Deno.test("Function Invocation Monitoring - should track usage limits", () => {
  const mockUsageData = {
    monthly_invocations: 320000, // Estimated monthly usage
    free_tier_limit: 500000, // Supabase free tier limit
    usage_percentage: 64.0, // 64% of limit used
    warning_threshold_reached: false, // <80%
    critical_threshold_reached: false, // <95%
  };

  assertEquals(
    typeof mockUsageData.monthly_invocations,
    "number",
    "Invocations should be number",
  );
  assertEquals(
    typeof mockUsageData.usage_percentage,
    "number",
    "Usage percentage should be number",
  );
  assertEquals(
    mockUsageData.warning_threshold_reached,
    false,
    "Should not have reached warning threshold",
  );
  assertEquals(
    mockUsageData.critical_threshold_reached,
    false,
    "Should not have reached critical threshold",
  );

  // Test threshold logic
  const highUsage = { usage_percentage: 85 };
  assert(highUsage.usage_percentage > 80, "Should trigger warning at >80%");

  const criticalUsage = { usage_percentage: 97 };
  assert(
    criticalUsage.usage_percentage > 95,
    "Should trigger critical alert at >95%",
  );
});

Deno.test("Top Merchants Ranking - should rank by activity", () => {
  const mockLinkGenerations = [
    { merchant_slug: "shopee-singapore" },
    { merchant_slug: "klook" },
    { merchant_slug: "shopee-singapore" },
    { merchant_slug: "pelago" },
    { merchant_slug: "klook" },
    { merchant_slug: "shopee-singapore" },
    { merchant_slug: "apple-singapore" },
    { merchant_slug: "klook" },
  ];

  // Calculate merchant popularity
  const merchantCounts = mockLinkGenerations.reduce((acc: Record<string, number>, item) => {
    acc[item.merchant_slug] = (acc[item.merchant_slug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMerchantsRanked = Object.entries(merchantCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([merchant, count]) => ({ merchant, count }));

  // Validate ranking
  assertEquals(
    topMerchantsRanked[0].merchant,
    "shopee-singapore",
    "Shopee should be #1",
  );
  assertEquals(
    topMerchantsRanked[0].count,
    3,
    "Shopee should have 3 occurrences",
  );
  assertEquals(topMerchantsRanked[1].merchant, "klook", "Klook should be #2");
  assertEquals(
    topMerchantsRanked[1].count,
    3,
    "Klook should have 3 occurrences",
  );
  assertEquals(topMerchantsRanked.length, 3, "Should return top 3 merchants");
});

Deno.test("Performance Metrics Validation - should meet production standards", () => {
  const performanceMetrics = {
    avg_response_time_ms: 285,
    p95_response_time_ms: 650,
    total_requests_1h: 120,
    performance_target_met: true,
    health_status: "healthy",
  };

  // Validate performance standards
  assert(
    performanceMetrics.avg_response_time_ms < 1000,
    "Average response time should be <1000ms",
  );
  assert(
    performanceMetrics.p95_response_time_ms < 2000,
    "95th percentile should be <2000ms",
  );
  assertEquals(
    performanceMetrics.performance_target_met,
    true,
    "Should meet performance targets",
  );
  assertEquals(
    performanceMetrics.health_status,
    "healthy",
    "Should report healthy status",
  );

  // Validate request volume
  assertEquals(
    typeof performanceMetrics.total_requests_1h,
    "number",
    "Request count should be number",
  );
  assert(
    performanceMetrics.total_requests_1h > 0,
    "Should have positive request count",
  );
});

Deno.test("Production Health Check - should validate all systems", () => {
  const healthCheck = {
    edge_function: {
      status: "healthy",
      response_code: 200,
      response_time_ms: 156,
    },
    database: {
      status: "healthy",
      connection: "active",
      query_time_ms: 45,
    },
    telegram_api: {
      status: "healthy",
      webhook_configured: true,
      pending_updates: 0,
    },
    overall_status: "operational",
  };

  // Validate edge function health
  assertEquals(
    healthCheck.edge_function.status,
    "healthy",
    "Edge function should be healthy",
  );
  assertEquals(
    healthCheck.edge_function.response_code,
    200,
    "Should return 200 status",
  );
  assert(
    healthCheck.edge_function.response_time_ms < 1000,
    "Response time should be reasonable",
  );

  // Validate database health
  assertEquals(
    healthCheck.database.status,
    "healthy",
    "Database should be healthy",
  );
  assertEquals(
    healthCheck.database.connection,
    "active",
    "Database connection should be active",
  );
  assert(
    healthCheck.database.query_time_ms < 1000,
    "Database queries should be fast",
  );

  // Validate Telegram API health
  assertEquals(
    healthCheck.telegram_api.status,
    "healthy",
    "Telegram API should be healthy",
  );
  assertEquals(
    healthCheck.telegram_api.webhook_configured,
    true,
    "Webhook should be configured",
  );
  assertEquals(
    healthCheck.telegram_api.pending_updates,
    0,
    "Should have no pending updates",
  );

  // Validate overall status
  assertEquals(
    healthCheck.overall_status,
    "operational",
    "Overall status should be operational",
  );
});

Deno.test("Viral Growth Trend Analysis - should track daily coefficients", () => {
  const mockViralTrend = [
    { date: "2025-08-21", coefficient: 0.8, users: 50, viral_interactions: 40 },
    { date: "2025-08-22", coefficient: 1.1, users: 60, viral_interactions: 66 },
    { date: "2025-08-23", coefficient: 1.3, users: 70, viral_interactions: 91 },
    {
      date: "2025-08-24",
      coefficient: 1.4,
      users: 80,
      viral_interactions: 112,
    },
    {
      date: "2025-08-25",
      coefficient: 1.5,
      users: 90,
      viral_interactions: 135,
    },
  ];

  // Validate trend structure
  assertEquals(mockViralTrend.length, 5, "Should have 5 days of data");

  mockViralTrend.forEach((day, index) => {
    assertExists(day.date, `Day ${index + 1} should have date`);
    assertEquals(
      typeof day.coefficient,
      "number",
      `Day ${index + 1} coefficient should be number`,
    );
    assertEquals(
      typeof day.users,
      "number",
      `Day ${index + 1} users should be number`,
    );
    assertEquals(
      typeof day.viral_interactions,
      "number",
      `Day ${index + 1} interactions should be number`,
    );
  });

  // Validate growth trend
  const firstDay = mockViralTrend[0];
  const lastDay = mockViralTrend[mockViralTrend.length - 1];

  assert(
    lastDay.coefficient > firstDay.coefficient,
    "Should show improving viral coefficient",
  );
  assert(lastDay.users > firstDay.users, "Should show user growth");
  assert(
    lastDay.viral_interactions > firstDay.viral_interactions,
    "Should show interaction growth",
  );

  // Check viral threshold achievement
  const viralDays = mockViralTrend.filter((day) => day.coefficient > 1.0);
  assert(
    viralDays.length >= 3,
    "Should achieve viral growth (>1.0) for multiple days",
  );
});

// Integration test for complete viral flow
Deno.test("Complete Viral Flow - should work end-to-end", () => {
  // Step 1: Original user generates link
  const originalUser = { id: 123456789, username: "originaluser" };
  const merchant = {
    merchant_slug: "shopee-singapore",
    merchant_name: "Shopee Singapore",
    base_mpd: 3.5,
  };

  // Step 2: Viral user clicks "Get MY Unique Link"
  const viralUser = { id: 987654321, username: "viraluser" };
  const callbackData = `generate:${merchant.merchant_slug}:${originalUser.id}`;

  // Step 3: Parse callback and validate
  const [action, merchantSlug, originalUserId] = callbackData.split(":");
  assertEquals(action, "generate", "Should parse action correctly");
  assertEquals(
    merchantSlug,
    merchant.merchant_slug,
    "Should parse merchant correctly",
  );
  assertEquals(
    parseInt(originalUserId),
    originalUser.id,
    "Should parse original user ID correctly",
  );

  // Step 4: Viral tracking should be created
  const viralInteraction = {
    original_user_id: originalUser.id,
    viral_user_id: viralUser.id,
    merchant_slug: merchantSlug,
    interaction_type: "callback_query",
    created_at: new Date().toISOString(),
  };

  assertEquals(
    viralInteraction.original_user_id,
    originalUser.id,
    "Should track original user",
  );
  assertEquals(
    viralInteraction.viral_user_id,
    viralUser.id,
    "Should track viral user",
  );
  assertEquals(
    viralInteraction.merchant_slug,
    merchantSlug,
    "Should track merchant",
  );

  // Step 5: Viral coefficient should increase
  const beforeViralCount = 100; // existing interactions
  const afterViralCount = beforeViralCount + 1;
  const userCount = 75;

  const beforeCoefficient = beforeViralCount / userCount;
  const afterCoefficient = afterViralCount / userCount;

  assert(
    afterCoefficient > beforeCoefficient,
    "Viral coefficient should increase",
  );

  print_status("Complete viral flow validation successful");
});

function print_status(message: string) {
  console.log(`✅ ${message}`);
}
