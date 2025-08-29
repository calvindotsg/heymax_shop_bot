// tests/integration/test-config.ts
// Configuration and utilities for integration tests
// Supporting TDD workflow implementation

export interface TestConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  telegramBotToken: string;
  telegramTestChatId?: string;
  edgeFunctionUrl: string;
  testTimeout: number;
  retryAttempts: number;
}

export function getTestConfig(): TestConfig {
  return {
    supabaseUrl: Deno.env.get("SUPABASE_URL") || "https://test.supabase.co",
    supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY") || "test-key",
    telegramBotToken: Deno.env.get("TELEGRAM_BOT_TOKEN") || "test-token",
    telegramTestChatId: Deno.env.get("TELEGRAM_TEST_CHAT_ID"),
    edgeFunctionUrl: Deno.env.get("SUPABASE_URL") 
      ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-bot`
      : "http://localhost:54321/functions/v1/telegram-bot",
    testTimeout: 30000, // 30 seconds
    retryAttempts: 3,
  };
}

export function validateTestEnvironment(): boolean {
  const config = getTestConfig();
  
  const requiredVars = [
    { key: "SUPABASE_URL", value: config.supabaseUrl },
    { key: "SUPABASE_ANON_KEY", value: config.supabaseAnonKey },
  ];
  
  const missingVars = requiredVars.filter(
    ({ value }) => !value || value === "test-key" || value === "https://test.supabase.co"
  );
  
  if (missingVars.length > 0) {
    console.warn("⚠️ Missing environment variables for integration tests:");
    missingVars.forEach(({ key }) => console.warn(`   - ${key}`));
    return false;
  }
  
  return true;
}

export interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  averageDuration: number;
  coveragePercentage?: number;
}

export function calculateTestMetrics(results: any[]): TestMetrics {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === "passed").length;
  const failedTests = results.filter(r => r.status === "failed").length;
  const durations = results.map(r => r.duration || 0);
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);
  const averageDuration = totalDuration / totalTests;
  
  return {
    totalTests,
    passedTests,
    failedTests,
    totalDuration,
    averageDuration,
  };
}

export function logTestResults(metrics: TestMetrics): void {
  console.log("📊 Integration Test Results:");
  console.log(`   Total Tests: ${metrics.totalTests}`);
  console.log(`   Passed: ${metrics.passedTests} ✅`);
  console.log(`   Failed: ${metrics.failedTests} ${metrics.failedTests > 0 ? '❌' : '✅'}`);
  console.log(`   Total Duration: ${metrics.totalDuration.toFixed(0)}ms`);
  console.log(`   Average Duration: ${metrics.averageDuration.toFixed(0)}ms`);
  
  if (metrics.coveragePercentage) {
    console.log(`   Coverage: ${metrics.coveragePercentage.toFixed(1)}%`);
  }
}

// Test data cleanup utilities
export async function cleanupAllTestData(): Promise<void> {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const config = getTestConfig();
  
  const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
  
  try {
    // Clean up in reverse dependency order
    await client.from("viral_interactions").delete().gte("original_user_id", 100000);
    await client.from("link_generations").delete().gte("user_id", 100000);
    await client.from("users").delete().gte("telegram_user_id", 100000);
    
    console.log("🧹 Test data cleanup completed");
  } catch (error) {
    console.warn("⚠️ Test data cleanup warning:", error.message);
  }
}

// Retry utility for flaky network operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

// Test data generators
export function generateTestUser(overrides: Partial<any> = {}) {
  const baseId = 100000 + Math.floor(Math.random() * 900000);
  return {
    telegram_user_id: baseId,
    username: `testuser_${baseId}`,
    display_name: `Test User ${baseId}`,
    total_links_generated: 0,
    total_viral_conversions: 0,
    ...overrides,
  };
}

export function generateTestLinkGeneration(userId: number, overrides: Partial<any> = {}) {
  return {
    user_id: userId,
    merchant_name: "Test Merchant",
    generated_link: `https://test.example.com/affiliate?user=${userId}`,
    utm_source: "telegram",
    utm_medium: "bot",
    utm_campaign: "heymax_shop_bot",
    ...overrides,
  };
}

export function generateTestViralInteraction(
  originalUserId: number, 
  viralUserId: number, 
  overrides: Partial<any> = {}
) {
  return {
    original_user_id: originalUserId,
    viral_user_id: viralUserId,
    merchant_name: "Test Merchant",
    interaction_type: "button_click",
    ...overrides,
  };
}

// Environment validation on module load
if (import.meta.main) {
  console.log("🔧 Integration Test Configuration");
  console.log("================================");
  
  const config = getTestConfig();
  console.log("Configuration:");
  console.log(`   Supabase URL: ${config.supabaseUrl}`);
  console.log(`   Edge Function: ${config.edgeFunctionUrl}`);
  console.log(`   Test Timeout: ${config.testTimeout}ms`);
  
  const isValid = validateTestEnvironment();
  console.log(`   Environment Valid: ${isValid ? '✅' : '❌'}`);
  
  if (!isValid) {
    console.log("\nRequired environment variables:");
    console.log("   - SUPABASE_URL");
    console.log("   - SUPABASE_ANON_KEY");
    console.log("   - TELEGRAM_BOT_TOKEN (optional for some tests)");
    console.log("   - TELEGRAM_TEST_CHAT_ID (optional for message tests)");
  }
}