#!/usr/bin/env -S deno run --allow-all
// tests/integration/run-tests.ts  
// Integration test runner with comprehensive validation
// Supporting TDD workflow implementation

import { 
  getTestConfig, 
  validateTestEnvironment, 
  calculateTestMetrics,
  logTestResults,
  cleanupAllTestData,
} from "./test-config.ts";

interface TestResult {
  name: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  file: string;
  required: boolean;
  timeout: number;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: "Database Integration",
    file: "tests/integration/database.test.ts",
    required: true,
    timeout: 30000,
  },
  {
    name: "Telegram API Integration", 
    file: "tests/integration/telegram-api.test.ts",
    required: false, // Optional if no bot token
    timeout: 45000,
  },
  {
    name: "Edge Function Integration",
    file: "tests/integration/edge-function.test.ts", 
    required: true,
    timeout: 60000,
  },
  {
    name: "Viral Flow Integration",
    file: "tests/integration/viral-flow.test.ts",
    required: true,
    timeout: 90000,
  },
];

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  console.log(`\n🧪 Running ${suite.name}...`);
  console.log(`   File: ${suite.file}`);
  console.log(`   Timeout: ${suite.timeout}ms`);
  
  const startTime = performance.now();
  
  try {
    // Check if test file exists
    if (!(await fileExists(suite.file))) {
      throw new Error(`Test file not found: ${suite.file}`);
    }
    
    // Run the test with timeout
    const process = new Deno.Command("deno", {
      args: [
        "test",
        "--allow-all",
        "--reporter=pretty",
        suite.file,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    
    const child = process.spawn();
    
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Test suite timed out after ${suite.timeout}ms`));
      }, suite.timeout);
    });
    
    // Wait for completion or timeout
    const result = await Promise.race([
      child.output(),
      timeoutPromise,
    ]);
    
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (result.code === 0) {
      console.log(`✅ ${suite.name} passed in ${duration.toFixed(0)}ms`);
      return {
        name: suite.name,
        status: "passed",
        duration,
      };
    } else {
      console.error(`❌ ${suite.name} failed with exit code ${result.code}`);
      return {
        name: suite.name,
        status: "failed", 
        duration,
        error: `Exit code: ${result.code}`,
      };
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`❌ ${suite.name} failed: ${error.message}`);
    return {
      name: suite.name,
      status: "failed",
      duration,
      error: error.message,
    };
  }
}

async function main() {
  console.log("🚀 Integration Test Runner");
  console.log("===========================");
  
  // Validate environment
  console.log("\n🔧 Environment Validation:");
  const config = getTestConfig();
  const isValidEnv = validateTestEnvironment();
  
  console.log(`   Supabase URL: ${config.supabaseUrl}`);
  console.log(`   Edge Function: ${config.edgeFunctionUrl}`);
  console.log(`   Environment Valid: ${isValidEnv ? '✅' : '❌'}`);
  
  if (!isValidEnv) {
    console.error("\n❌ Environment validation failed!");
    console.error("Please set required environment variables:");
    console.error("   - SUPABASE_URL");
    console.error("   - SUPABASE_ANON_KEY");
    Deno.exit(1);
  }
  
  // Clean up any existing test data
  console.log("\n🧹 Pre-test cleanup...");
  await cleanupAllTestData();
  
  // Run test suites
  const results: TestResult[] = [];
  let hasRequiredFailures = false;
  
  for (const suite of TEST_SUITES) {
    const result = await runTestSuite(suite);
    results.push(result);
    
    if (result.status === "failed" && suite.required) {
      hasRequiredFailures = true;
    }
  }
  
  // Clean up after tests
  console.log("\n🧹 Post-test cleanup...");
  await cleanupAllTestData();
  
  // Generate and display results
  console.log("\n📊 Test Results Summary");
  console.log("========================");
  
  const metrics = calculateTestMetrics(results);
  logTestResults(metrics);
  
  // Detailed results
  console.log("\n📋 Detailed Results:");
  results.forEach(result => {
    const statusIcon = result.status === "passed" ? "✅" : result.status === "failed" ? "❌" : "⚠️";
    console.log(`   ${statusIcon} ${result.name}: ${result.status} (${result.duration.toFixed(0)}ms)`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  // Coverage estimation
  const coverageEstimate = (metrics.passedTests / metrics.totalTests) * 100;
  console.log(`\n📈 Estimated Integration Coverage: ${coverageEstimate.toFixed(1)}%`);
  
  // Determine exit code
  if (hasRequiredFailures) {
    console.log("\n❌ Integration tests failed - required test suites failed");
    Deno.exit(1);
  } else if (metrics.passedTests === metrics.totalTests) {
    console.log("\n✅ All integration tests passed successfully!");
    Deno.exit(0);
  } else {
    console.log("\n⚠️ Some non-required tests failed, but core functionality works");
    Deno.exit(0);
  }
}

// Handle script interruption
Deno.addSignalListener("SIGINT", () => {
  console.log("\n\n🛑 Test run interrupted by user");
  cleanupAllTestData().then(() => {
    Deno.exit(130);
  });
});

if (import.meta.main) {
  main().catch((error) => {
    console.error("💥 Test runner failed:", error);
    Deno.exit(1);
  });
}