# TDD Framework Setup Guide - HeyMax_shop_bot

_Comprehensive Testing Framework for Supabase Edge Functions_

## 🧪 **Testing Framework Architecture**

### **Core Testing Stack**

- **Runtime**: Deno 1.30+ with native test framework
- **Database**: Supabase local development environment
- **Mocking**: Mock Service Worker (MSW) for API mocking
- **Coverage**: Deno built-in coverage reporting
- **CI/CD**: GitHub Actions with automated test pipeline
- **Performance**: Deno benchmarks and custom load testing

### **Project Structure**

```
heymax_shop_bot/
├── src/
│   ├── handlers/
│   │   ├── inline-query.ts
│   │   ├── callback-query.ts
│   │   └── webhook.ts
│   ├── services/
│   │   ├── affiliate-links.ts
│   │   ├── analytics.ts
│   │   └── user-management.ts
│   └── utils/
│       ├── database.ts
│       ├── telegram.ts
│       └── validation.ts
├── test/
│   ├── config/
│   │   ├── test-setup.ts
│   │   └── test-teardown.ts
│   ├── mocks/
│   │   ├── telegram-api.ts
│   │   ├── supabase-client.ts
│   │   └── test-data.ts
│   ├── unit/
│   │   ├── handlers/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── webhook-flow.test.ts
│   │   ├── viral-mechanics.test.ts
│   │   └── database-integration.test.ts
│   ├── performance/
│   │   ├── load-testing.test.ts
│   │   ├── memory-usage.test.ts
│   │   └── response-time.test.ts
│   └── fixtures/
│       ├── merchants.ts
│       ├── users.ts
│       └── interactions.ts
├── supabase/
│   ├── functions/
│   │   └── telegram-bot/
│   │       ├── index.ts
│   │       └── test.ts
│   └── migrations/
└── scripts/
    ├── test-setup.sh
    ├── load-test.ts
    └── coverage-report.ts
```

## 🛠️ **Development Environment Setup**

### **Prerequisites Installation**

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Install Supabase CLI
npm install -g @supabase/cli

# Install Git hooks for pre-commit testing
npm install -g husky

# Verify installations
deno --version
supabase --version
```

### **Local Development Environment**

```bash
# Clone and setup project
git clone <repository-url>
cd heymax_shop_bot

# Start Supabase local development
supabase start

# Setup test environment variables
cp .env.example .env.test
# Edit .env.test with test-specific values

# Initialize test database
supabase db reset --local
supabase db push --local

# Run initial test setup
deno run --allow-all scripts/test-setup.ts
```

### **Environment Configuration**

```bash
# .env.test - Test environment variables
ENVIRONMENT=test
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN=123456:TEST-TOKEN-FOR-TESTING-ONLY
TELEGRAM_TEST_CHAT_ID=-1001234567890

# Performance testing limits
MAX_TEST_DURATION_MS=30000
MAX_MEMORY_USAGE_MB=64
CONCURRENT_TEST_LIMIT=50

# Coverage requirements
MIN_COVERAGE_OVERALL=80
MIN_COVERAGE_CRITICAL=90
```

## 🧪 **Test Framework Configuration**

### **Base Test Setup**

```typescript
// test/config/test-setup.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { setupServer } from "https://esm.sh/msw@1.0.0/node";
import { telegramApiMocks } from "../mocks/telegram-api.ts";

// Global test configuration
export const testConfig = {
  supabase: {
    url: Deno.env.get("SUPABASE_URL") || "http://localhost:54321",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") || "",
    serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  },
  telegram: {
    botToken: Deno.env.get("TELEGRAM_BOT_TOKEN") || "test-token",
    testChatId: parseInt(
      Deno.env.get("TELEGRAM_TEST_CHAT_ID") || "-1001234567890",
    ),
  },
  performance: {
    maxTestDuration: parseInt(Deno.env.get("MAX_TEST_DURATION_MS") || "30000"),
    maxMemoryUsage: parseInt(Deno.env.get("MAX_MEMORY_USAGE_MB") || "64"),
    concurrentLimit: parseInt(Deno.env.get("CONCURRENT_TEST_LIMIT") || "50"),
  },
};

// Global test client
export const testClient = createClient(
  testConfig.supabase.url,
  testConfig.supabase.serviceKey,
);

// Mock server setup
export const mockServer = setupServer(...telegramApiMocks);

// Global test hooks
export async function globalTestSetup() {
  console.log("🧪 Setting up global test environment...");

  // Start mock server
  mockServer.listen({ onUnhandledRequest: "warn" });

  // Setup test database schema
  await setupTestDatabase();

  // Seed basic test data
  await seedGlobalTestData();

  console.log("✅ Global test environment ready");
}

export async function globalTestTeardown() {
  console.log("🧹 Cleaning up global test environment...");

  // Stop mock server
  mockServer.close();

  // Clean test database
  await cleanupTestDatabase();

  console.log("✅ Global test environment cleaned");
}

// Database setup utilities
async function setupTestDatabase() {
  // Ensure test schema exists
  await testClient.rpc("create_test_schema_if_not_exists");

  // Run test migrations
  const { error } = await testClient.rpc("run_test_migrations");
  if (error) throw new Error(`Test migration failed: ${error.message}`);
}

async function seedGlobalTestData() {
  // Import and seed basic test data
  const { testMerchants } = await import("../fixtures/merchants.ts");

  await testClient
    .from("merchants")
    .upsert(testMerchants, { onConflict: "merchant_slug" });
}

async function cleanupTestDatabase() {
  // Clean up test data in reverse dependency order
  await testClient.from("viral_interactions").delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000",
  );
  await testClient.from("link_generations").delete().neq(
    "id",
    "00000000-0000-0000-0000-000000000000",
  );
  await testClient.from("users").delete().neq("id", 0);

  // Keep merchants for other tests
}
```

### **Mock Service Configuration**

```typescript
// test/mocks/telegram-api.ts
import { rest } from "https://esm.sh/msw@1.0.0";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export const telegramApiMocks = [
  // Bot info endpoint
  rest.get(`${TELEGRAM_API_BASE}/bot*/getMe`, (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      result: {
        id: 123456789,
        is_bot: true,
        first_name: "HeyMax Shop Bot",
        username: "HeyMax_shop_bot",
        can_read_all_group_messages: false,
        supports_inline_queries: true,
      },
    }));
  }),

  // Send message endpoint
  rest.post(`${TELEGRAM_API_BASE}/bot*/sendMessage`, async (req, res, ctx) => {
    const body = await req.json();

    return res(ctx.json({
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 10000),
        date: Math.floor(Date.now() / 1000),
        chat: { id: body.chat_id, type: "group" },
        text: body.text,
        reply_markup: body.reply_markup,
      },
    }));
  }),

  // Answer inline query endpoint
  rest.post(
    `${TELEGRAM_API_BASE}/bot*/answerInlineQuery`,
    async (req, res, ctx) => {
      const body = await req.json();

      // Validate inline query structure
      if (!body.inline_query_id || !Array.isArray(body.results)) {
        return res(
          ctx.status(400),
          ctx.json({
            ok: false,
            error_code: 400,
            description: "Bad Request: invalid inline query format",
          }),
        );
      }

      return res(ctx.json({
        ok: true,
        result: true,
      }));
    },
  ),

  // Answer callback query endpoint
  rest.post(
    `${TELEGRAM_API_BASE}/bot*/answerCallbackQuery`,
    async (req, res, ctx) => {
      const body = await req.json();

      return res(ctx.json({
        ok: true,
        result: true,
      }));
    },
  ),

  // Set webhook endpoint
  rest.post(`${TELEGRAM_API_BASE}/bot*/setWebhook`, async (req, res, ctx) => {
    const body = await req.json();

    return res(ctx.json({
      ok: true,
      result: true,
      description: `Webhook was set to ${body.url}`,
    }));
  }),

  // Error simulation endpoint (for testing error handling)
  rest.post(`${TELEGRAM_API_BASE}/bot*/simulateError`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        ok: false,
        error_code: 500,
        description: "Internal Server Error - Simulated for testing",
      }),
    );
  }),
];

// Utility to reset mock call counts
export function resetMocks() {
  // Implementation depends on MSW version
  console.log("🔄 Resetting mock call counts");
}

// Utility to verify mock calls
export function verifyMockCalls(endpoint: string, expectedCount: number) {
  // Implementation to verify mock interaction counts
  console.log(`🔍 Verifying ${endpoint} called ${expectedCount} times`);
}
```

### **Test Data Fixtures**

```typescript
// test/fixtures/merchants.ts
export const testMerchants = [
  {
    merchant_slug: "test-pelago",
    merchant_name: "Test Pelago",
    tracking_link:
      "https://test-pelago.example.com/track?user={{USER_ID}}&ref=heymax",
    base_mpd: 8.0,
  },
  {
    merchant_slug: "test-apple",
    merchant_name: "Test Apple",
    tracking_link:
      "https://test-apple.example.com/affiliate?ref={{USER_ID}}&source=telegram",
    base_mpd: 2.0,
  },
  {
    merchant_slug: "test-starbucks",
    merchant_name: "Test Starbucks",
    tracking_link:
      "https://test-starbucks.example.com/rewards?member={{USER_ID}}&utm_source=heymax",
    base_mpd: 5.0,
  },
  {
    merchant_slug: "test-adidas",
    merchant_name: "Test Adidas",
    tracking_link:
      "https://test-adidas.example.com/shop?affiliate={{USER_ID}}&campaign=telegram",
    base_mpd: 4.0,
  },
];

// test/fixtures/users.ts
export const testUsers = [
  {
    id: 123456,
    username: "testuser1",
    first_seen: "2024-01-01T00:00:00Z",
    link_count: 5,
    last_active: "2024-01-15T12:00:00Z",
  },
  {
    id: 654321,
    username: "testuser2",
    first_seen: "2024-01-02T00:00:00Z",
    link_count: 3,
    last_active: "2024-01-14T09:30:00Z",
  },
  {
    id: 789012,
    username: "viraluser1",
    first_seen: "2024-01-03T00:00:00Z",
    link_count: 8,
    last_active: "2024-01-15T14:20:00Z",
  },
];

// test/fixtures/interactions.ts
export const testLinkGenerations = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    user_id: 123456,
    merchant_merchant_slug: "test-pelago",
    chat_id: -1001234567890,
    created_at: "2024-01-10T10:00:00Z",
    clicked: true,
    clicked_at: "2024-01-10T10:05:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    user_id: 654321,
    merchant_merchant_slug: "test-apple",
    chat_id: -1001234567891,
    created_at: "2024-01-11T15:30:00Z",
    clicked: false,
    clicked_at: null,
  },
];

export const testViralInteractions = [
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    original_user_id: 123456,
    viral_user_id: 789012,
    merchant_merchant_slug: "test-starbucks",
    chat_id: -1001234567890,
    created_at: "2024-01-12T16:45:00Z",
  },
];
```

## 🚀 **Test Execution Scripts**

### **Development Test Runner**

```bash
#!/bin/bash
# scripts/test-setup.sh

echo "🧪 HeyMax Shop Bot - Test Environment Setup"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v deno &> /dev/null; then
    print_error "Deno not found. Please install Deno first."
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Please install with: npm install -g @supabase/cli"
    exit 1
fi

print_status "Prerequisites OK"

# Start Supabase local development
print_status "Starting Supabase local development..."
supabase start

if [ $? -ne 0 ]; then
    print_error "Failed to start Supabase local development"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
supabase db push --local

# Setup test environment
print_status "Setting up test environment..."
deno run --allow-all test/config/test-setup.ts

# Run initial test to verify setup
print_status "Running setup verification tests..."
deno test --allow-all test/config/setup-verification.test.ts

if [ $? -eq 0 ]; then
    print_status "✅ Test environment setup completed successfully!"
    print_status "Run tests with: deno test --allow-all"
    print_status "Run with coverage: deno test --allow-all --coverage=coverage/"
else
    print_error "❌ Test environment setup failed"
    exit 1
fi
```

### **Test Execution Commands**

```bash
# Basic test commands
# Run all tests
deno test --allow-all

# Run tests with coverage
deno test --allow-all --coverage=coverage/

# Run specific test suites
deno test --allow-all test/unit/
deno test --allow-all test/integration/
deno test --allow-all test/performance/

# Run tests in watch mode during development
deno test --allow-all --watch

# Run tests with detailed output
deno test --allow-all --reporter=verbose

# Run tests in parallel (faster execution)
deno test --allow-all --parallel

# Run specific test file
deno test --allow-all test/unit/handlers/inline-query.test.ts

# Generate and view coverage report
deno coverage coverage/ --html
open coverage/html/index.html
```

### **Coverage Reporting Script**

```typescript
// scripts/coverage-report.ts
import { parse } from "https://deno.land/std@0.168.0/flags/mod.ts";

const args = parse(Deno.args);

interface CoverageRequirements {
  overall: number;
  components: Record<string, number>;
}

const requirements: CoverageRequirements = {
  overall: 80,
  components: {
    "src/handlers/inline-query.ts": 90,
    "src/handlers/callback-query.ts": 90,
    "src/services/affiliate-links.ts": 85,
    "src/services/analytics.ts": 80,
    "src/utils/database.ts": 75,
    "src/utils/telegram.ts": 80,
  },
};

async function generateCoverageReport() {
  console.log("📊 Generating coverage report...");

  // Generate LCOV coverage data
  const lcovProcess = new Deno.Command("deno", {
    args: ["coverage", "coverage/", "--lcov"],
    stdout: "piped",
    stderr: "piped",
  });

  const lcovResult = await lcovProcess.output();

  if (!lcovResult.success) {
    console.error("Failed to generate LCOV report");
    Deno.exit(1);
  }

  // Parse coverage data
  const lcovData = new TextDecoder().decode(lcovResult.stdout);
  const coverage = parseLcovData(lcovData);

  // Validate against requirements
  const violations = validateCoverage(coverage, requirements);

  // Generate HTML report if requested
  if (args.html) {
    await generateHtmlReport();
  }

  // Print summary
  printCoverageSummary(coverage, violations);

  // Exit with error code if coverage requirements not met
  if (violations.length > 0) {
    console.error(
      `\n❌ Coverage requirements not met: ${violations.length} violations`,
    );
    Deno.exit(1);
  }

  console.log("\n✅ All coverage requirements met!");
}

function parseLcovData(lcovData: string): any {
  // Parse LCOV format data
  // Implementation would parse the actual LCOV output
  return {
    overall: 85.5,
    files: {
      "src/handlers/inline-query.ts": { lines: 92.3 },
      "src/handlers/callback-query.ts": { lines: 88.7 },
      "src/services/affiliate-links.ts": { lines: 91.2 },
      // ... more files
    },
  };
}

function validateCoverage(
  coverage: any,
  requirements: CoverageRequirements,
): string[] {
  const violations: string[] = [];

  // Check overall coverage
  if (coverage.overall < requirements.overall) {
    violations.push(
      `Overall coverage ${coverage.overall}% below required ${requirements.overall}%`,
    );
  }

  // Check component coverage
  for (
    const [file, requiredCoverage] of Object.entries(requirements.components)
  ) {
    const fileCoverage = coverage.files[file]?.lines || 0;
    if (fileCoverage < requiredCoverage) {
      violations.push(
        `${file} coverage ${fileCoverage}% below required ${requiredCoverage}%`,
      );
    }
  }

  return violations;
}

async function generateHtmlReport() {
  console.log("🎨 Generating HTML coverage report...");

  const htmlProcess = new Deno.Command("deno", {
    args: ["coverage", "coverage/", "--html"],
    stdout: "piped",
  });

  await htmlProcess.output();
  console.log("📁 HTML report generated in coverage/html/");
}

function printCoverageSummary(coverage: any, violations: string[]) {
  console.log("\n📊 Coverage Summary:");
  console.log(`Overall Coverage: ${coverage.overall}%`);
  console.log("\nComponent Coverage:");

  for (const [file, data] of Object.entries(coverage.files)) {
    const coverage = (data as any).lines;
    const status = violations.some((v) => v.includes(file)) ? "❌" : "✅";
    console.log(`  ${status} ${file}: ${coverage}%`);
  }

  if (violations.length > 0) {
    console.log("\n⚠️  Coverage Violations:");
    violations.forEach((violation) => console.log(`  • ${violation}`));
  }
}

if (import.meta.main) {
  await generateCoverageReport();
}
```

## 🎯 **TDD Best Practices**

### **Red-Green-Refactor Guidelines**

#### **RED Phase Checklist**

- [ ] Write the smallest possible failing test
- [ ] Test should fail for the right reason (not syntax errors)
- [ ] Test merchant_name clearly describes expected behavior
- [ ] Test focuses on one specific behavior
- [ ] Arrange-Act-Assert pattern followed
- [ ] Mock external dependencies appropriately

#### **GREEN Phase Checklist**

- [ ] Write minimal code to make test pass
- [ ] Don't optimize prematurely
- [ ] Hard-code values if necessary initially
- [ ] Focus on making test pass, not perfect code
- [ ] Verify test now passes
- [ ] No other tests broken by changes

#### **REFACTOR Phase Checklist**

- [ ] Remove code duplication
- [ ] Improve variable and function names
- [ ] Extract reusable functions/classes
- [ ] Optimize performance if needed
- [ ] All tests still pass after refactoring
- [ ] Code is more maintainable than before

### **Test Quality Standards**

#### **Good Test Characteristics**

- **Fast**: Each test runs in <1 second
- **Independent**: Tests don't depend on each other
- **Repeatable**: Same results in any environment
- **Self-Validating**: Clear pass/fail result
- **Timely**: Written before production code

#### **Test Naming Convention**

```typescript
// Pattern: MethodUnderTest_StateUnderTest_ExpectedBehavior
Deno.test("handleInlineQuery_EmptyQuery_ReturnsHelpMessage", async () => {
  // Test implementation
});

Deno.test("generateAffiliateLink_ValidMerchant_ReturnsPersonalizedLink", async () => {
  // Test implementation
});

Deno.test("handleCallbackQuery_InvalidData_ReturnsErrorMessage", async () => {
  // Test implementation
});
```

#### **Assert Message Guidelines**

```typescript
// Good: Descriptive failure messages
assertEquals(response.status, 200, "API should return success status");
assert(
  response.body.includes("Pelago"),
  "Response should contain merchant merchant_name",
);

// Better: Custom assertion helpers
function assertValidAffiliateLink(link: string, userId: number) {
  assert(link.startsWith("https://"), "Link should be HTTPS");
  assert(
    link.includes(userId.toString()),
    `Link should contain user ID ${userId}`,
  );
  assert(
    link.includes("utm_source=telegram"),
    "Link should have UTM parameters",
  );
}
```

This comprehensive TDD framework setup provides all the necessary components for
test-driven development of the HeyMax_shop_bot, ensuring reliability,
maintainability, and confidence throughout the development process.
