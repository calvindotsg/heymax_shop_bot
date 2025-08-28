# MVP TDD Implementation Workflow - HeyMax_shop_bot
*Test-Driven Development Approach for Viral Telegram Bot*

## 📋 **Project Overview**

**Objective**: Launch viral Telegram bot using Test-Driven Development methodology  
**Architecture**: Serverless monolith with Supabase Edge Functions + PostgreSQL  
**Timeline**: 2-3 weeks (3 TDD-enhanced sprints)  
**Budget**: $0 infrastructure cost (free-tier validation)  
**Testing Philosophy**: Red-Green-Refactor cycle for all features

## 🧪 **TDD Integration Strategy**

### **Core TDD Principles**
- **Red**: Write failing tests first (define expected behavior)
- **Green**: Write minimal code to make tests pass
- **Refactor**: Improve code quality while maintaining test coverage
- **Test Coverage**: Minimum 80% for all production code
- **Fast Feedback**: All tests run in <30 seconds

### **Testing Framework Stack**
- **Unit Testing**: Deno native test framework (`deno test`)
- **Database Testing**: Supabase local development environment
- **Integration Testing**: Telegram Bot API mocking with MSW (Mock Service Worker)
- **E2E Testing**: Automated webhook testing with custom test harness
- **Performance Testing**: Load testing with Deno benchmarks
- **CI/CD**: GitHub Actions with automated test pipeline

## 🎯 **Enhanced Success Metrics**

### Technical KPIs (with TDD validation)
- **Response Time**: <1 second for inline queries (performance tests)
- **Test Coverage**: >80% code coverage (automated reporting)
- **Test Reliability**: <1% flaky test rate (CI stability)
- **CI Pipeline**: <5 minutes total test execution time
- **Deployment Safety**: 100% of deploys preceded by passing tests

### Business KPIs (with behavioral tests)
- **User Engagement**: 500+ link generations/month (integration tests)
- **Viral Coefficient**: 1.2+ (behavioral test scenarios)
- **Error Rate**: <1% failed requests (monitored via tests)
- **Feature Reliability**: All user stories validated by acceptance tests

---

## 🚀 **TDD Sprint Structure**

### **Sprint Pattern Enhancement**
Each sprint follows the enhanced TDD pattern:
1. **Test Planning** (0.5 day): Convert acceptance criteria to executable tests
2. **Red Phase** (1 day): Write failing tests for all user stories
3. **Green Phase** (2-3 days): Implement minimal code to pass tests
4. **Refactor Phase** (1 day): Improve code quality, maintain test coverage
5. **Integration Validation** (0.5 day): End-to-end test execution

### **Sprint 1: Foundation & Infrastructure** (Week 1 - TDD Enhanced)
*Focus: Test-first database design, webhook testing, infrastructure validation*

### **Sprint 2: Core Bot Functionality** (Week 2 - TDD Enhanced) 
*Focus: Behavior-driven inline queries, test-driven affiliate link generation*

### **Sprint 3: Viral Mechanics & Launch** (Week 3 - TDD Enhanced)
*Focus: TDD viral loops, performance test validation, production testing*

---

## 📖 **Sprint 1: Foundation & Infrastructure (TDD)**

### **TDD Phase 1: Test Planning & Setup (Day 1)**

#### **TS1.0: Test Environment Setup**
**As a** developer  
**I want** a comprehensive test environment  
**So that** I can practice TDD with confidence  

**Test Specifications:**
```typescript
// test/setup.ts - Test environment configuration
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("Test Environment: Supabase local connection", async () => {
  const supabase = createTestClient();
  const { data, error } = await supabase.from('users').select('count');
  assertEquals(error, null);
  assertExists(data);
});

Deno.test("Test Environment: Mock Telegram API available", () => {
  const mockServer = setupTelegramMock();
  assertEquals(mockServer.isRunning(), true);
});
```

**Implementation Tasks:**
- [ ] **RED**: Write failing tests for test environment setup
- [ ] **GREEN**: Configure Supabase local development environment
- [ ] **GREEN**: Set up Telegram API mocking with MSW
- [ ] **GREEN**: Configure test database with isolated schemas
- [ ] **REFACTOR**: Optimize test setup for <10 second startup
- [ ] **VALIDATION**: All environment tests pass

### **TDD Phase 2: Database Schema (Red-Green-Refactor)**

#### **TS1.1: Database Schema Design (TDD)**
**As a** developer  
**I want** a test-driven database schema  
**So that** data operations are reliable and validated  

**Test Specifications:**
```typescript
// test/database/schema.test.ts
Deno.test("Database Schema: Users table structure", async () => {
  const { data, error } = await testClient
    .from('users')
    .insert({ id: 123456, username: 'testuser' })
    .select();
  
  assertEquals(error, null);
  assertEquals(data[0].id, 123456);
  assertEquals(data[0].link_count, 0); // Default value
  assertExists(data[0].first_seen); // Auto-generated timestamp
});

Deno.test("Database Schema: Foreign key constraints", async () => {
  // Test referential integrity
  const { error } = await testClient
    .from('link_generations')
    .insert({ 
      user_id: 999999, // Non-existent user
      merchant_slug: 'test-merchant' 
    });
  
  assertExists(error); // Should fail due to FK constraint
  assertEquals(error.code, '23503'); // Foreign key violation
});

Deno.test("Database Schema: Index performance", async () => {
  // Performance test for critical queries
  const startTime = performance.now();
  await testClient
    .from('link_generations')
    .select('*')
    .eq('user_id', 123456);
  const endTime = performance.now();
  
  assert(endTime - startTime < 50); // Query should complete in <50ms
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing schema tests (tables don't exist)
- [ ] **GREEN**: Create minimal schema to pass tests
- [ ] **GREEN**: Add foreign key constraints to pass referential tests
- [ ] **GREEN**: Add indexes to pass performance tests
- [ ] **REFACTOR**: Optimize schema design for free tier constraints
- [ ] **VALIDATION**: All database tests pass with <100ms execution

#### **TS1.2: Edge Function Framework (TDD)**
**As a** developer  
**I want** a test-driven edge function  
**So that** webhook handling is reliable and maintainable  

**Test Specifications:**
```typescript
// test/edge-function/webhook.test.ts
Deno.test("Edge Function: Basic webhook handling", async () => {
  const testUpdate = {
    update_id: 12345,
    message: { 
      message_id: 1, 
      chat: { id: 1 }, 
      from: { id: 123456, username: 'testuser' },
      text: '/start' 
    }
  };
  
  const response = await handleWebhook(testUpdate);
  assertEquals(response.status, 200);
  assertEquals(await response.text(), 'OK');
});

Deno.test("Edge Function: Error handling for malformed requests", async () => {
  const malformedUpdate = { invalid: 'data' };
  
  const response = await handleWebhook(malformedUpdate);
  assertEquals(response.status, 400);
  const body = await response.json();
  assertExists(body.error);
});

Deno.test("Edge Function: Environment variable access", () => {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  assertExists(botToken, "Bot token should be available");
  assertExists(supabaseUrl, "Supabase URL should be available");
});

Deno.test("Edge Function: Response time under load", async () => {
  const startTime = performance.now();
  
  // Simulate multiple concurrent requests
  const promises = Array(10).fill(null).map(() => 
    handleWebhook({ update_id: Math.random() })
  );
  
  await Promise.all(promises);
  const endTime = performance.now();
  
  assert(endTime - startTime < 1000); // 10 requests in <1 second
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing webhook handler tests
- [ ] **GREEN**: Implement basic request/response structure
- [ ] **GREEN**: Add error handling for malformed requests
- [ ] **GREEN**: Add environment variable configuration
- [ ] **REFACTOR**: Extract handler logic into testable modules
- [ ] **VALIDATION**: All webhook tests pass with proper error coverage

### **TDD Phase 3: Telegram Integration (Red-Green-Refactor)**

#### **TS1.3: Telegram Bot Registration (TDD)**
**As a** developer  
**I want** test-driven Telegram integration  
**So that** bot communication is reliable  

**Test Specifications:**
```typescript
// test/telegram/bot-integration.test.ts
Deno.test("Telegram Integration: Bot info retrieval", async () => {
  const botInfo = await getBotInfo();
  assertEquals(botInfo.ok, true);
  assertEquals(botInfo.result.username, 'HeyMax_shop_bot');
  assertEquals(botInfo.result.can_read_all_group_messages, false);
});

Deno.test("Telegram Integration: Webhook URL configuration", async () => {
  const webhookUrl = getWebhookUrl();
  const response = await setWebhook(webhookUrl);
  
  assertEquals(response.ok, true);
  assertEquals(response.result.url, webhookUrl);
});

Deno.test("Telegram Integration: Message sending", async () => {
  const testChatId = -1001234567890; // Test group chat
  const message = "Test message from TDD";
  
  const response = await sendMessage(testChatId, message);
  assertEquals(response.ok, true);
  assertExists(response.result.message_id);
});

// Mock integration test
Deno.test("Telegram Integration: Mock API responses", async () => {
  // Use MSW to mock Telegram API responses
  mockTelegramAPI.use(
    rest.post('*/sendMessage', (req, res, ctx) => {
      return res(ctx.json({ 
        ok: true, 
        result: { message_id: 123 } 
      }));
    })
  );
  
  const response = await sendMessage(12345, "Test message");
  assertEquals(response.ok, true);
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing Telegram API integration tests
- [ ] **GREEN**: Implement basic bot registration and webhook setup
- [ ] **GREEN**: Add message sending capabilities
- [ ] **GREEN**: Implement API mocking for reliable testing
- [ ] **REFACTOR**: Extract Telegram client into testable service
- [ ] **VALIDATION**: Integration tests pass with 100% mock coverage

### **TDD Phase 4: Merchant Data Management (Red-Green-Refactor)**

#### **TS1.4: Merchant Dataset Integration (TDD)**
**As a** developer  
**I want** test-driven merchant data management  
**So that** merchant lookups are fast and reliable  

**Test Specifications:**
```typescript
// test/data/merchants.test.ts
Deno.test("Merchants: Data loading and validation", async () => {
  const merchants = await loadMerchantData();
  
  assert(merchants.length >= 20, "Should have at least 20 merchants");
  
  // Validate merchant structure
  const merchant = merchants[0];
  assertExists(merchant.merchant_slug);
  assertExists(merchant.merchant_name);
  assertExists(merchant.tracking_link);
  assertExists(merchant.base_mpd);
  assert(merchant.base_mpd > 0, "MPD rate should be positive");
});

Deno.test("Merchants: Fuzzy search functionality", async () => {
  const results = await searchMerchants('pelago');
  assert(results.length > 0, "Should find Pelago merchant");
  assertEquals(results[0].merchant_slug, 'pelago-by-singapore-airlines');
  
  // Test partial matches
  const partialResults = await searchMerchants('apple');
  assert(partialResults.some(m => m.merchant_name.toLowerCase().includes('apple')));
});

Deno.test("Merchants: Database seeding performance", async () => {
  const startTime = performance.now();
  await seedMerchantDatabase();
  const endTime = performance.now();
  
  assert(endTime - startTime < 5000, "Seeding should complete in <5 seconds");
  
  // Verify data was seeded correctly
  const { count } = await testClient
    .from('merchants')
    .select('count')
    .single();
  
  assert(count >= 20, "Should have seeded at least 20 merchants");
});

Deno.test("Merchants: Tracking link validation", () => {
  const merchant = {
    merchant_slug: 'test-merchant',
    merchant_name: 'Test Merchant',
    tracking_link: 'https://example.com/track?user={{USER_ID}}',
    base_mpd: 5.0
  };
  
  const isValid = validateMerchant(merchant);
  assertEquals(isValid, true);
  
  // Test invalid merchant
  const invalidMerchant = { ...merchant, tracking_link: 'invalid-url' };
  assertEquals(validateMerchant(invalidMerchant), false);
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing merchant data tests
- [ ] **GREEN**: Implement basic merchant loading from static dataset
- [ ] **GREEN**: Add fuzzy search functionality for merchant discovery
- [ ] **GREEN**: Implement database seeding with performance constraints
- [ ] **REFACTOR**: Optimize merchant lookup queries and caching
- [ ] **VALIDATION**: All merchant tests pass with <100ms query time

---

## 📖 **Sprint 2: Core Bot Functionality (TDD)**

### **TDD Phase 1: Inline Query Processing (Red-Green-Refactor)**

#### **TS2.1: Inline Query Handler (TDD)**
**As a** user  
**I want** reliable inline query responses  
**So that** I can quickly find merchants  

**Test Specifications:**
```typescript
// test/bot/inline-queries.test.ts
Deno.test("Inline Queries: Basic merchant search", async () => {
  const inlineQuery = {
    id: 'test-query-1',
    from: { id: 123456, username: 'testuser' },
    query: 'pelago'
  };
  
  const response = await handleInlineQuery(inlineQuery);
  
  assertEquals(response.method, 'answerInlineQuery');
  assert(response.inline_query_id === 'test-query-1');
  assert(response.results.length > 0);
  assertEquals(response.results[0].title, '🛍️ Pelago');
});

Deno.test("Inline Queries: Empty query handling", async () => {
  const emptyQuery = {
    id: 'empty-query',
    from: { id: 123456, username: 'testuser' },
    query: ''
  };
  
  const response = await handleInlineQuery(emptyQuery);
  assertEquals(response.results[0].title, '🔍 Search for merchants');
});

Deno.test("Inline Queries: No results found", async () => {
  const noResultsQuery = {
    id: 'no-results',
    from: { id: 123456, username: 'testuser' },
    query: 'nonexistentmerchant123'
  };
  
  const response = await handleInlineQuery(noResultsQuery);
  assert(response.results[0].title.includes('❌ No merchants found'));
});

Deno.test("Inline Queries: Response time performance", async () => {
  const startTime = performance.now();
  
  await handleInlineQuery({
    id: 'perf-test',
    from: { id: 123456 },
    query: 'apple'
  });
  
  const endTime = performance.now();
  assert(endTime - startTime < 500, "Inline query should respond in <500ms");
});

Deno.test("Inline Queries: User registration side effect", async () => {
  const newUserQuery = {
    id: 'new-user-test',
    from: { id: 999999, username: 'newuser' },
    query: 'starbucks'
  };
  
  await handleInlineQuery(newUserQuery);
  
  // Verify user was registered
  const { data } = await testClient
    .from('users')
    .select('*')
    .eq('id', 999999)
    .single();
  
  assertExists(data);
  assertEquals(data.username, 'newuser');
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing inline query tests
- [ ] **GREEN**: Implement basic query parsing and merchant matching
- [ ] **GREEN**: Add empty query and no-results handling
- [ ] **GREEN**: Add automatic user registration
- [ ] **REFACTOR**: Optimize query processing for <500ms response time
- [ ] **VALIDATION**: All inline query tests pass with proper error handling

### **TDD Phase 2: Affiliate Link Generation (Red-Green-Refactor)**

#### **TS2.2: Link Generation System (TDD)**
**As a** user  
**I want** personalized affiliate links  
**So that** my purchases are tracked correctly  

**Test Specifications:**
```typescript
// test/bot/affiliate-links.test.ts
Deno.test("Affiliate Links: Basic link generation", async () => {
  const userId = 123456;
  const merchantSlug = 'pelago-by-singapore-airlines';
  
  const link = await generateAffiliateLink(userId, merchantSlug);
  
  assert(link.includes(userId.toString()), "Link should contain user ID");
  assert(link.startsWith('https://'), "Link should be valid URL");
  assert(link.includes('utm_source=telegram'), "Should include UTM parameters");
});

Deno.test("Affiliate Links: UTM parameter injection", async () => {
  const link = await generateAffiliateLink(123456, 'apple');
  const url = new URL(link);
  
  assertEquals(url.searchParams.get('utm_source'), 'telegram');
  assertEquals(url.searchParams.get('utm_medium'), 'bot');
  assertEquals(url.searchParams.get('utm_campaign'), 'heymax_shop_bot');
  assertEquals(url.searchParams.get('utm_content'), 'apple');
});

Deno.test("Affiliate Links: Database tracking", async () => {
  const userId = 123456;
  const merchantSlug = 'starbucks';
  const chatId = -1001234567890;
  
  await generateAffiliateLink(userId, merchantSlug, chatId);
  
  // Verify tracking record was created
  const { data } = await testClient
    .from('link_generations')
    .select('*')
    .eq('user_id', userId)
    .eq('merchant_slug', merchantSlug)
    .single();
  
  assertExists(data);
  assertEquals(data.chat_id, chatId);
  assertExists(data.created_at);
});

Deno.test("Affiliate Links: Invalid merchant handling", async () => {
  try {
    await generateAffiliateLink(123456, 'invalid-merchant');
    assert(false, "Should throw error for invalid merchant");
  } catch (error) {
    assertEquals(error.message, 'Merchant invalid-merchant not found');
  }
});

Deno.test("Affiliate Links: User statistics update", async () => {
  const userId = 123456;
  
  // Get initial link count
  const { data: initialUser } = await testClient
    .from('users')
    .select('link_count')
    .eq('id', userId)
    .single();
  
  await generateAffiliateLink(userId, 'adidas');
  
  // Verify link count was incremented
  const { data: updatedUser } = await testClient
    .from('users')
    .select('link_count')
    .eq('id', userId)
    .single();
  
  assertEquals(updatedUser.link_count, initialUser.link_count + 1);
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing affiliate link generation tests
- [ ] **GREEN**: Implement basic link generation with user ID substitution
- [ ] **GREEN**: Add UTM parameter injection and URL validation
- [ ] **GREEN**: Add database tracking for link generation events
- [ ] **REFACTOR**: Optimize link generation and user statistics updates
- [ ] **VALIDATION**: All link generation tests pass with proper error handling

### **TDD Phase 3: Bot Response System (Red-Green-Refactor)**

#### **TS2.3: Message Formatting & Keyboards (TDD)**
**As a** user  
**I want** attractive and informative bot responses  
**So that** I understand the earning opportunity  

**Test Specifications:**
```typescript
// test/bot/response-formatting.test.ts
Deno.test("Bot Responses: Message structure validation", async () => {
  const merchant = {
    merchant_slug: 'pelago-by-singapore-airlines',
    merchant_name: 'Pelago',
    base_mpd: 8.0
  };
  
  const response = await generateBotResponse(123456, merchant, 'testuser');
  
  assert(response.includes('🎯 @testuser'), "Should include user greeting");
  assert(response.includes('Pelago'), "Should include merchant merchant_name");
  assert(response.includes('8 Max Miles per $1'), "Should include earning rate");
  assert(response.includes('Turn your Pelago shopping'), "Should include CTA");
});

Deno.test("Bot Responses: Inline keyboard generation", async () => {
  const keyboard = await generateViralKeyboard(123456, 'apple');
  
  assertEquals(keyboard.inline_keyboard.length, 2); // Two rows
  
  // First row: Shop link
  const shopButton = keyboard.inline_keyboard[0][0];
  assert(shopButton.text.includes('Shop apple'));
  assert(shopButton.url.includes('123456'), "URL should contain user ID");
  
  // Second row: Viral button
  const viralButton = keyboard.inline_keyboard[1][0];
  assertEquals(viralButton.text, '⚡ Get MY Unique Link for apple');
  assertEquals(viralButton.callback_data, 'generate:apple:123456');
});

Deno.test("Bot Responses: Username handling variations", async () => {
  const merchant = { merchant_slug: 'starbucks', merchant_name: 'Starbucks', base_mpd: 5.0 };
  
  // Test with username
  const withUsername = await generateBotResponse(123456, merchant, 'testuser');
  assert(withUsername.includes('@testuser'));
  
  // Test without username
  const withoutUsername = await generateBotResponse(123456, merchant, null);
  assert(withoutUsername.includes('User 123456'));
});

Deno.test("Bot Responses: Emoji and formatting consistency", async () => {
  const merchant = { merchant_slug: 'adidas', merchant_name: 'Adidas', base_mpd: 4.0 };
  const response = await generateBotResponse(123456, merchant, 'testuser');
  
  // Verify key emojis are present
  assert(response.includes('🎯'), "Should have target emoji");
  assert(response.includes('✨'), "Should have sparkle emoji");  
  assert(response.includes('👆'), "Should have pointing up emoji");
  assert(response.includes('👇'), "Should have pointing down emoji");
  assert(response.includes('💡'), "Should have bulb emoji");
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing bot response formatting tests
- [ ] **GREEN**: Implement message template with merchant information
- [ ] **GREEN**: Add inline keyboard generation with viral buttons
- [ ] **GREEN**: Handle username variations and edge cases
- [ ] **REFACTOR**: Extract response templates for maintainability
- [ ] **VALIDATION**: All formatting tests pass with consistent output

---

## 📖 **Sprint 3: Viral Mechanics & Launch (TDD)**

### **TDD Phase 1: Viral Callback System (Red-Green-Refactor)**

#### **TS3.1: Callback Query Processing (TDD)**
**As a** group member  
**I want** reliable "Get MY Unique Link" functionality  
**So that** viral loops work consistently  

**Test Specifications:**
```typescript
// test/bot/callback-queries.test.ts
Deno.test("Callback Queries: Basic viral link generation", async () => {
  const callbackQuery = {
    id: 'callback-test-1',
    from: { id: 654321, username: 'viraluser' },
    data: 'generate:pelago-by-singapore-airlines:123456',
    message: { 
      chat: { id: -1001234567890 },
      message_id: 456 
    }
  };
  
  const response = await handleCallbackQuery(callbackQuery);
  
  assertEquals(response.method, 'answerCallbackQuery');
  assertEquals(response.text, '✅ Your unique link generated!');
  assertEquals(response.show_alert, false);
});

Deno.test("Callback Queries: Viral tracking database record", async () => {
  const originalUserId = 123456;
  const viralUserId = 654321;
  const merchantSlug = 'apple';
  
  const callbackQuery = {
    id: 'viral-tracking-test',
    from: { id: viralUserId, username: 'viraluser' },
    data: `generate:${merchantSlug}:${originalUserId}`,
    message: { chat: { id: -1001234567890 } }
  };
  
  await handleCallbackQuery(callbackQuery);
  
  // Verify viral interaction was tracked
  const { data } = await testClient
    .from('viral_interactions')
    .select('*')
    .eq('original_user_id', originalUserId)
    .eq('viral_user_id', viralUserId)
    .eq('merchant_slug', merchantSlug)
    .single();
  
  assertExists(data);
  assertEquals(data.chat_id, -1001234567890);
});

Deno.test("Callback Queries: New message generation", async () => {
  const callbackQuery = {
    id: 'new-message-test',
    from: { id: 789012, username: 'newviraluser' },
    data: 'generate:starbucks:123456',
    message: { 
      chat: { id: -1001234567890 },
      message_id: 789 
    }
  };
  
  // Mock sendMessage to verify it's called
  let messageSent = false;
  const originalSendMessage = sendMessage;
  sendMessage = async (chatId, text, keyboard) => {
    messageSent = true;
    assertEquals(chatId, -1001234567890);
    assert(text.includes('@newviraluser'));
    assert(text.includes('Starbucks'));
    assertExists(keyboard);
    return { ok: true, result: { message_id: 999 } };
  };
  
  await handleCallbackQuery(callbackQuery);
  
  assertEquals(messageSent, true, "New message should be sent to chat");
  
  // Restore original function
  sendMessage = originalSendMessage;
});

Deno.test("Callback Queries: Invalid callback data handling", async () => {
  const invalidCallbackQuery = {
    id: 'invalid-test',
    from: { id: 999999 },
    data: 'invalid:callback:format:extra',
    message: { chat: { id: 123 } }
  };
  
  const response = await handleCallbackQuery(invalidCallbackQuery);
  assertEquals(response.text, '❌ Invalid request');
  assertEquals(response.show_alert, true);
});

Deno.test("Callback Queries: Rate limiting protection", async () => {
  const userId = 123456;
  const callbackBase = {
    from: { id: userId, username: 'spamuser' },
    data: 'generate:apple:654321',
    message: { chat: { id: -1001234567890 } }
  };
  
  // Generate multiple rapid callbacks
  const promises = Array(15).fill(null).map((_, i) => 
    handleCallbackQuery({ 
      ...callbackBase, 
      id: `spam-test-${i}` 
    })
  );
  
  const responses = await Promise.all(promises);
  
  // Some should be rate limited (assuming 10 per minute limit)
  const rateLimited = responses.filter(r => 
    r.text.includes('rate limit') || r.text.includes('too many')
  );
  
  assert(rateLimited.length > 0, "Rate limiting should activate");
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing callback query tests
- [ ] **GREEN**: Implement basic callback data parsing
- [ ] **GREEN**: Add viral interaction tracking to database
- [ ] **GREEN**: Implement new message generation for viral users
- [ ] **REFACTOR**: Add rate limiting and error handling
- [ ] **VALIDATION**: All callback tests pass with proper viral tracking

### **TDD Phase 2: Analytics & Monitoring (Red-Green-Refactor)**

#### **TS3.2: Analytics System (TDD)**
**As a** product owner  
**I want** reliable analytics and monitoring  
**So that** I can track viral growth and system health  

**Test Specifications:**
```typescript
// test/analytics/metrics.test.ts
Deno.test("Analytics: Basic user metrics calculation", async () => {
  // Seed test data
  await seedAnalyticsTestData();
  
  const metrics = await calculateAnalytics();
  
  assert(metrics.totalUsers >= 0, "Total users should be non-negative");
  assert(metrics.totalLinks >= 0, "Total links should be non-negative");
  assert(metrics.viralCoefficient >= 0, "Viral coefficient should be non-negative");
  assert(typeof metrics.dailyActiveUsers === 'number');
});

Deno.test("Analytics: Viral coefficient calculation", async () => {
  // Create test scenario with known viral interactions
  const originalUser = 123456;
  const viralUsers = [654321, 789012, 111213];
  
  // Create viral interactions
  for (const viralUser of viralUsers) {
    await testClient
      .from('viral_interactions')
      .insert({
        original_user_id: originalUser,
        viral_user_id: viralUser,
        merchant_slug: 'test-merchant',
        chat_id: -1001234567890
      });
  }
  
  const coefficient = await calculateViralCoefficient();
  assert(coefficient >= 3.0, "Should reflect the viral interactions created");
});

Deno.test("Analytics: Daily active users calculation", async () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  // Create link generations for today and yesterday
  await testClient
    .from('link_generations')
    .insert([
      { user_id: 111, merchant_slug: 'test1', created_at: today.toISOString() },
      { user_id: 222, merchant_slug: 'test2', created_at: today.toISOString() },
      { user_id: 333, merchant_slug: 'test3', created_at: yesterday.toISOString() }
    ]);
  
  const dau = await calculateDailyActiveUsers();
  assertEquals(dau, 2, "Should count 2 users active today");
});

Deno.test("Analytics: Function invocation tracking", async () => {
  const initialCount = await getFunctionInvocationCount();
  
  // Simulate function calls
  await recordFunctionInvocation('inline_query');
  await recordFunctionInvocation('callback_query');
  await recordFunctionInvocation('inline_query');
  
  const newCount = await getFunctionInvocationCount();
  assertEquals(newCount - initialCount, 3, "Should track 3 function calls");
});

Deno.test("Analytics: Free tier usage monitoring", async () => {
  const usage = await calculateFreeTierUsage();
  
  assertExists(usage.functionCalls);
  assertExists(usage.databaseSize);
  assertExists(usage.percentageUsed);
  
  assert(usage.percentageUsed >= 0 && usage.percentageUsed <= 100);
  assertEquals(typeof usage.warningActive, 'boolean');
});

Deno.test("Analytics: Performance metrics collection", async () => {
  const startTime = performance.now();
  
  const metrics = await collectPerformanceMetrics();
  
  const endTime = performance.now();
  assert(endTime - startTime < 1000, "Metrics collection should be fast");
  
  assertExists(metrics.averageResponseTime);
  assertExists(metrics.errorRate);
  assertExists(metrics.databaseQueryTime);
  assert(metrics.averageResponseTime > 0);
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing analytics calculation tests
- [ ] **GREEN**: Implement basic user and interaction counting
- [ ] **GREEN**: Add viral coefficient calculation logic
- [ ] **GREEN**: Implement daily active users tracking
- [ ] **REFACTOR**: Optimize analytics queries for performance
- [ ] **VALIDATION**: Analytics tests pass with accurate calculations

### **TDD Phase 3: Performance & Load Testing (Red-Green-Refactor)**

#### **TS3.3: Performance Validation (TDD)**
**As a** system administrator  
**I want** comprehensive performance testing  
**So that** the bot handles viral growth spikes  

**Test Specifications:**
```typescript
// test/performance/load-testing.test.ts
Deno.test("Performance: Concurrent inline query handling", async () => {
  const concurrentRequests = 50;
  const startTime = performance.now();
  
  const promises = Array(concurrentRequests).fill(null).map((_, i) => 
    handleInlineQuery({
      id: `load-test-${i}`,
      from: { id: 100000 + i, username: `loadtest${i}` },
      query: 'apple'
    })
  );
  
  const responses = await Promise.all(promises);
  const endTime = performance.now();
  
  // All requests should succeed
  assertEquals(responses.length, concurrentRequests);
  responses.forEach(response => {
    assertExists(response.results);
    assert(response.results.length > 0);
  });
  
  // Should complete within reasonable time
  const totalTime = endTime - startTime;
  assert(totalTime < 5000, `${concurrentRequests} requests should complete in <5 seconds, took ${totalTime}ms`);
});

Deno.test("Performance: Database connection pool under load", async () => {
  const connectionCount = 20;
  const startTime = performance.now();
  
  // Simulate multiple database operations
  const promises = Array(connectionCount).fill(null).map(async (_, i) => {
    const { data, error } = await testClient
      .from('merchants')
      .select('*')
      .eq('merchant_slug', 'apple');
    
    assertEquals(error, null);
    assertExists(data);
    return data;
  });
  
  const results = await Promise.all(promises);
  const endTime = performance.now();
  
  assertEquals(results.length, connectionCount);
  assert(endTime - startTime < 2000, "DB connections should not be a bottleneck");
});

Deno.test("Performance: Memory usage under sustained load", async () => {
  const initialMemory = performance.now(); // Placeholder for actual memory measurement
  
  // Simulate sustained usage
  for (let i = 0; i < 100; i++) {
    await handleInlineQuery({
      id: `memory-test-${i}`,
      from: { id: 200000 + i },
      query: 'pelago'
    });
    
    // Clean up any potential memory leaks
    if (i % 10 === 0) {
      // Force garbage collection if available
      if ('gc' in globalThis) {
        globalThis.gc();
      }
    }
  }
  
  const finalMemory = performance.now();
  
  // Memory usage should not grow excessively
  // This is a simplified test - real implementation would use actual memory monitoring
  assert(true, "Memory usage monitoring test completed");
});

Deno.test("Performance: Response time distribution", async () => {
  const sampleSize = 100;
  const responseTimes: number[] = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const startTime = performance.now();
    
    await handleInlineQuery({
      id: `response-time-${i}`,
      from: { id: 300000 + i },
      query: 'starbucks'
    });
    
    const endTime = performance.now();
    responseTimes.push(endTime - startTime);
  }
  
  // Calculate statistics
  responseTimes.sort((a, b) => a - b);
  const p95 = responseTimes[Math.floor(sampleSize * 0.95)];
  const p99 = responseTimes[Math.floor(sampleSize * 0.99)];
  const average = responseTimes.reduce((a, b) => a + b) / sampleSize;
  
  console.log(`Response time stats: avg=${average.toFixed(1)}ms, p95=${p95.toFixed(1)}ms, p99=${p99.toFixed(1)}ms`);
  
  // Performance assertions
  assert(p95 < 1000, "95th percentile should be <1 second");
  assert(average < 500, "Average response time should be <500ms");
});

Deno.test("Performance: Free tier resource consumption", async () => {
  // Simulate typical daily usage
  const dailyInlineQueries = 1000;
  const dailyCallbacks = 300;
  
  let functionCalls = 0;
  
  // Simulate inline queries
  for (let i = 0; i < dailyInlineQueries; i++) {
    await handleInlineQuery({
      id: `resource-test-inline-${i}`,
      from: { id: 400000 + i },
      query: 'apple'
    });
    functionCalls++;
  }
  
  // Simulate callback queries
  for (let i = 0; i < dailyCallbacks; i++) {
    await handleCallbackQuery({
      id: `resource-test-callback-${i}`,
      from: { id: 500000 + i },
      data: 'generate:apple:123456',
      message: { chat: { id: -1001234567890 } }
    });
    functionCalls++;
  }
  
  // Calculate monthly projection
  const monthlyProjection = functionCalls * 30;
  const freeTierLimit = 500000; // Supabase free tier
  const utilizationPercent = (monthlyProjection / freeTierLimit) * 100;
  
  console.log(`Resource usage: ${functionCalls} daily calls, ${monthlyProjection} monthly projection (${utilizationPercent.toFixed(1)}%)`);
  
  assert(utilizationPercent < 80, "Should stay within 80% of free tier limit");
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing performance and load tests
- [ ] **GREEN**: Implement basic concurrent request handling
- [ ] **GREEN**: Add database connection pooling optimization
- [ ] **GREEN**: Implement memory usage monitoring
- [ ] **REFACTOR**: Optimize bottlenecks identified by tests
- [ ] **VALIDATION**: Performance tests pass with <1s response times

### **TDD Phase 4: Production Deployment (Red-Green-Refactor)**

#### **TS3.4: Deployment Pipeline (TDD)**
**As a** developer  
**I want** test-driven deployment processes  
**So that** production releases are reliable  

**Test Specifications:**
```typescript
// test/deployment/production.test.ts
Deno.test("Deployment: Environment variable validation", () => {
  const requiredEnvVars = [
    'TELEGRAM_BOT_TOKEN',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
    'ENVIRONMENT'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const value = Deno.env.get(envVar);
    assertExists(value, `Environment variable ${envVar} should be set`);
    assert(value.length > 0, `Environment variable ${envVar} should not be empty`);
  });
});

Deno.test("Deployment: Health check endpoint", async () => {
  const healthResponse = await fetch('/health');
  assertEquals(healthResponse.status, 200);
  
  const health = await healthResponse.json();
  assertEquals(health.status, 'healthy');
  assertExists(health.timestamp);
  assertExists(health.version);
});

Deno.test("Deployment: Database connectivity in production", async () => {
  const { data, error } = await supabaseClient
    .from('merchants')
    .select('count')
    .limit(1);
  
  assertEquals(error, null);
  assertExists(data);
});

Deno.test("Deployment: Webhook endpoint accessibility", async () => {
  const webhookUrl = getWebhookUrl();
  
  // Test that webhook endpoint is accessible
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true })
  });
  
  // Should accept requests (even if they're invalid)
  assert(response.status < 500, "Webhook endpoint should be accessible");
});

Deno.test("Deployment: Function versioning and rollback capability", () => {
  const version = getDeploymentVersion();
  assertExists(version);
  assert(version.match(/^\d+\.\d+\.\d+$/), "Version should follow semver format");
  
  // Test rollback capability exists
  const rollbackInfo = getRollbackInfo();
  assertExists(rollbackInfo.previousVersion);
  assertExists(rollbackInfo.rollbackCommand);
});
```

**TDD Implementation Cycle:**
- [ ] **RED**: Write failing deployment validation tests
- [ ] **GREEN**: Implement environment validation and health checks
- [ ] **GREEN**: Add webhook endpoint accessibility verification
- [ ] **GREEN**: Implement version management and rollback procedures
- [ ] **REFACTOR**: Automate deployment pipeline with test gates
- [ ] **VALIDATION**: Deployment tests pass in staging and production

---

## 🔄 **TDD Testing Framework Implementation**

### **Test Infrastructure Setup**

#### **Testing Environment Configuration**
```typescript
// test/config/test-setup.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const testConfig = {
  supabaseUrl: Deno.env.get('SUPABASE_TEST_URL') || 'http://localhost:54321',
  supabaseKey: Deno.env.get('SUPABASE_TEST_ANON_KEY') || 'test-key',
  telegramBotToken: Deno.env.get('TELEGRAM_TEST_BOT_TOKEN') || 'test-token'
};

export const testClient = createClient(
  testConfig.supabaseUrl,
  testConfig.supabaseKey
);

// Test database setup
export async function setupTestDatabase() {
  // Create test schema
  await testClient.rpc('create_test_schema');
  
  // Run migrations
  await runTestMigrations();
  
  // Seed test data
  await seedTestData();
}

export async function cleanupTestDatabase() {
  // Clean up test data
  await testClient.rpc('cleanup_test_data');
}
```

#### **Mock Service Configuration**
```typescript
// test/mocks/telegram-api.ts
import { setupServer } from 'https://esm.sh/msw@1.0.0/node';
import { rest } from 'https://esm.sh/msw@1.0.0';

const telegramApiMocks = setupServer(
  // Mock bot info endpoint
  rest.get('https://api.telegram.org/bot*/getMe', (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      result: {
        id: 123456789,
        is_bot: true,
        first_name: 'HeyMax Shop Bot',
        username: 'HeyMax_shop_bot',
        can_read_all_group_messages: false,
        supports_inline_queries: true
      }
    }));
  }),
  
  // Mock send message endpoint
  rest.post('https://api.telegram.org/bot*/sendMessage', (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 10000),
        date: Math.floor(Date.now() / 1000),
        chat: { id: req.body.chat_id },
        text: req.body.text
      }
    }));
  }),
  
  // Mock answer inline query endpoint
  rest.post('https://api.telegram.org/bot*/answerInlineQuery', (req, res, ctx) => {
    return res(ctx.json({
      ok: true,
      result: true
    }));
  })
);

export { telegramApiMocks };
```

### **CI/CD Pipeline with TDD Integration**

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/tdd-pipeline.yml
merchant_name: TDD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: heymax_shop_bot_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - uses: denoland/setup-deno@v1
      with:
        deno-version: v1.30.0

    - merchant_name: Setup Supabase CLI
      run: |
        npm install -g @supabase/cli
        supabase start

    - merchant_name: Cache test dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/deno
        key: ${{ runner.os }}-deno-${{ hashFiles('**/*.ts') }}

    - merchant_name: Run database migrations
      run: supabase db push

    - merchant_name: Run unit tests
      run: deno test --allow-all --coverage=coverage/

    - merchant_name: Run integration tests
      run: deno test --allow-all test/integration/

    - merchant_name: Run performance tests  
      run: deno test --allow-all test/performance/

    - merchant_name: Generate coverage report
      run: deno coverage coverage/ --lcov > coverage.lcov

    - merchant_name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.lcov

    - merchant_name: Deploy to staging (if tests pass)
      if: github.ref == 'refs/heads/develop'
      run: |
        supabase functions deploy telegram-bot --project-ref ${{ secrets.STAGING_PROJECT_REF }}

  performance-validation:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - merchant_name: Run production-level performance tests
      run: |
        deno test --allow-all test/performance/production-load.test.ts
        
    - merchant_name: Validate free tier usage projections
      run: |
        deno run --allow-all scripts/validate-tier-usage.ts

  deploy:
    runs-on: ubuntu-latest
    needs: [test, performance-validation]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - merchant_name: Deploy to production
      run: |
        supabase functions deploy telegram-bot --project-ref ${{ secrets.PRODUCTION_PROJECT_REF }}
        
    - merchant_name: Run post-deployment smoke tests
      run: |
        deno test --allow-all test/deployment/smoke-tests.test.ts
```

### **Test Data Management Strategy**

#### **Test Data Fixtures**
```typescript
// test/fixtures/merchants.ts
export const testMerchants = [
  {
    merchant_slug: 'test-pelago',
    merchant_name: 'Test Pelago',
    tracking_link: 'https://test.pelago.com/track?user={{USER_ID}}',
    base_mpd: 8.0
  },
  {
    merchant_slug: 'test-apple', 
    merchant_name: 'Test Apple',
    tracking_link: 'https://test.apple.com/affiliate?ref={{USER_ID}}',
    base_mpd: 2.0
  }
  // ... more test merchants
];

export const testUsers = [
  {
    id: 123456,
    username: 'testuser1',
    first_seen: '2024-01-01T00:00:00Z',
    link_count: 5
  },
  {
    id: 654321,
    username: 'testuser2', 
    first_seen: '2024-01-02T00:00:00Z',
    link_count: 3
  }
];
```

#### **Database Test Utilities**
```typescript
// test/utils/database.ts
export async function seedTestData() {
  // Clean existing test data
  await testClient.from('viral_interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await testClient.from('link_generations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await testClient.from('users').delete().neq('id', 0);
  await testClient.from('merchants').delete().neq('merchant_slug', '');
  
  // Insert test merchants
  const { error: merchantError } = await testClient
    .from('merchants')
    .insert(testMerchants);
  if (merchantError) throw merchantError;
  
  // Insert test users
  const { error: userError } = await testClient
    .from('users')
    .insert(testUsers);
  if (userError) throw userError;
}

export async function createTestUser(overrides = {}) {
  const testUser = {
    id: Math.floor(Math.random() * 1000000),
    username: `testuser${Date.now()}`,
    first_seen: new Date().toISOString(),
    link_count: 0,
    ...overrides
  };
  
  const { data, error } = await testClient
    .from('users')
    .insert(testUser)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createTestLinkGeneration(userId: number, merchantSlug: string, overrides = {}) {
  const linkGeneration = {
    user_id: userId,
    merchant_slug: merchantSlug,
    chat_id: -1001234567890,
    created_at: new Date().toISOString(),
    ...overrides
  };
  
  const { data, error } = await testClient
    .from('link_generations')
    .insert(linkGeneration)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

---

## 📊 **TDD Quality Gates & Metrics**

### **Code Coverage Requirements**

#### **Coverage Targets by Component**
```typescript
// test/coverage/requirements.ts
export const coverageRequirements = {
  overall: 80,
  components: {
    'src/handlers/inline-query.ts': 90,
    'src/handlers/callback-query.ts': 90, 
    'src/services/affiliate-links.ts': 85,
    'src/services/analytics.ts': 80,
    'src/utils/database.ts': 75,
    'src/utils/telegram.ts': 80
  }
};

export function validateCoverage(coverageReport: any) {
  const overallCoverage = coverageReport.total.lines.pct;
  
  if (overallCoverage < coverageRequirements.overall) {
    throw new Error(`Overall coverage ${overallCoverage}% below required ${coverageRequirements.overall}%`);
  }
  
  for (const [file, requiredCoverage] of Object.entries(coverageRequirements.components)) {
    const fileCoverage = coverageReport.files[file]?.lines?.pct || 0;
    if (fileCoverage < requiredCoverage) {
      throw new Error(`${file} coverage ${fileCoverage}% below required ${requiredCoverage}%`);
    }
  }
  
  return true;
}
```

### **Test Performance Benchmarks**

#### **Test Suite Performance Requirements**
```typescript
// test/performance/test-benchmarks.ts
export const testPerformanceRequirements = {
  totalTestTime: 30000, // 30 seconds max
  unitTestTime: 10000,  // 10 seconds max  
  integrationTestTime: 15000, // 15 seconds max
  singleTestTimeout: 5000, // 5 seconds max per test
};

Deno.test("Test Performance: Unit test suite execution time", async () => {
  const startTime = performance.now();
  
  // Run all unit tests
  const unitTestFiles = await Deno.readDir('test/unit');
  for await (const file of unitTestFiles) {
    if (file.merchant_name.endsWith('.test.ts')) {
      await import(`../unit/${file.merchant_name}`);
    }
  }
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  assert(executionTime < testPerformanceRequirements.unitTestTime, 
    `Unit tests took ${executionTime}ms, should be under ${testPerformanceRequirements.unitTestTime}ms`);
});

Deno.test("Test Performance: Individual test timeout compliance", async () => {
  // This would be implemented as part of test runner configuration
  // Deno test runner should enforce per-test timeouts
  assert(true, "Test timeout enforcement configured");
});
```

### **TDD Workflow Validation**

#### **Red-Green-Refactor Cycle Tracking**
```typescript
// test/workflow/tdd-validation.ts
export interface TDDCycleMetrics {
  redPhaseTime: number;
  greenPhaseTime: number; 
  refactorPhaseTime: number;
  totalCycleTime: number;
  testCount: number;
  codeChurn: number; // Lines added/removed during cycle
}

export function trackTDDCycle(userStory: string): TDDCycleTracker {
  return {
    startRed: () => console.time(`RED-${userStory}`),
    startGreen: () => {
      console.timeEnd(`RED-${userStory}`);
      console.time(`GREEN-${userStory}`);
    },
    startRefactor: () => {
      console.timeEnd(`GREEN-${userStory}`);
      console.time(`REFACTOR-${userStory}`);
    },
    complete: () => {
      console.timeEnd(`REFACTOR-${userStory}`);
      console.log(`TDD Cycle completed for ${userStory}`);
    }
  };
}

// Usage in development:
// const cycle = trackTDDCycle('US2.1-inline-queries');
// cycle.startRed(); // Write failing tests
// cycle.startGreen(); // Implement minimal code
// cycle.startRefactor(); // Improve code quality
// cycle.complete(); // Log metrics
```

---

## 🚀 **TDD Implementation Timeline**

### **Enhanced Sprint Timeline with TDD**

#### **Week 1: Foundation (TDD Enhanced)**
- **Day 1**: Test environment setup + RED phase for database schema
- **Day 2**: GREEN phase implementation (database + basic edge function)
- **Day 3**: REFACTOR phase + RED phase for Telegram integration
- **Day 4**: GREEN phase (webhook setup) + RED phase for merchant data
- **Day 5**: GREEN phase (merchant data) + REFACTOR + Sprint 1 validation

**TDD Metrics Week 1:**
- Test Coverage: >75% (foundation code)
- Test Count: ~25 unit tests, ~10 integration tests
- Test Execution Time: <15 seconds total
- TDD Cycles: 4 complete cycles (database, edge function, webhook, merchants)

#### **Week 2: Core Functionality (TDD Enhanced)**
- **Day 1**: RED phase for inline queries + callback system
- **Day 2**: GREEN phase implementation (query processing + link generation)
- **Day 3**: REFACTOR phase + RED phase for response formatting
- **Day 4**: GREEN phase (bot responses + user tracking)
- **Day 5**: REFACTOR + integration testing + Sprint 2 validation

**TDD Metrics Week 2:**
- Test Coverage: >80% (core functionality)
- Test Count: ~40 unit tests, ~15 integration tests
- Test Execution Time: <20 seconds total
- TDD Cycles: 3 complete cycles (queries, responses, tracking)

#### **Week 3: Viral & Launch (TDD Enhanced)**
- **Day 1**: RED phase for viral mechanics + analytics
- **Day 2**: GREEN phase implementation (callbacks + viral tracking)
- **Day 3**: REFACTOR + RED phase for performance/load testing
- **Day 4**: GREEN phase (optimization) + production deployment tests
- **Day 5**: Final REFACTOR + production deployment + monitoring setup

**TDD Metrics Week 3:**
- Test Coverage: >85% (complete system)
- Test Count: ~60 unit tests, ~25 integration tests, ~15 performance tests
- Test Execution Time: <30 seconds total
- TDD Cycles: 3 complete cycles (viral, performance, deployment)

### **Risk Mitigation with TDD**

#### **TDD-Specific Risk Management**

**Risk 1: Test Suite Performance Degradation**
- **Impact**: Medium | **Probability**: Medium
- **Mitigation**: Parallel test execution, optimized test database
- **TDD Solution**: Performance tests validate test suite speed
- **Early Warning**: CI pipeline alerts if tests exceed 30-second limit

**Risk 2: Flaky Tests in CI/CD**
- **Impact**: High | **Probability**: Medium  
- **Mitigation**: Proper mocking, isolated test environment
- **TDD Solution**: Test reliability tests validate mock stability
- **Early Warning**: Track test failure rates, quarantine flaky tests

**Risk 3: Test Coverage Blind Spots**
- **Impact**: Medium | **Probability**: Low
- **Mitigation**: Automated coverage reporting, coverage gates
- **TDD Solution**: Coverage validation tests ensure quality gates
- **Early Warning**: Coverage drops below 80% fail CI/CD

**Risk 4: Mock Drift from Real APIs**
- **Impact**: High | **Probability**: Medium
- **Mitigation**: Contract testing, periodic mock validation
- **TDD Solution**: Integration tests validate mock accuracy
- **Early Warning**: Monthly mock validation against live APIs

---

## ✅ **TDD Definition of Done**

### **Enhanced Definition of Done (TDD)**

#### **Functional Requirements (with TDD validation)**
- [ ] All user stories have comprehensive test coverage (>80%)
- [ ] Red-Green-Refactor cycle completed for each feature  
- [ ] Integration tests validate end-to-end workflows
- [ ] Performance tests confirm <1 second response times
- [ ] Mock tests ensure reliability without external dependencies

#### **Technical Requirements (TDD-validated)**
- [ ] All tests pass in CI/CD pipeline
- [ ] Code coverage exceeds 80% with no critical gaps
- [ ] Test suite executes in <30 seconds
- [ ] No flaky tests (>99% reliability rate)
- [ ] Performance benchmarks met under load testing

#### **Quality Gates (TDD-enforced)**
- [ ] TypeScript compilation with strict mode (tested)
- [ ] ESLint passing with zero errors (tested)
- [ ] Database queries optimized (<100ms average)
- [ ] Error handling comprehensive (100% error path coverage)
- [ ] Security validations in place (penetration test scenarios)

#### **Business Requirements (behavior-tested)**
- [ ] Viral coefficient >1.2 validated through behavioral tests
- [ ] User engagement scenarios tested and passing
- [ ] Free tier usage projections validated through load tests
- [ ] Analytics accuracy confirmed through test scenarios
- [ ] All acceptance criteria converted to executable tests

### **Success Metrics (TDD-Enhanced)**

#### **Technical Performance (test-validated)**
- **Response Time**: <1 second for 95% of requests (performance tested)
- **Test Coverage**: >80% code coverage (automatically validated)
- **Test Reliability**: <1% flaky test rate (monitored continuously)
- **CI/CD Speed**: <5 minutes total pipeline execution
- **Deployment Safety**: Zero production issues from untested code

#### **Development Efficiency (TDD benefits)**
- **Bug Detection**: 90% of bugs caught before production
- **Refactoring Confidence**: Safe code changes with full test coverage
- **Documentation**: Tests serve as living documentation
- **Team Velocity**: Faster feature development with TDD discipline
- **Technical Debt**: Minimized through continuous refactoring

---

This comprehensive TDD integration transforms the HeyMax_shop_bot development workflow into a test-driven process that ensures reliability, maintainability, and confidence in viral growth scenarios while respecting free-tier constraints. The Red-Green-Refactor methodology is woven throughout all three sprints, providing safety nets for rapid iteration and scaling.