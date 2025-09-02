// Shared test utilities and helpers for HeyMax Shop Bot tests
// Centralized test data, mocks, and common validation functions

import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "testing/asserts.ts";

// Mock data for consistent testing
// Common test assertions
export function assertValidAffiliateData(affiliateData: unknown) {
  const data = affiliateData as Record<string, unknown>;
  assertExists(data.affiliate_link, "Should have affiliate link");
  assertExists(data.tracking_id, "Should have tracking ID");
  assertExists(data.merchant, "Should have merchant data");

  // Check UTM parameters
  assertStringIncludes(
    data.affiliate_link as string,
    "utm_source=telegram",
    "Should include utm_source",
  );
  assertStringIncludes(
    data.affiliate_link as string,
    "utm_medium=heymax_shop_bot",
    "Should include utm_medium",
  );
  assertStringIncludes(
    data.affiliate_link as string,
    "utm_campaign=viral_social_commerce",
    "Should include utm_campaign",
  );
}

export function assertValidUserData(userData: unknown) {
  const data = userData as Record<string, unknown>;
  assertEquals(typeof data.id, "number", "User ID should be number");
  assertEquals(typeof data.username, "string", "Username should be string");
  assertExists(data.first_seen, "Should have first_seen timestamp");

  // Validate timestamp format
  const timestamp = new Date(data.first_seen as string);
  assertEquals(
    isNaN(timestamp.getTime()),
    false,
    "Should have valid timestamp",
  );
}

export function assertValidViralTracking(tracking: unknown) {
  const data = tracking as Record<string, unknown>;
  assertEquals(
    typeof data.original_user_id,
    "number",
    "Original user ID should be number",
  );
  assertEquals(
    typeof data.viral_user_id,
    "number",
    "Viral user ID should be number",
  );
  assertEquals(
    typeof data.merchant_slug,
    "string",
    "Merchant slug should be string",
  );
  assertExists(data.created_at, "Should have creation timestamp");
  assertStringIncludes(
    data.created_at as string,
    "T",
    "Should be valid ISO timestamp",
  );
}

export function assertPerformanceBenchmark(
  actualTime: number,
  maxTime: number,
  operation: string,
) {
  assertEquals(
    actualTime < maxTime,
    true,
    `${operation} should complete in under ${maxTime}ms, got ${actualTime}ms`,
  );
}

// Performance testing utilities
export function measurePerformance<T>(
  operation: () => T,
): { result: T; timeMs: number } {
  const startTime = performance.now();
  const result = operation();
  const timeMs = performance.now() - startTime;
  return { result, timeMs };
}

export async function measureAsyncPerformance<T>(
  operation: () => Promise<T>,
): Promise<{ result: T; timeMs: number }> {
  const startTime = performance.now();
  const result = await operation();
  const timeMs = performance.now() - startTime;
  return { result, timeMs };
}
