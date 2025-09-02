// Database testing utilities for HeyMax Shop Bot
// Shared database setup, teardown, and validation functions

import { createClient } from "@supabase/supabase-js";
import { assertEquals } from "testing/asserts.ts";
import "jsr:@std/dotenv/load";

// Test database configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "http://localhost:54321";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "test_key";

export const testSupabase = createClient(supabaseUrl, supabaseKey);

// Database validation helpers
export async function assertDatabaseConnection() {
  const { error, count } = await testSupabase
    .from("users")
    .select("*", { count: "exact", head: true });

  assertEquals(error, null, "Should connect to database without error");
  assertEquals(typeof count, "number", "Should return count as number");
  assertEquals((count || 0) >= 0, true, "Count should be non-negative");
}

export async function assertTableExists(tableName: string) {
  const { error } = await testSupabase
    .from(tableName)
    .select("*")
    .limit(1);

  assertEquals(error, null, `${tableName} table should exist`);
}

export async function assertDatabasePerformance(maxTimeMs = 1000) {
  const startTime = Date.now();

  const { error } = await testSupabase
    .from("merchants")
    .select("merchant_slug, merchant_name, base_mpd")
    .limit(10);

  const queryTime = Date.now() - startTime;

  assertEquals(error, null, "Query should execute successfully");
  assertEquals(
    queryTime < maxTimeMs,
    true,
    `Query took ${queryTime}ms, should be under ${maxTimeMs}ms`,
  );

  return queryTime;
}

/**
 * Get environment-aware timeout for database operations
 * CI environments need more generous timeouts due to network latency and resource constraints
 */
function getEnvironmentTimeout(providedTimeout?: number): number {
  const isCI = Deno.env.get("CI") === "true" || Deno.env.get("GITHUB_ACTIONS") === "true";
  const isLocal = Deno.env.get("ENVIRONMENT") === "local" || supabaseUrl.includes("localhost");
  
  // If a specific timeout is provided, use it as base
  if (providedTimeout !== undefined) {
    return isCI ? Math.max(providedTimeout * 2, 1000) : providedTimeout;
  }
  
  // Default timeouts based on environment
  if (isLocal) {
    return 500; // Local development - fast expectations
  } else if (isCI) {
    return 1500; // CI environment - more generous timeout
  } else {
    return 1000; // Default for other environments
  }
}

// Test data cleanup helpers
export async function cleanupTestData(userId: number) {
  try {
    // Clean up in reverse dependency order
    await testSupabase.from("viral_interactions").delete().eq(
      "viral_user_id",
      userId,
    );
    await testSupabase.from("viral_interactions").delete().eq(
      "original_user_id",
      userId,
    );
    await testSupabase.from("link_generations").delete().eq("user_id", userId);
    await testSupabase.from("search_analytics").delete().eq("user_id", userId);
    await testSupabase.from("users").delete().eq("id", userId);
  } catch (error) {
    console.warn("Cleanup failed (expected in test environment):", error);
  }
}

// Database schema validation
export const EXPECTED_TABLES = [
  "users",
  "merchants",
  "link_generations",
  "search_analytics",
  "viral_interactions",
];

export const EXPECTED_COLUMNS = {
  users: ["id", "username", "first_seen", "last_activity", "link_count"],
  merchants: ["merchant_slug", "merchant_name", "tracking_link", "base_mpd"],
  link_generations: [
    "id",
    "user_id",
    "merchant_slug",
    "generated_at",
    "search_term",
  ],
  viral_interactions: [
    "id",
    "original_user_id",
    "viral_user_id",
    "merchant_slug",
    "created_at",
  ],
  search_analytics: [
    "id",
    "user_id",
    "search_term",
    "results_count",
    "query_timestamp",
  ],
};

// Performance test utilities
export async function benchmarkDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxTimeMs?: number,
): Promise<T> {
  const startTime = performance.now();
  const result = await operation();
  const timeMs = performance.now() - startTime;

  // Environment-aware timeout defaults
  const defaultTimeout = getEnvironmentTimeout(maxTimeMs);

  assertEquals(
    timeMs < defaultTimeout,
    true,
    `${operationName} should complete in under ${defaultTimeout}ms, got ${timeMs}ms`,
  );

  return result;
}
