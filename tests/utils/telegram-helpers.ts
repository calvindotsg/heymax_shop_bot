// Telegram API testing utilities for HeyMax Shop Bot
// Mock Telegram structures and validation helpers

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";
import { MOCK_CHAT, MOCK_USER, MOCK_VIRAL_USER } from "./mock-data.ts";

// Telegram type interfaces for testing
export interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
  chat_type?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  language_code?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  data?: string;
  chat_instance: string;
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
      title?: string;
    };
  };
}

// Mock generators
export function createTestInlineQuery(
  query = "shopee",
  userId = MOCK_USER.id,
  chatType = "supergroup",
): TelegramInlineQuery {
  return {
    id: `query_${Date.now()}_${Math.random()}`,
    from: { ...MOCK_USER, id: userId },
    query,
    offset: "",
    chat_type: chatType,
  };
}

export function createTestCallbackQuery(
  merchantSlug = "shopee-singapore",
  originalUserId = MOCK_USER.id,
  viralUserId = MOCK_VIRAL_USER.id,
) {
  return {
    id: `callback_${Date.now()}_${Math.random()}`,
    from: { ...MOCK_VIRAL_USER, id: viralUserId },
    data: `generate:${merchantSlug}:${originalUserId}`,
    chat_instance: `chat_${Date.now()}`,
    message: {
      message_id: Math.floor(Math.random() * 1000),
      chat: MOCK_CHAT,
    },
  };
}

export function createTestMessage(text = "/start", userId = MOCK_USER.id) {
  return {
    message_id: Math.floor(Math.random() * 1000),
    from: { ...MOCK_USER, id: userId },
    chat: MOCK_CHAT,
    text,
  };
}

// Validation helpers for Telegram structures
export function validateInlineQueryStructure(query: TelegramInlineQuery) {
  try {
    assertExists(query.id, "Should have query ID");
    assertExists(query.from, "Should have from user");
    assertEquals(typeof query.from.id, "number", "User ID should be number");
    assertExists(query.query, "Should have query text");
    return true;
  } catch {
    return false;
  }
}

export function validateCallbackQueryStructure(
  callback: TelegramCallbackQuery,
) {
  try {
    assertExists(callback.id, "Should have callback ID");
    assertExists(callback.from, "Should have from user");
    assertExists(callback.data, "Should have callback data");
    return true;
  } catch {
    return false;
  }
}

// Bot response validation
export function assertValidBotResponse(response: string, requirements: {
  includeUsername?: boolean;
  includeMerchant?: boolean;
  includeEarningRate?: boolean;
  includeViralCTA?: boolean;
}) {
  assertExists(response, "Response should exist");
  assertEquals(typeof response, "string", "Response should be string");

  if (requirements.includeUsername) {
    assertStringIncludes(response, "@", "Should include username reference");
  }

  if (requirements.includeMerchant) {
    // Check for merchant name patterns instead of generic "merchant"
    const hasMerchantRef = response.includes("Pelago") ||
      response.includes("Amazon") ||
      response.includes("Klook") || response.includes("Shopee") ||
      response.toLowerCase().includes("merchant");
    assertEquals(
      hasMerchantRef,
      true,
      "Should mention specific merchant or merchant term",
    );
  }

  if (requirements.includeEarningRate) {
    assertStringIncludes(response, "Max Miles", "Should mention Max Miles");
  }

  if (requirements.includeViralCTA) {
    assertStringIncludes(
      response,
      "Get MY",
      "Should include viral call-to-action",
    );
  }
}

// Keyboard validation helpers
export function assertValidInlineKeyboard(keyboard: unknown, expectedRows = 2) {
  const kb = keyboard as Record<string, unknown>;
  assertExists(kb.inline_keyboard, "Should have inline keyboard");
  assertEquals(
    (kb.inline_keyboard as unknown[]).length,
    expectedRows,
    `Should have ${expectedRows} button rows`,
  );

  (kb.inline_keyboard as unknown[][]).forEach(
    (row: unknown[], rowIndex: number) => {
      assertEquals(
        Array.isArray(row),
        true,
        `Row ${rowIndex} should be an array`,
      );
      assertEquals(
        row.length > 0,
        true,
        `Row ${rowIndex} should have at least one button`,
      );

      (row as any[]).forEach((button: unknown, buttonIndex: number) => {
        const btn = button as Record<string, unknown>;
        assertExists(
          btn.text,
          `Button ${rowIndex}-${buttonIndex} should have text`,
        );

        // Button should have either URL or callback_data
        const hasUrl = "url" in btn;
        const hasCallback = "callback_data" in btn;
        assertEquals(
          hasUrl || hasCallback,
          true,
          `Button ${rowIndex}-${buttonIndex} should have URL or callback data`,
        );
      });
    },
  );
}

// UTM parameter validation
export function assertValidUTMParameters(link: string) {
  const expectedParams = [
    "utm_source=telegram",
    "utm_medium=heymax_shop_bot",
    "utm_campaign=viral_social_commerce",
  ];

  expectedParams.forEach((param) => {
    assertStringIncludes(link, param, `Should include ${param}`);
  });
}

// Error response validation
export function assertValidErrorResponse(errorResult: unknown) {
  const error = errorResult as Record<string, unknown>;
  assertEquals(
    error.type,
    "article",
    "Error result should be article type",
  );
  assertEquals(error.id, "error", "Should have error id");
  assertStringIncludes(
    error.title as string,
    "⚠️",
    "Should indicate error with warning emoji",
  );
  assertExists(
    error.input_message_content,
    "Should have message content",
  );
}
