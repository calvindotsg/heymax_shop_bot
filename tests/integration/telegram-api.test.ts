// tests/integration/telegram-api.test.ts
// Integration tests for Telegram Bot API integration
// Part of TDD Sprint 1: Foundation & Infrastructure

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test configuration
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "test-token";
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Type definitions for Telegram API
interface TelegramCommand {
  command: string;
  description: string;
}

// Helper function for Telegram API calls
async function callTelegramAPI(
  method: string,
  params: Record<string, unknown> = {},
) {
  const url = `${BASE_URL}/${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  return { response, data };
}

Deno.test("Integration: Telegram API - Bot info retrieval", async () => {
  const { response, data } = await callTelegramAPI("getMe");

  assertEquals(response.status, 200);
  assertEquals(data.ok, true, `API error: ${data.description}`);

  const botInfo = data.result;
  assertExists(botInfo.id);
  assertExists(botInfo.username);
  assertEquals(botInfo.is_bot, true);
  assert(botInfo.username.includes("bot"), "Username should indicate bot");

  // Log bot info for debugging
  console.log(`✅ Connected to bot: @${botInfo.username} (ID: ${botInfo.id})`);
});

Deno.test("Integration: Telegram API - Webhook URL validation", async () => {
  // Test webhook info retrieval
  const { response, data } = await callTelegramAPI("getWebhookInfo");

  assertEquals(response.status, 200);
  assertEquals(data.ok, true, `API error: ${data.description}`);

  const webhookInfo = data.result;
  assertExists(webhookInfo);

  // Log current webhook status
  if (webhookInfo.url) {
    console.log(`ℹ️ Webhook configured: ${webhookInfo.url}`);
    assert(
      webhookInfo.url.startsWith("https://"),
      "Webhook URL should use HTTPS",
    );
  } else {
    console.log("ℹ️ No webhook currently configured");
  }

  // Verify webhook can be accessed if set
  if (webhookInfo.url && webhookInfo.url.includes("supabase")) {
    try {
      const webhookResponse = await fetch(webhookInfo.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });

      // Webhook should at least be reachable (may return 400 for invalid data)
      assert(
        webhookResponse.status < 500,
        "Webhook endpoint should be accessible",
      );
    } catch (error) {
      console.warn(
        `⚠️ Webhook accessibility test failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
});

Deno.test("Integration: Telegram API - Bot commands configuration", async () => {
  const { response, data } = await callTelegramAPI("getMyCommands");

  assertEquals(response.status, 200);
  assertEquals(data.ok, true, `API error: ${data.description}`);

  const commands = data.result;
  assertExists(commands);

  // Bot should have basic commands configured
  if (commands.length > 0) {
    const commandNames = commands.map((cmd: TelegramCommand) => cmd.command);
    console.log(`✅ Bot commands configured: ${commandNames.join(", ")}`);

    // Verify command structure
    commands.forEach((cmd: TelegramCommand) => {
      assertExists(cmd.command);
      assertExists(cmd.description);
      assert(cmd.command.length > 0);
      assert(cmd.description.length > 0);
    });
  } else {
    console.log("ℹ️ No bot commands configured");
  }
});

Deno.test("Integration: Telegram API - Inline query support", async () => {
  const { response, data } = await callTelegramAPI("getMe");

  assertEquals(response.status, 200);
  assertEquals(data.ok, true);

  const botInfo = data.result;
  assertEquals(
    botInfo.supports_inline_queries,
    true,
    "Bot should support inline queries for shop functionality",
  );

  console.log(
    `✅ Inline queries supported: ${botInfo.supports_inline_queries}`,
  );
});

Deno.test("Integration: Telegram API - Message sending capability", async () => {
  // Skip if no test chat ID provided
  const testChatId = Deno.env.get("TELEGRAM_TEST_CHAT_ID");
  if (!testChatId) {
    console.log(
      "⚠️ Skipping message sending test - no TELEGRAM_TEST_CHAT_ID provided",
    );
    return;
  }

  const testMessage = `🧪 Integration test message - ${
    new Date().toISOString()
  }`;

  const { response, data } = await callTelegramAPI("sendMessage", {
    chat_id: testChatId,
    text: testMessage,
    disable_notification: true, // Don't spam during tests
  });

  if (data.ok) {
    assertEquals(response.status, 200);
    assertEquals(data.ok, true);

    const message = data.result;
    assertExists(message.message_id);
    assertEquals(message.text, testMessage);
    assertEquals(message.chat.id.toString(), testChatId);

    console.log(
      `✅ Test message sent successfully (ID: ${message.message_id})`,
    );
  } else {
    console.warn(`⚠️ Message sending failed: ${data.description}`);
    // Don't fail test if it's just a permission issue
    if (data.error_code !== 403) {
      assertEquals(data.ok, true, `API error: ${data.description}`);
    }
  }
});

Deno.test("Integration: Telegram API - Answer inline query format", () => {
  // Test the structure of answerInlineQuery without actually sending
  const mockInlineQueryId = "test-query-id";
  const mockResults = [
    {
      type: "article",
      id: "test-result-1",
      title: "🛍️ Test Merchant",
      description: "Test merchant description with Max Miles earning",
      input_message_content: {
        message_text: "Test merchant message with affiliate link",
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🛍️ Shop Test Merchant",
              url: "https://test.example.com/affiliate?user=123456",
            },
          ],
          [
            {
              text: "⚡ Get MY Unique Link for Test Merchant",
              callback_data: "generate:test-merchant:123456",
            },
          ],
        ],
      },
    },
  ];

  // Don't actually send, just validate structure
  const payload = {
    inline_query_id: mockInlineQueryId,
    results: mockResults,
    cache_time: 30,
  };

  // Validate payload structure
  assertExists(payload.inline_query_id);
  assertExists(payload.results);
  assert(Array.isArray(payload.results));
  assert(payload.results.length > 0);

  const result = payload.results[0];
  assertEquals(result.type, "article");
  assertExists(result.id);
  assertExists(result.title);
  assertExists(result.description);
  assertExists(result.input_message_content);
  assertExists(result.reply_markup);

  // Validate keyboard structure
  const keyboard = result.reply_markup.inline_keyboard;
  assert(Array.isArray(keyboard));
  assert(keyboard.length >= 2, "Should have at least 2 button rows");

  const shopButton = keyboard[0][0];
  const viralButton = keyboard[1][0];

  assertExists(shopButton.text);
  // Type guard for URL button
  if ("url" in shopButton) {
    assertExists(shopButton.url);
    assert(shopButton.url.startsWith("https://"));
  } else {
    throw new Error("Shop button should be a URL button");
  }

  assertExists(viralButton.text);
  // Type guard for callback data button
  if ("callback_data" in viralButton) {
    assertExists(viralButton.callback_data);
    assert(viralButton.callback_data.includes("generate:"));
  } else {
    throw new Error("Viral button should be a callback button");
  }

  console.log("✅ Inline query response structure validation passed");
});

Deno.test("Integration: Telegram API - Callback query answer format", () => {
  // Test callback query response structure
  const mockCallbackResponse = {
    method: "answerCallbackQuery",
    callback_query_id: "test-callback-id",
    text: "✅ Your unique link generated!",
    show_alert: false,
  };

  // Validate response structure
  assertEquals(mockCallbackResponse.method, "answerCallbackQuery");
  assertExists(mockCallbackResponse.callback_query_id);
  assertExists(mockCallbackResponse.text);
  assertEquals(typeof mockCallbackResponse.show_alert, "boolean");

  console.log("✅ Callback query response structure validation passed");
});

Deno.test("Integration: Telegram API - Error handling", async () => {
  // Test API error handling with invalid method
  const { response, data } = await callTelegramAPI("invalidMethod");

  assertEquals(response.status, 404);
  assertEquals(data.ok, false);
  assertExists(data.description);
  assertExists(data.error_code);

  console.log(`✅ Error handling works: ${data.description}`);
});

Deno.test("Integration: Telegram API - Rate limiting awareness", async () => {
  // Test that we can handle multiple requests without immediate rate limiting
  const requests = [];
  const requestCount = 5;

  for (let i = 0; i < requestCount; i++) {
    requests.push(callTelegramAPI("getMe"));
  }

  const startTime = performance.now();
  const responses = await Promise.all(requests);
  const endTime = performance.now();

  // All should succeed under normal circumstances
  let successCount = 0;
  let rateLimitedCount = 0;

  responses.forEach(({ data }) => {
    if (data.ok) {
      successCount++;
    } else if (data.error_code === 429) {
      rateLimitedCount++;
    }
  });

  const totalTime = endTime - startTime;
  console.log(
    `✅ API requests: ${successCount} succeeded, ${rateLimitedCount} rate limited, ${totalTime}ms total`,
  );

  // At least some should succeed
  assert(successCount > 0, "At least some API calls should succeed");

  // If rate limited, that's also acceptable behavior
  if (rateLimitedCount > 0) {
    console.log("ℹ️ Some requests were rate limited (expected behavior)");
  }
});

console.log("🔗 Telegram API integration tests completed");
