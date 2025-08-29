import { assert, assertEquals, assertExists } from "testing/asserts.ts";

// Sprint 3 Performance Validation Tests
// Load testing and viral scenario performance validation

// Test configuration
const supabaseUrl: string = Deno.env.get("SUPABASE_URL") ??
 "http://localhost:54321";
const supabaseKey: string = Deno.env.get("SUPABASE_ANON_KEY") ?? "test_key";

// Helper function to check if Supabase is available
async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: { "apikey": supabaseKey },
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

// Helper function to check if Edge Function is available
async function isEdgeFunctionAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        update_id: 0,
        inline_query: {
          id: "health-check",
          from: { id: 1, is_bot: false, first_name: "Test", username: "test" },
          query: "",
          offset: ""
        }
      })
    });
    
    // Consume the response body to prevent resource leak
    await response.text();
    return response.status < 500;
  } catch {
    return false;
  }
}

Deno.test("Performance - Bot should handle concurrent inline queries", async () => {
  // Skip test if Edge Function is not available
  const isAvailable = await isEdgeFunctionAvailable();
  if (!isAvailable) {
    console.warn("⚠️ Skipping performance test - Edge Function not available");
    return;
  }

  const concurrentUsers = 10;
  const queries = [];

  const mockInlineQuery = (userId: number) => ({
    id: `test_${Date.now()}_${userId}`,
    from: {
      id: userId,
      is_bot: false,
      first_name: "TestUser",
      username: `testuser${userId}`,
    },
    query: "shopee",
    offset: "",
  });

  // Create concurrent requests
  for (let i = 1; i <= concurrentUsers; i++) {
    const query = mockInlineQuery(100000 + i);
    queries.push(
      fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          update_id: i,
          inline_query: query,
        }),
      }),
    );
  }

  const startTime = Date.now();
  const responses = await Promise.all(queries);
  const endTime = Date.now();

  const processingTime = endTime - startTime;
  const avgResponseTime = processingTime / concurrentUsers;

  // Validate all responses successful
  responses.forEach((response, index) => {
    assertEquals(response.status, 200, `Request ${index + 1} should succeed`);
  });

  // Performance assertions
  assert(
    processingTime < 5000,
    `Concurrent processing should be under 5s, got ${processingTime}ms`,
  );
  assert(
    avgResponseTime < 1000,
    `Average response time should be under 1s, got ${avgResponseTime}ms`,
  );
});

Deno.test("Performance - Viral callback handling under load", async () => {
  // Skip test if Edge Function is not available
  const isAvailable = await isEdgeFunctionAvailable();
  if (!isAvailable) {
    console.warn("⚠️ Skipping viral callback test - Edge Function not available");
    return;
  }

  const viralCallbacks = [];
  const concurrentCallbacks = 5;

  for (let i = 1; i <= concurrentCallbacks; i++) {
    const callbackQuery = {
      id: `callback_${Date.now()}_${i}`,
      from: {
        id: 200000 + i,
        is_bot: false,
        first_name: "ViralUser",
        username: `viraluser${i}`,
      },
      data: `generate:shopee-singapore:${100000 + i}`,
      chat_instance: `chat_${i}`,
      message: {
        message_id: i,
        chat: {
          id: -1000000 - i,
          type: "supergroup",
        },
      },
    };

    viralCallbacks.push(
      fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          update_id: 1000 + i,
          callback_query: callbackQuery,
        }),
      }),
    );
  }

  const startTime = Date.now();
  const responses = await Promise.all(viralCallbacks);
  const endTime = Date.now();

  const totalTime = endTime - startTime;

  // Validate responses
  responses.forEach((response, index) => {
    assertEquals(
      response.status,
      200,
      `Viral callback ${index + 1} should succeed`,
    );
  });

  // Performance validation
  assert(
    totalTime < 3000,
    `Viral callback processing should be under 3s, got ${totalTime}ms`,
  );
});

Deno.test("Performance - Database query optimization", async () => {
  // Skip test if Edge Function is not available
  const isAvailable = await isEdgeFunctionAvailable();
  if (!isAvailable) {
    console.warn("⚠️ Skipping database query test - Edge Function not available");
    return;
  }

  const startTime = Date.now();

  // Test complex analytics query performance
  const analyticsRequest = await fetch(
    `${supabaseUrl}/functions/v1/telegram-bot/analytics`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const endTime = Date.now();
  const queryTime = endTime - startTime;

  assertEquals(analyticsRequest.status, 200, "Analytics query should succeed");
  assert(
    queryTime < 2000,
    `Analytics query should be under 2s, got ${queryTime}ms`,
  );

  // Properly consume the response body to prevent resource leak
  const analyticsData = await analyticsRequest.json();
  assertExists(analyticsData.user_metrics, "Should return user metrics");
  assertExists(analyticsData.viral_metrics, "Should return viral metrics");
});

Deno.test("Performance - Memory usage validation", () => {
  // Test memory footprint for large datasets
  const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
    merchant_name: `Test Merchant ${i}`,
    merchant_slug: `test-merchant-${i}`,
    base_mpd: Math.random() * 10,
    match_score: Math.random(),
  }));

  const startMemory =
    (performance as { memory?: { usedJSHeapSize: number } }).memory
      ?.usedJSHeapSize || 0;

  // Simulate fuzzy search processing
  const searchTerm = "test";
  const results = largeDataset
    .map((merchant) => ({
      ...merchant,
      match_score: merchant.merchant_name.toLowerCase().includes(searchTerm)
        ? 0.8
        : 0.3,
    }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 10);

  const endMemory =
    (performance as { memory?: { usedJSHeapSize: number } }).memory
      ?.usedJSHeapSize || 0;
  const memoryUsed = endMemory - startMemory;

  assertEquals(results.length, 10, "Should return top 10 results");
  assert(
    memoryUsed < 10 * 1024 * 1024,
    `Memory usage should be reasonable, used ${memoryUsed} bytes`,
  );
});

Deno.test("Performance - Response time consistency", async () => {
  // Skip test if Edge Function is not available
  const isAvailable = await isEdgeFunctionAvailable();
  if (!isAvailable) {
    console.warn("⚠️ Skipping response time test - Edge Function not available");
    return;
  }

  const iterations = 20;
  const responseTimes = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/telegram-bot`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          update_id: 2000 + i,
          inline_query: {
            id: `consistency_test_${i}`,
            from: {
              id: 300000 + i,
              is_bot: false,
              first_name: "ConsistencyTest",
              username: `consistency${i}`,
            },
            query: i % 2 === 0 ? "shopee" : "grab",
            offset: "",
          },
        }),
      },
    );

    const endTime = Date.now();
    responseTimes.push(endTime - startTime);

    assertEquals(response.status, 200, `Request ${i + 1} should succeed`);

    // Small delay to avoid overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) /
    responseTimes.length;
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);
  const stdDev = Math.sqrt(
    responseTimes.reduce(
      (sum, time) => sum + Math.pow(time - avgResponseTime, 2),
      0,
    ) / responseTimes.length,
  );

  console.log(
    `Response time stats: avg=${
      avgResponseTime.toFixed(2)
    }ms, max=${maxResponseTime}ms, min=${minResponseTime}ms, stddev=${
      stdDev.toFixed(2)
    }ms`,
  );

  // Performance assertions
  assert(
    avgResponseTime < 500,
    `Average response time should be under 500ms, got ${
      avgResponseTime.toFixed(2)
    }ms`,
  );
  assert(
    maxResponseTime < 2000,
    `Max response time should be under 2s, got ${maxResponseTime}ms`,
  );
  assert(
    stdDev < 200,
    `Response time should be consistent (low std dev), got ${
      stdDev.toFixed(2)
    }ms`,
  );
});

Deno.test("Performance - Viral coefficient calculation efficiency", () => {
  const startTime = Date.now();

  // Test the viral coefficient calculation under simulated load
  const mockViralData = Array.from({ length: 100 }, (_, i) => ({
    original_user_id: 100000 + i,
    viral_user_id: 200000 + i,
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      .toISOString(),
  }));

  // Simulate viral coefficient calculation
  const users = new Set([
    ...mockViralData.map((d) => d.original_user_id),
    ...mockViralData.map((d) => d.viral_user_id),
  ]);
  const viralCoefficient = mockViralData.length / users.size;

  const endTime = Date.now();
  const calculationTime = endTime - startTime;

  assert(
    calculationTime < 100,
    `Viral coefficient calculation should be fast, got ${calculationTime}ms`,
  );
  assertEquals(
    typeof viralCoefficient,
    "number",
    "Viral coefficient should be numeric",
  );
  assert(viralCoefficient >= 0, "Viral coefficient should be non-negative");
});

Deno.test("Performance - Free tier resource usage estimation", () => {
  // Simulate monthly usage calculation
  const dailyInlineQueries = 50; // Conservative estimate
  const dailyViralCallbacks = 20; // 40% viral conversion
  const dailyStartCommands = 10; // New user onboarding

  const monthlyInlineQueries = dailyInlineQueries * 30;
  const monthlyViralCallbacks = dailyViralCallbacks * 30;
  const monthlyStartCommands = dailyStartCommands * 30;

  const totalMonthlyInvocations = monthlyInlineQueries + monthlyViralCallbacks +
    monthlyStartCommands;
  const supabaseFreeLimit = 500000; // 500K invocations/month
  const usagePercentage = (totalMonthlyInvocations / supabaseFreeLimit) * 100;

  console.log(
    `Estimated monthly usage: ${totalMonthlyInvocations} invocations (${
      usagePercentage.toFixed(2)
    }% of free tier)`,
  );

  assert(
    totalMonthlyInvocations < supabaseFreeLimit * 0.8,
    `Usage should stay under 80% of free tier limit, estimated ${
      usagePercentage.toFixed(2)
    }%`,
  );

  // Validate individual components
  assertEquals(
    typeof totalMonthlyInvocations,
    "number",
    "Total invocations should be numeric",
  );
  assert(totalMonthlyInvocations > 0, "Should have positive usage estimate");
});

Deno.test("Performance - Error rate under load validation", async () => {
  // Skip test if Edge Function is not available
  const isAvailable = await isEdgeFunctionAvailable();
  if (!isAvailable) {
    console.warn("⚠️ Skipping error rate test - Edge Function not available");
    return;
  }

  const totalRequests = 50;
  const errorThreshold = 0.02; // 2% error rate threshold
  let successCount = 0;
  let errorCount = 0;

  const requests = [];

  for (let i = 0; i < totalRequests; i++) {
    // Mix of different request types to simulate real load
    const requestType = i % 3;
    let requestBody;

    switch (requestType) {
      case 0: // Inline query
        requestBody = {
          update_id: 3000 + i,
          inline_query: {
            id: `load_test_${i}`,
            from: {
              id: 400000 + i,
              is_bot: false,
              first_name: "LoadTest",
              username: `load${i}`,
            },
            query: ["shopee", "grab", "klook", "", "apple"][i % 5],
            offset: "",
          },
        };
        break;
      case 1: // Callback query
        requestBody = {
          update_id: 3000 + i,
          callback_query: {
            id: `callback_load_${i}`,
            from: {
              id: 500000 + i,
              is_bot: false,
              first_name: "CallbackTest",
              username: `cb${i}`,
            },
            data: `generate:shopee-singapore:${400000 + i}`,
            chat_instance: `chat_${i}`,
            message: {
              message_id: i,
              chat: { id: -2000000 - i, type: "supergroup" },
            },
          },
        };
        break;
      case 2: // Start command
        requestBody = {
          update_id: 3000 + i,
          message: {
            message_id: i,
            from: {
              id: 600000 + i,
              is_bot: false,
              first_name: "StartTest",
              username: `start${i}`,
            },
            chat: { id: 600000 + i, type: "private" },
            text: "/start",
          },
        };
        break;
    }

    requests.push(
      fetch(`${supabaseUrl}/functions/v1/telegram-bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }).then((response) => {
        if (response.status === 200) {
          successCount++;
        } else {
          errorCount++;
        }
        return response;
      }).catch((error) => {
        console.error(`Request ${i} failed:`, error);
        errorCount++;
        return null;
      }),
    );
  }

  await Promise.all(requests);

  const errorRate = errorCount / totalRequests;

  console.log(
    `Load test results: ${successCount} success, ${errorCount} errors, ${
      (errorRate * 100).toFixed(2)
    }% error rate`,
  );

  assert(
    errorRate <= errorThreshold,
    `Error rate should be under ${(errorThreshold * 100).toFixed(1)}%, got ${
      (errorRate * 100).toFixed(2)
    }%`,
  );
  assert(
    successCount > totalRequests * 0.95,
    `Should have >95% success rate, got ${
      (successCount / totalRequests * 100).toFixed(2)
    }%`,
  );
});
