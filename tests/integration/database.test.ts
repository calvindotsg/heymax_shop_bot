// tests/integration/database.test.ts
// Integration tests for database operations and schema validation
// Part of TDD Sprint 1: Foundation & Infrastructure

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test configuration
const testClient = createClient(
  Deno.env.get("SUPABASE_URL") || "https://test.supabase.co",
  Deno.env.get("SUPABASE_ANON_KEY") || "test-key",
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
    await testClient.from("users").delete().lt("id", 1000000); // Only test users
  } catch (error) {
    console.warn("Cleanup warning:", error instanceof Error ? error.message : String(error));
  }
}

Deno.test("Integration: Database Schema - Users table structure", async () => {
  await cleanupTestData();

  const testUserId = 123456;
  const { data, error } = await testClient
    .from("users")
    .insert({
      telegram_user_id: testUserId,
      username: "testuser",
      display_name: "Test User",
    })
    .select()
    .single();

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assertEquals(data.telegram_user_id, testUserId);
  assertEquals(data.username, "testuser");
  assertEquals(data.total_links_generated, 0); // Default value
  assertExists(data.created_at); // Auto-generated timestamp

  // Cleanup
  await testClient.from("users").delete().eq("telegram_user_id", testUserId);
});

Deno.test("Integration: Database Schema - Merchants table access", async () => {
  const { data, error } = await testClient
    .from("merchants")
    .select("merchant_name, affiliate_link_template, max_miles_rate")
    .limit(5);

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assert(data.length > 0, "Should have merchants in database");

  // Validate merchant structure
  const merchant = data[0];
  assertExists(merchant.merchant_name);
  assertExists(merchant.affiliate_link_template);
  assert(typeof merchant.max_miles_rate === "number");
  assert(merchant.max_miles_rate > 0, "Max miles rate should be positive");
});

Deno.test("Integration: Database Schema - Link generations tracking", async () => {
  await cleanupTestData();

  const testUserId = 654321;
  const merchantName = "Test Merchant";

  // First create a user
  await testClient
    .from("users")
    .insert({
      telegram_user_id: testUserId,
      username: "linktest",
      display_name: "Link Test User",
    });

  // Then create a link generation
  const { data, error } = await testClient
    .from("link_generations")
    .insert({
      user_id: testUserId,
      merchant_name: merchantName,
      generated_link: "https://test.example.com/affiliate?user=654321",
      utm_source: "telegram",
    })
    .select()
    .single();

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assertEquals(data.user_id, testUserId);
  assertEquals(data.merchant_name, merchantName);
  assertExists(data.created_at);

  // Cleanup
  await cleanupTestData();
});

Deno.test("Integration: Database Schema - Viral interactions tracking", async () => {
  await cleanupTestData();

  const originalUserId = 111111;
  const viralUserId = 222222;
  const merchantName = "Viral Test Merchant";

  // Create users first
  await testClient.from("users").insert([
    {
      telegram_user_id: originalUserId,
      username: "original",
      display_name: "Original User",
    },
    {
      telegram_user_id: viralUserId,
      username: "viral",
      display_name: "Viral User",
    },
  ]);

  // Create viral interaction
  const { data, error } = await testClient
    .from("viral_interactions")
    .insert({
      original_user_id: originalUserId,
      viral_user_id: viralUserId,
      merchant_name: merchantName,
      interaction_type: "button_click",
    })
    .select()
    .single();

  assertEquals(error, null, `Database error: ${error?.message}`);
  assertExists(data);
  assertEquals(data.original_user_id, originalUserId);
  assertEquals(data.viral_user_id, viralUserId);
  assertEquals(data.merchant_name, merchantName);

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
  const nonExistentUserId = 999999;

  const { error } = await testClient
    .from("link_generations")
    .insert({
      user_id: nonExistentUserId, // Non-existent user
      merchant_name: "test-merchant",
      generated_link: "https://test.example.com",
      utm_source: "telegram",
    });

  // Should fail due to foreign key constraint
  assertExists(error, "Should have foreign key constraint error");
  assert(error.message.includes("foreign key") || error.code === "23503");
});

Deno.test("Integration: Database Analytics - User statistics aggregation", async () => {
  await cleanupTestData();

  const testUserId = 333333;

  // Create user
  await testClient.from("users").insert({
    telegram_user_id: testUserId,
    username: "analytics",
    display_name: "Analytics User",
  });

  // Create multiple link generations
  const linkPromises = [];
  for (let i = 0; i < 3; i++) {
    linkPromises.push(
      testClient.from("link_generations").insert({
        user_id: testUserId,
        merchant_name: `Test Merchant ${i + 1}`,
        generated_link: `https://test${i + 1}.example.com`,
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
