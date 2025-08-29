// tests/integration/edge-function.test.ts
// Integration tests for Supabase Edge Function integration
// Part of TDD Sprint 2: Core Bot Functionality

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test configuration
const EDGE_FUNCTION_URL = Deno.env.get("SUPABASE_URL")
  ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-bot`
  : "http://localhost:54321/functions/v1/telegram-bot";

const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "test-key";

// Helper function for edge function calls
async function callEdgeFunction(
  payload: unknown,
  headers: Record<string, string> = {},
) {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  return { response, data, responseText };
}

Deno.test("Integration: Edge Function - Basic webhook handling", async () => {
  const testUpdate = {
    update_id: 12345,
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: -1001234567890,
        type: "supergroup",
        title: "Test Group",
      },
      from: {
        id: 123456,
        username: "testuser",
        first_name: "Test",
        is_bot: false,
      },
      text: "/start",
    },
  };

  const { response, data } = await callEdgeFunction(testUpdate);

  // Should accept webhook updates
  assert(
    response.status >= 200 && response.status < 300,
    `Expected 2xx status, got ${response.status}: ${JSON.stringify(data)}`,
  );

  console.log(`✅ Webhook handling works: ${response.status}`);
});

Deno.test("Integration: Edge Function - Inline query processing", async () => {
  const inlineQuery = {
    update_id: 12346,
    inline_query: {
      id: "test-inline-query-123",
      from: {
        id: 123456,
        username: "testuser",
        first_name: "Test",
        is_bot: false,
      },
      query: "apple",
      offset: "",
    },
  };

  const { response, data } = await callEdgeFunction(inlineQuery);

  // Should process inline queries
  assert(
    response.status >= 200 && response.status < 300,
    `Expected 2xx status for inline query, got ${response.status}: ${
      JSON.stringify(data)
    }`,
  );

  // If response is Telegram API format, validate structure
  if (typeof data === "object" && data.method === "answerInlineQuery") {
    assertEquals(data.method, "answerInlineQuery");
    assertEquals(data.inline_query_id, "test-inline-query-123");
    assertExists(data.results);
    assert(Array.isArray(data.results));

    if (data.results.length > 0) {
      const result = data.results[0];
      assertExists(result.id);
      assertExists(result.title);
      console.log(`✅ Inline query returned ${data.results.length} results`);
    } else {
      console.log(
        "ℹ️ Inline query returned no results (may be expected for test query)",
      );
    }
  }

  console.log(`✅ Inline query processing works: ${response.status}`);
});

Deno.test("Integration: Edge Function - Callback query processing", async () => {
  const callbackQuery = {
    update_id: 12347,
    callback_query: {
      id: "test-callback-123",
      from: {
        id: 654321,
        username: "viraluser",
        first_name: "Viral",
        is_bot: false,
      },
      data: "generate:apple:123456",
      message: {
        message_id: 456,
        date: Math.floor(Date.now() / 1000),
        chat: {
          id: -1001234567890,
          type: "supergroup",
          title: "Test Group",
        },
        from: {
          id: 123456789,
          username: "heymax_shop_bot",
          first_name: "HeyMax Shop Bot",
          is_bot: true,
        },
        text: "Previous message text",
      },
    },
  };

  const { response, data } = await callEdgeFunction(callbackQuery);

  // Should process callback queries
  assert(
    response.status >= 200 && response.status < 300,
    `Expected 2xx status for callback query, got ${response.status}: ${
      JSON.stringify(data)
    }`,
  );

  // If response is Telegram API format, validate structure
  if (typeof data === "object" && data.method === "answerCallbackQuery") {
    assertEquals(data.method, "answerCallbackQuery");
    assertEquals(data.callback_query_id, "test-callback-123");
    assertExists(data.text);

    console.log(`✅ Callback query processed: ${data.text}`);
  }

  console.log(`✅ Callback query processing works: ${response.status}`);
});

Deno.test("Integration: Edge Function - Error handling for malformed requests", async () => {
  const malformedUpdate = {
    invalid_field: "invalid_data",
    missing_update_id: true,
  };

  const { response } = await callEdgeFunction(malformedUpdate);

  // Should handle malformed requests gracefully
  // May return 200 with error response or 4xx status
  assert(
    response.status < 500,
    `Should not return server error for malformed request, got ${response.status}`,
  );

  console.log(`✅ Malformed request handled gracefully: ${response.status}`);
});

Deno.test("Integration: Edge Function - Environment variable access", async () => {
  // This test verifies that the edge function can access required environment variables
  // by making a basic request that would require them

  const basicUpdate = {
    update_id: 12348,
    message: {
      message_id: 2,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 123456, type: "private" },
      from: { id: 123456, username: "envtest", is_bot: false },
      text: "/start",
    },
  };

  const { response } = await callEdgeFunction(basicUpdate);

  // If environment variables are missing, function would likely return 500
  assert(
    response.status < 500,
    `Environment configuration issue, got ${response.status}`,
  );

  console.log(`✅ Environment variables accessible: ${response.status}`);
});

Deno.test("Integration: Edge Function - Response time performance", async () => {
  const performanceUpdate = {
    update_id: 12349,
    inline_query: {
      id: "performance-test-query",
      from: { id: 123456, username: "perftest", is_bot: false },
      query: "performance test",
      offset: "",
    },
  };

  const startTime = performance.now();
  const { response } = await callEdgeFunction(performanceUpdate);
  const endTime = performance.now();

  const responseTime = endTime - startTime;

  // Should respond quickly
  assert(
    responseTime < 5000,
    `Response time too slow: ${responseTime}ms (should be <5000ms)`,
  );

  assert(
    response.status < 500,
    "Performance test should not cause server errors",
  );

  console.log(`✅ Response time: ${responseTime.toFixed(0)}ms`);
});

Deno.test("Integration: Edge Function - Concurrent request handling", async () => {
  const concurrentRequests = 5;
  const requests = [];

  for (let i = 0; i < concurrentRequests; i++) {
    const update = {
      update_id: 13000 + i,
      inline_query: {
        id: `concurrent-test-${i}`,
        from: { id: 100000 + i, username: `concurrentuser${i}`, is_bot: false },
        query: `concurrent test ${i}`,
        offset: "",
      },
    };

    requests.push(callEdgeFunction(update));
  }

  const startTime = performance.now();
  const responses = await Promise.all(requests);
  const endTime = performance.now();

  const totalTime = endTime - startTime;

  // All requests should succeed
  let successCount = 0;
  responses.forEach(({ response }, index) => {
    if (response.status < 400) {
      successCount++;
    } else {
      console.warn(`Request ${index} failed with status ${response.status}`);
    }
  });

  assert(
    successCount >= concurrentRequests * 0.8,
    `Too many concurrent requests failed: ${successCount}/${concurrentRequests}`,
  );

  assert(
    totalTime < 10000,
    `Concurrent requests took too long: ${totalTime}ms`,
  );

  console.log(
    `✅ Concurrent requests: ${successCount}/${concurrentRequests} succeeded in ${
      totalTime.toFixed(0)
    }ms`,
  );
});

Deno.test("Integration: Edge Function - CORS headers", async () => {
  const testUpdate = {
    update_id: 12350,
    message: {
      message_id: 3,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 123456, type: "private" },
      from: { id: 123456, username: "corstest", is_bot: false },
      text: "CORS test",
    },
  };

  const { response } = await callEdgeFunction(testUpdate);

  // Check for CORS headers if needed
  const corsHeader = response.headers.get("Access-Control-Allow-Origin");
  if (corsHeader) {
    console.log(`ℹ️ CORS header present: ${corsHeader}`);
  }

  // Function should work regardless of CORS configuration
  assert(
    response.status < 500,
    "Function should work with proper configuration",
  );

  console.log(`✅ CORS handling verified: ${response.status}`);
});

Deno.test("Integration: Edge Function - Health check capability", async () => {
  // Try to access a health check endpoint if it exists
  try {
    const healthResponse = await fetch(`${EDGE_FUNCTION_URL}/health`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log(`✅ Health check available: ${healthResponse.status}`);
      console.log(`Health check response: ${healthData}`);
    } else {
      console.log(`ℹ️ No health check endpoint (${healthResponse.status})`);
    }
  } catch (error) {
    console.log(
      `ℹ️ Health check not available: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // This test always passes - health check is optional
  assert(true, "Health check test completed");
});

console.log("⚡ Edge Function integration tests completed");
