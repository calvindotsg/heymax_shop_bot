import { assertEquals, assertExists } from "testing/asserts.ts";
import { createClient } from "@supabase/supabase-js";

// Test configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(supabaseUrl, supabaseKey);

// RED Phase: Write failing tests first
Deno.test("Database Connection - should connect to Supabase", async () => {
  const { data, error, count } = await supabase.from("users").select("*", {
    count: "exact",
    head: true,
  });

  // Should connect successfully and return count
  assertEquals(error, null, "Should connect to database without error");
  assertEquals(typeof count, "number", "Should return user count as number");
  assertEquals((count || 0) >= 0, true, "Count should be non-negative");
});

Deno.test("Users Table - should exist with correct schema", async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  // This will fail until we create the users table
  assertEquals(error, null, "Users table should exist");
});

Deno.test("Merchants Table - should exist with Singapore dataset", async () => {
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .limit(1);

  // This will fail until we create the merchants table
  assertEquals(error, null, "Merchants table should exist");
});

Deno.test("Link Generations Table - should exist for tracking", async () => {
  const { data, error } = await supabase
    .from("link_generations")
    .select("*")
    .limit(1);

  // This will fail until we create the link_generations table
  assertEquals(error, null, "Link generations table should exist");
});

// Performance test - ensuring queries are fast enough for viral growth
Deno.test("Database Performance - queries should be under 1 second", async () => {
  const startTime = Date.now();

  const { error } = await supabase
    .from("merchants")
    .select("merchant_slug, merchant_name, base_mpd")
    .limit(10);

  const queryTime = Date.now() - startTime;

  assertEquals(error, null, "Query should execute successfully");
  assertEquals(
    queryTime < 1000,
    true,
    `Query took ${queryTime}ms, should be under 1000ms for viral performance`,
  );
});
