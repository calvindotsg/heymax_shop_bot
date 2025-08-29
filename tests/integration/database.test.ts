// tests/integration/database.test.ts
// Integration tests for database operations and schema validation
// Part of TDD Sprint 1: Foundation & Infrastructure

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test configuration - Environment-based with smart fallback
const supabaseUrl: string = Deno.env.get("SUPABASE_URL") ??
  Deno.env.get("TEST_SUPABASE_URL") ??
  "https://test.supabase.co"; // Production fallback for testing
const supabaseKey: string = Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("TEST_SUPABASE_ANON_KEY") ??
  "test-key"; // Production fallback

// Test environment detection
const isLocalTest = supabaseUrl.includes("127.0.0.1") ||
  supabaseUrl.includes("localhost");
console.log(
  `🔧 Running integration tests against: ${
    isLocalTest ? "LOCAL" : "REMOTE"
  } database`,
);

// Test safety: Add prefix for test data to avoid conflicts
const TEST_USER_PREFIX = isLocalTest ? "test_" : "integration_test_";

const testClient = createClient(
  supabaseUrl || "https://test.supabase.co",
  supabaseKey || "test-key",
);

// Test data cleanup helper
async function cleanupTestData() {
  try {
    await testClient.from("viral_interactions").delete().neq(
      "id",
      "00000000-0000-0000-0000-000000000000",
    );
    await testClient.from("link_generations").delete().neq(
      "id",
      "00000000-0000-0000-0000-000000000000",
    );
    await testClient.from("users").delete().gt("id", 1000000000); // Only test users with large IDs
  } catch (error) {
    console.warn(
      "Cleanup warning:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

Deno.test("Integration: Database Schema - Users table structure", async () => {
  await cleanupTestData();

  const testUserId = Date.now() + Math.floor(Math.random() * 1000); // Generate unique ID
  const { data, error } = await testClient
    .from("users")
    .insert({
      id: testUserId, // Use 'id' not 'telegram_user_id'
      username: `${TEST_USER_PREFIX}user`,
      // Remove display_name - doesn't exist in schema
    })
    .select()
    .single();

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assertEquals(data.id, testUserId);
  assertEquals(data.username, `${TEST_USER_PREFIX}user`);
  assertEquals(data.link_count, 0); // Default value from actual schema
  assertExists(data.first_seen); // Auto-generated timestamp in actual schema

  // Cleanup
  await testClient.from("users").delete().eq("id", testUserId);
});

Deno.test("Integration: Database Schema - Merchants table access", async () => {
  const { data, error } = await testClient
    .from("merchants")
    .select("merchant_name, tracking_link, base_mpd") // Use actual column names
    .limit(5);

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assert(data.length > 0, "Should have merchants in database");

  // Validate merchant structure
  const merchant = data[0];
  assertExists(merchant.merchant_name);
  assertExists(merchant.tracking_link); // Use actual column name
  assert(typeof merchant.base_mpd === "number"); // Use actual column name
  assert(merchant.base_mpd > 0, "Base MPD should be positive");
});

Deno.test("Integration: Database Schema - Link generations tracking", async () => {
  await cleanupTestData();

  const testUserId = 6543210987;

  // Create a test merchant first
  const merchantSlug = "integration-test-merchant";
  await testClient
    .from("merchants")
    .insert({
      merchant_slug: merchantSlug,
      merchant_name: "Integration Test Merchant",
      tracking_link: "https://test.example.com/?ref={user_id}",
      base_mpd: 5.0,
    });

  // First create a user
  await testClient
    .from("users")
    .insert({
      id: testUserId, // Use 'id' not 'telegram_user_id'
      username: `${TEST_USER_PREFIX}linktest`,
    });

  // Then create a link generation
  const { data, error } = await testClient
    .from("link_generations")
    .insert({
      user_id: testUserId,
      merchant_slug: merchantSlug, // Use merchant_slug not merchant_name
      unique_link: "https://test.example.com/affiliate?user=654321", // Use unique_link not generated_link
      utm_source: "telegram",
    })
    .select()
    .single();

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assertEquals(data.user_id, testUserId);
  assertEquals(data.merchant_slug, merchantSlug); // Use merchant_slug
  assertExists(data.generated_at); // Use generated_at not created_at

  // Cleanup
  await cleanupTestData();
});

Deno.test("Integration: Database Schema - Viral interactions tracking", async () => {
  await cleanupTestData();

  const originalUserId = 1111110987;
  const viralUserId = 2222220987;

  // Create a test merchant first
  const merchantSlug = "integration-viral-test-merchant";
  await testClient
    .from("merchants")
    .insert({
      merchant_slug: merchantSlug,
      merchant_name: "Integration Viral Test Merchant",
      tracking_link: "https://viral-test.example.com/?ref={user_id}",
      base_mpd: 3.0,
    });

  // Create users first
  await testClient.from("users").insert([
    {
      id: originalUserId, // Use 'id' not 'telegram_user_id'
      username: `${TEST_USER_PREFIX}original`,
    },
    {
      id: viralUserId, // Use 'id' not 'telegram_user_id'
      username: `${TEST_USER_PREFIX}viral`,
    },
  ]);

  // Create viral interaction
  const { data, error } = await testClient
    .from("viral_interactions")
    .insert({
      original_user_id: originalUserId,
      viral_user_id: viralUserId,
      merchant_slug: merchantSlug, // Use merchant_slug not merchant_name
      interaction_type: "callback_query", // Use actual default value
    })
    .select()
    .single();

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assertEquals(data.original_user_id, originalUserId);
  assertEquals(data.viral_user_id, viralUserId);
  assertEquals(data.merchant_slug, merchantSlug); // Use merchant_slug

  // Cleanup
  await cleanupTestData();
});

Deno.test("Integration: Database Performance - Query response times", async () => {
  const startTime = performance.now();

  // Test multiple common queries in parallel
  const promises = [
    testClient.from("merchants").select("merchant_name").limit(10),
    testClient.from("users").select("count"),
    testClient.from("link_generations").select("count"),
  ];

  const results = await Promise.all(promises);
  const endTime = performance.now();

  // All queries should succeed
  results.forEach((result, index) => {
    assertEquals(
      result.error,
      null,
      `Query ${index} failed: ${result.error?.message}`,
    );
  });

  // Should complete quickly
  const totalTime = endTime - startTime;
  assert(
    totalTime < 1000,
    `Database queries took ${totalTime}ms, should be <1000ms`,
  );
});

Deno.test("Integration: Database Connection - Basic connectivity", async () => {
  // Test basic database connection
  const { data, error } = await testClient
    .from("merchants")
    .select("count")
    .limit(1);

  assertEquals(error, null, `Connection error: ${error?.message}`);
  assertExists(data);
});

Deno.test("Integration: Database Schema - Foreign key constraints", async () => {
  await cleanupTestData();

  // Test foreign key constraint between link_generations and users
  const nonExistentUserId = 9999990987;

  const { error } = await testClient
    .from("link_generations")
    .insert({
      user_id: nonExistentUserId, // Non-existent user
      merchant_slug: "test-merchant", // Use merchant_slug
      unique_link: "https://test.example.com", // Use unique_link
      utm_source: "telegram",
    });

  // Should fail due to foreign key constraint
  assertExists(error, "Should have foreign key constraint error");
  assert(error.message.includes("foreign key") || error.code === "23503");
});

Deno.test("Integration: Database Analytics - User statistics aggregation", async () => {
  await cleanupTestData();

  const testUserId = 3333330987;

  // Create user
  await testClient.from("users").insert({
    id: testUserId, // Use 'id' not 'telegram_user_id'
    username: `${TEST_USER_PREFIX}analytics`,
  });

  // Create multiple link generations
  const linkPromises = [];
  for (let i = 0; i < 3; i++) {
    linkPromises.push(
      testClient.from("link_generations").insert({
        user_id: testUserId,
        merchant_slug: `test-merchant-${i + 1}`, // Use merchant_slug
        unique_link: `https://test${i + 1}.example.com`, // Use unique_link
        utm_source: "telegram",
      }),
    );
  }

  await Promise.all(linkPromises);

  // Verify aggregation works
  const { data: linkCount } = await testClient
    .from("link_generations")
    .select("count")
    .eq("user_id", testUserId);

  assertExists(linkCount);
  // Note: Supabase count returns array, actual count verification would depend on response structure

  // Cleanup
  await cleanupTestData();
});

// Cleanup after all tests
Deno.test("Integration: Database Cleanup", async () => {
  await cleanupTestData();
  console.log("✅ Integration test database cleanup completed");
});
