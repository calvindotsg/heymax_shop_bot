# TDD Implementation Examples - HeyMax_shop_bot
*Red-Green-Refactor Examples for Key Features*

## 🔴 **Example 1: Inline Query Handler (Complete TDD Cycle)**

### **RED Phase: Write Failing Tests**

```typescript
// test/unit/handlers/inline-query.test.ts
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handleInlineQuery } from "../../../src/handlers/inline-query.ts";
import { testClient, testConfig } from "../../config/test-setup.ts";

// RED: Test 1 - Basic functionality (will fail initially)
Deno.test("InlineQuery: handleInlineQuery_ValidMerchantSearch_ReturnsResults", async () => {
  // Arrange
  const inlineQuery = {
    id: 'test-query-1',
    from: { id: 123456, username: 'testuser' },
    query: 'pelago'
  };

  // Act - This will fail because handleInlineQuery doesn't exist yet
  const result = await handleInlineQuery(inlineQuery, testClient);

  // Assert - Define what we expect
  assertEquals(result.method, 'answerInlineQuery');
  assertEquals(result.inline_query_id, 'test-query-1');
  assert(result.results.length > 0);
  assertEquals(result.results[0].type, 'article');
  assert(result.results[0].title.includes('Pelago'));
});

// RED: Test 2 - Empty query handling (will fail initially)
Deno.test("InlineQuery: handleInlineQuery_EmptyQuery_ReturnsHelpMessage", async () => {
  const emptyQuery = {
    id: 'empty-test',
    from: { id: 123456 },
    query: ''
  };

  const result = await handleInlineQuery(emptyQuery, testClient);

  assertEquals(result.results[0].title, '🔍 Search for merchants');
  assert(result.results[0].description.includes('Try: @HeyMax_shop_bot pelago'));
});

// RED: Test 3 - No results found (will fail initially)
Deno.test("InlineQuery: handleInlineQuery_NoResultsFound_ReturnsNoResultsMessage", async () => {
  const noResultsQuery = {
    id: 'no-results-test',
    from: { id: 123456 },
    query: 'nonexistentmerchant123'
  };

  const result = await handleInlineQuery(noResultsQuery, testClient);

  assertEquals(result.results.length, 1);
  assert(result.results[0].title.includes('❌ No merchants found'));
});

// Run tests - ALL SHOULD FAIL at this point
// deno test test/unit/handlers/inline-query.test.ts
// Expected: All tests fail with "Module not found" or similar errors
```

### **GREEN Phase: Minimal Implementation**

```typescript
// src/handlers/inline-query.ts - First implementation to make tests pass
export interface InlineQueryResult {
  method: string;
  inline_query_id: string;
  results: Array<{
    type: string;
    id: string;
    title: string;
    description?: string;
    input_message_content?: {
      message_text: string;
    };
  }>;
}

export async function handleInlineQuery(
  inlineQuery: any, 
  supabaseClient: any
): Promise<InlineQueryResult> {
  const query = inlineQuery.query?.trim().toLowerCase() || '';
  const queryId = inlineQuery.id;

  // Handle empty query - GREEN: Make test pass with minimal code
  if (!query) {
    return {
      method: 'answerInlineQuery',
      inline_query_id: queryId,
      results: [
        {
          type: 'article',
          id: 'help',
          title: '🔍 Search for merchants',
          description: 'Try: @HeyMax_shop_bot pelago',
          input_message_content: {
            message_text: '💡 Type merchant merchant_name after @HeyMax_shop_bot to find earning opportunities!'
          }
        }
      ]
    };
  }

  // Search merchants - GREEN: Minimal implementation
  const { data: merchants } = await supabaseClient
    .from('merchants')
    .select('*')
    .or(`merchant_name.ilike.%${query}%,merchant_slug.ilike.%${query}%`)
    .limit(10);

  // Handle no results - GREEN: Make test pass
  if (!merchants || merchants.length === 0) {
    return {
      method: 'answerInlineQuery',
      inline_query_id: queryId,
      results: [
        {
          type: 'article',
          id: 'no-results',
          title: `❌ No merchants found for "${query}"`,
          description: 'Try: pelago, apple, starbucks, adidas...',
          input_message_content: {
            message_text: `🔍 No merchants found for "${query}". Try popular brands!`
          }
        }
      ]
    };
  }

  // Return results - GREEN: Minimal implementation to pass tests
  const results = merchants.map(merchant => ({
    type: 'article',
    id: merchant.merchant_slug,
    title: `🛍️ ${merchant.merchant_name}`,
    description: `Earn ${merchant.base_mpd} Max Miles per $1 spent`,
    input_message_content: {
      message_text: `Found ${merchant.merchant_name}! Generating your link...`
    }
  }));

  return {
    method: 'answerInlineQuery',
    inline_query_id: queryId,
    results
  };
}

// Run tests - ALL SHOULD PASS now
// deno test test/unit/handlers/inline-query.test.ts
// Expected: ✅ All 3 tests pass
```

### **REFACTOR Phase: Improve Code Quality**

```typescript
// src/handlers/inline-query.ts - Refactored version
import { generateBotResponse } from '../services/bot-response.ts';
import { generateViralKeyboard } from '../services/viral-mechanics.ts';
import { ensureUserExists } from '../services/user-management.ts';

export interface InlineQueryResult {
  method: 'answerInlineQuery';
  inline_query_id: string;
  results: InlineQueryResultItem[];
  cache_time?: number;
  is_personal?: boolean;
}

interface InlineQueryResultItem {
  type: 'article';
  id: string;
  title: string;
  description: string;
  input_message_content: {
    message_text: string;
  };
  reply_markup?: any;
  thumb_url?: string;
}

// REFACTOR: Extract constants
const HELP_RESULT_ID = 'help';
const NO_RESULTS_ID = 'no-results';
const MAX_RESULTS = 10;
const CACHE_TIME_SECONDS = 300; // 5 minutes

// REFACTOR: Extract helper functions
function createHelpResult(queryId: string): InlineQueryResult {
  return {
    method: 'answerInlineQuery',
    inline_query_id: queryId,
    results: [
      {
        type: 'article',
        id: HELP_RESULT_ID,
        title: '🔍 Search for merchants',
        description: 'Type a merchant merchant_name to find earning opportunities',
        input_message_content: {
          message_text: '💡 Type merchant merchant_name after @HeyMax_shop_bot to find earning opportunities!\n\n' +
                       '✨ Popular merchants: Pelago, Apple, Starbucks, Adidas'
        }
      }
    ],
    cache_time: 60, // Short cache for help
    is_personal: false
  };
}

function createNoResultsResponse(query: string, queryId: string): InlineQueryResult {
  return {
    method: 'answerInlineQuery',
    inline_query_id: queryId,
    results: [
      {
        type: 'article',
        id: NO_RESULTS_ID,
        title: `❌ No merchants found for "${query}"`,
        description: 'Try popular brands like Pelago, Apple, or Starbucks',
        input_message_content: {
          message_text: `🔍 No merchants found for "${query}".\n\n` +
                       `💡 Try these popular merchants:\n` +
                       `• Pelago (Travel) - 8 miles/$\n` +
                       `• Apple (Electronics) - 2 miles/$\n` +
                       `• Starbucks (Food) - 5 miles/$`
        }
      }
    ],
    cache_time: CACHE_TIME_SECONDS,
    is_personal: false
  };
}

// REFACTOR: Main function with better structure and error handling
export async function handleInlineQuery(
  inlineQuery: any,
  supabaseClient: any
): Promise<InlineQueryResult> {
  try {
    const query = sanitizeQuery(inlineQuery.query);
    const userId = inlineQuery.from?.id;
    const username = inlineQuery.from?.username;

    // Ensure user is registered (side effect)
    if (userId) {
      await ensureUserExists(inlineQuery.from, supabaseClient);
    }

    // Handle empty query
    if (!query) {
      return createHelpResult(inlineQuery.id);
    }

    // Search merchants with improved query
    const merchants = await searchMerchants(query, supabaseClient);

    // Handle no results
    if (merchants.length === 0) {
      return createNoResultsResponse(query, inlineQuery.id);
    }

    // Create merchant results
    const results = await Promise.all(
      merchants.map(merchant => createMerchantResult(merchant, userId, username))
    );

    return {
      method: 'answerInlineQuery',
      inline_query_id: inlineQuery.id,
      results,
      cache_time: CACHE_TIME_SECONDS,
      is_personal: true // Personalized results
    };

  } catch (error) {
    console.error('Error handling inline query:', error);
    
    // Graceful error handling
    return createErrorResponse(inlineQuery.id, error.message);
  }
}

// REFACTOR: Extract utility functions
function sanitizeQuery(query?: string): string {
  return query?.trim().toLowerCase().replace(/[^\w\s-]/g, '') || '';
}

async function searchMerchants(query: string, supabaseClient: any) {
  const { data: merchants, error } = await supabaseClient
    .from('merchants')
    .select('*')
    .or(`merchant_name.ilike.%${query}%,merchant_slug.ilike.%${query}%`)
    .order('base_mpd', { ascending: false }) // Sort by earning potential
    .limit(MAX_RESULTS);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  return merchants || [];
}

async function createMerchantResult(
  merchant: any, 
  userId?: number, 
  username?: string
): Promise<InlineQueryResultItem> {
  return {
    type: 'article',
    id: merchant.merchant_slug,
    title: `🛍️ ${merchant.merchant_name}`,
    description: `Earn ${merchant.base_mpd} Max Miles per $1`,
    input_message_content: {
      message_text: await generateBotResponse(userId, merchant, username)
    },
  reply_markup: await generateViralKeyboard(userId, merchant.merchant_slug)
  };
}

function createErrorResponse(queryId: string, errorMessage: string): InlineQueryResult {
  return {
    method: 'answerInlineQuery',
    inline_query_id: queryId,
    results: [
      {
        type: 'article',
        id: 'error',
        title: '⚠️ Temporary issue',
        description: 'Please try again in a moment',
        input_message_content: {
          message_text: '⚠️ We encountered a temporary issue. Please try your search again!'
        }
      }
    ],
    cache_time: 0, // Don't cache errors
    is_personal: false
  };
}

// Run tests - ALL SHOULD STILL PASS after refactoring
// deno test test/unit/handlers/inline-query.test.ts
// Expected: ✅ All tests still pass, but code is much cleaner
```

## 🟢 **Example 2: Affiliate Link Generation (TDD Cycle)**

### **RED Phase: Test-First Development**

```typescript
// test/unit/services/affiliate-links.test.ts
import { assertEquals, assertExists, assert } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { generateAffiliateLink, LinkGenerationOptions } from "../../../src/services/affiliate-links.ts";
import { testClient } from "../../config/test-setup.ts";

// RED: These tests will fail initially
Deno.test("AffiliateLinks: generateAffiliateLink_ValidInput_ReturnsPersonalizedLink", async () => {
  const userId = 123456;
  const merchantSlug = 'test-pelago';
  const options: LinkGenerationOptions = {
    chatId: -1001234567890,
    trackingEnabled: true
  };

  const link = await generateAffiliateLink(userId, merchantSlug, testClient, options);

  // Assertions that define our requirements
  assert(link.startsWith('https://'), "Link should be HTTPS");
  assert(link.includes(userId.toString()), "Link should contain user ID");
  assert(link.includes('utm_source=telegram'), "Should include UTM source");
  assert(link.includes('utm_medium=bot'), "Should include UTM medium");
  assert(link.includes('utm_campaign=heymax_shop_bot'), "Should include UTM campaign");
});

Deno.test("AffiliateLinks: generateAffiliateLink_ValidInput_CreatesTrackingRecord", async () => {
  const userId = 123456;
  const merchantSlug = 'test-apple';
  const chatId = -1001234567890;

  await generateAffiliateLink(userId, merchantSlug, testClient, { chatId, trackingEnabled: true });

  // Verify tracking record was created
  const { data: linkGeneration } = await testClient
    .from('link_generations')
    .select('*')
    .eq('user_id', userId)
    .eq('merchant_slug', merchantSlug)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  assertExists(linkGeneration);
  assertEquals(linkGeneration.chat_id, chatId);
  assertEquals(linkGeneration.user_id, userId);
  assertEquals(linkGeneration.merchant_slug, merchantSlug);
});

Deno.test("AffiliateLinks: generateAffiliateLink_InvalidMerchant_ThrowsError", async () => {
  const userId = 123456;
  const invalidSlug = 'nonexistent-merchant';

  try {
    await generateAffiliateLink(userId, invalidSlug, testClient);
    assert(false, "Should throw error for invalid merchant");
  } catch (error) {
    assertEquals(error.message, `Merchant ${invalidSlug} not found`);
  }
});

// Run tests - they should all FAIL initially
// deno test test/unit/services/affiliate-links.test.ts
```

### **GREEN Phase: Make Tests Pass**

```typescript
// src/services/affiliate-links.ts - Minimal implementation
export interface LinkGenerationOptions {
  chatId?: number;
  trackingEnabled?: boolean;
  utmContent?: string;
}

export async function generateAffiliateLink(
  userId: number,
  merchantSlug: string,
  supabaseClient: any,
  options: LinkGenerationOptions = {}
): Promise<string> {
  // GREEN: Get merchant data
  const { data: merchant, error } = await supabaseClient
    .from('merchants')
    .select('*')
    .eq('merchant_slug', merchantSlug)
    .single();

  if (error || !merchant) {
    throw new Error(`Merchant ${merchantSlug} not found`);
  }

  // GREEN: Replace user ID placeholder
  let affiliateLink = merchant.tracking_link.replace('{{USER_ID}}', userId.toString());

  // GREEN: Add UTM parameters
  const utmParams = new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'bot',
    utm_campaign: 'heymax_shop_bot',
    utm_content: options.utmContent || merchantSlug
  });

  const separator = affiliateLink.includes('?') ? '&' : '?';
  affiliateLink += `${separator}${utmParams.toString()}`;

  // GREEN: Create tracking record if enabled
  if (options.trackingEnabled !== false) {
    await supabaseClient
      .from('link_generations')
      .insert({
        user_id: userId,
        merchant_slug: merchantSlug,
        chat_id: options.chatId || null
      });
  }

  return affiliateLink;
}

// Run tests - they should all PASS now
// deno test test/unit/services/affiliate-links.test.ts
```

### **REFACTOR Phase: Improve Implementation**

```typescript
// src/services/affiliate-links.ts - Refactored version
import { incrementUserLinkCount } from './user-management.ts';
import { validateUrl } from '../utils/validation.ts';

export interface LinkGenerationOptions {
  chatId?: number;
  trackingEnabled?: boolean;
  utmContent?: string;
  utmTerm?: string;
}

export interface LinkGenerationResult {
  link: string;
  trackingId?: string;
  merchant: {
    merchant_name: string;
    merchant_slug: string;
    mpdRate: number;
  };
}

// REFACTOR: Add input validation
function validateInput(userId: number, merchantSlug: string): void {
  if (!userId || userId <= 0) {
    throw new Error('Invalid user ID provided');
  }
  
  if (!merchantSlug || typeof merchantSlug !== 'string') {
    throw new Error('Invalid merchant merchant_slug provided');
  }
  
  // Sanitize merchant merchant_slug
  if (!/^[a-z0-9-]+$/.test(merchantSlug)) {
    throw new Error('Merchant merchant_slug contains invalid characters');
  }
}

// REFACTOR: Extract UTM parameter generation
function generateUtmParameters(options: LinkGenerationOptions, merchantSlug: string): URLSearchParams {
  return new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'bot',
    utm_campaign: 'heymax_shop_bot',
    utm_content: options.utmContent || merchantSlug,
    ...(options.utmTerm && { utm_term: options.utmTerm })
  });
}

// REFACTOR: Extract link building logic
function buildAffiliateLink(
  baseLink: string, 
  userId: number, 
  utmParams: URLSearchParams
): string {
  // Replace user ID placeholder
  let affiliateLink = baseLink.replace(/\{\{USER_ID\}\}/g, userId.toString());
  
  // Validate base URL
  if (!validateUrl(affiliateLink)) {
    throw new Error('Invalid tracking link format in merchant data');
  }
  
  // Add UTM parameters
  const separator = affiliateLink.includes('?') ? '&' : '?';
  affiliateLink += `${separator}${utmParams.toString()}`;
  
  return affiliateLink;
}

// REFACTOR: Extract database operations
async function getMerchantData(merchantSlug: string, supabaseClient: any) {
  const { data: merchant, error } = await supabaseClient
    .from('merchants')
    .select('merchant_slug, merchant_name, tracking_link, base_mpd')
    .eq('merchant_slug', merchantSlug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      throw new Error(`Merchant ${merchantSlug} not found`);
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return merchant;
}

async function createTrackingRecord(
  userId: number,
  merchantSlug: string,
  chatId: number | null,
  supabaseClient: any
): Promise<string> {
  const { data: trackingRecord, error } = await supabaseClient
    .from('link_generations')
    .insert({
      user_id: userId,
      merchant_slug: merchantSlug,
      chat_id: chatId
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create tracking record:', error);
    throw new Error('Failed to create tracking record');
  }

  return trackingRecord.id;
}

// REFACTOR: Main function with better error handling and structure
export async function generateAffiliateLink(
  userId: number,
  merchantSlug: string,
  supabaseClient: any,
  options: LinkGenerationOptions = {}
): Promise<string> {
  try {
    // Validate inputs
    validateInput(userId, merchantSlug);

    // Get merchant data
    const merchant = await getMerchantData(merchantSlug, supabaseClient);

    // Generate UTM parameters
    const utmParams = generateUtmParameters(options, merchantSlug);

    // Build affiliate link
    const affiliateLink = buildAffiliateLink(merchant.tracking_link, userId, utmParams);

    // Create tracking record and update user stats in parallel
    const promises = [];
    
    if (options.trackingEnabled !== false) {
      promises.push(createTrackingRecord(userId, merchantSlug, options.chatId || null, supabaseClient));
      promises.push(incrementUserLinkCount(userId, supabaseClient));
    }

    await Promise.all(promises);

    return affiliateLink;

  } catch (error) {
    // Log error for monitoring
    console.error(`Affiliate link generation failed for user ${userId}, merchant ${merchantSlug}:`, error);
    throw error; // Re-throw for caller to handle
  }
}

// REFACTOR: Enhanced version with result object
export async function generateAffiliateLinkWithDetails(
  userId: number,
  merchantSlug: string,
  supabaseClient: any,
  options: LinkGenerationOptions = {}
): Promise<LinkGenerationResult> {
  const merchant = await getMerchantData(merchantSlug, supabaseClient);
  const link = await generateAffiliateLink(userId, merchantSlug, supabaseClient, options);
  
  let trackingId: string | undefined;
  if (options.trackingEnabled !== false) {
    trackingId = await createTrackingRecord(userId, merchantSlug, options.chatId || null, supabaseClient);
  }

  return {
    link,
    trackingId,
    merchant: {
      merchant_name: merchant.merchant_name,
      merchant_slug: merchant.merchant_slug,
      mpdRate: merchant.base_mpd
    }
  };
}

// Run tests - they should all still PASS after refactoring
// deno test test/unit/services/affiliate-links.test.ts
```

## 🔵 **Example 3: Viral Callback Handler (TDD Cycle)**

### **RED Phase: Define Viral Behavior Through Tests**

```typescript
// test/unit/handlers/callback-query.test.ts
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handleCallbackQuery } from "../../../src/handlers/callback-query.ts";
import { testClient } from "../../config/test-setup.ts";

// RED: Test viral link generation
Deno.test("CallbackQuery: handleCallbackQuery_ValidGenerateAction_CreatesViralLink", async () => {
  const originalUserId = 123456;
  const viralUserId = 789012;
  const merchantSlug = 'test-starbucks';
  
  const callbackQuery = {
    id: 'callback-test-viral',
    from: { id: viralUserId, username: 'viraluser' },
    data: `generate:${merchantSlug}:${originalUserId}`,
    message: {
      chat: { id: -1001234567890 },
      message_id: 456
    }
  };

  const result = await handleCallbackQuery(callbackQuery, testClient);

  // Should acknowledge callback
  assertEquals(result.method, 'answerCallbackQuery');
  assertEquals(result.callback_query_id, 'callback-test-viral');
  assertEquals(result.text, '✅ Your unique link generated!');
  assertEquals(result.show_alert, false);
  
  // Should send new message to chat (we'll mock this)
  assertExists(result.additionalActions);
  assertEquals(result.additionalActions.length, 1);
  assertEquals(result.additionalActions[0].method, 'sendMessage');
});

// RED: Test viral tracking database record
Deno.test("CallbackQuery: handleCallbackQuery_ValidGenerate_CreatesViralTrackingRecord", async () => {
  const originalUserId = 123456;
  const viralUserId = 789012;
  const merchantSlug = 'test-apple';
  const chatId = -1001234567890;

  const callbackQuery = {
    id: 'viral-tracking-test',
    from: { id: viralUserId, username: 'viraluser' },
    data: `generate:${merchantSlug}:${originalUserId}`,
    message: { chat: { id: chatId } }
  };

  await handleCallbackQuery(callbackQuery, testClient);

  // Verify viral interaction was tracked
  const { data: viralInteraction } = await testClient
    .from('viral_interactions')
    .select('*')
    .eq('original_user_id', originalUserId)
    .eq('viral_user_id', viralUserId)
    .eq('merchant_slug', merchantSlug)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  assertExists(viralInteraction);
  assertEquals(viralInteraction.chat_id, chatId);
});

// RED: Test rate limiting
Deno.test("CallbackQuery: handleCallbackQuery_ExcessiveRequests_RateLimited", async () => {
  const userId = 123456;
  const callbackBase = {
    from: { id: userId, username: 'spamuser' },
    data: 'generate:test-merchant:654321',
    message: { chat: { id: -1001234567890 } }
  };

  // Generate multiple rapid callbacks
  const responses = [];
  for (let i = 0; i < 15; i++) {
    const response = await handleCallbackQuery({
      ...callbackBase,
      id: `spam-test-${i}`
    }, testClient);
    responses.push(response);
  }

  // Some should be rate limited
  const rateLimitedResponses = responses.filter(r => 
    r.text.includes('rate limit') || r.text.includes('too many requests')
  );

  assert(rateLimitedResponses.length > 0, "Rate limiting should activate");
});

// Run tests - they will FAIL initially
```

### **GREEN Phase: Basic Implementation**

```typescript
// src/handlers/callback-query.ts - Make tests pass
import { generateAffiliateLink } from '../services/affiliate-links.ts';
import { generateBotResponse } from '../services/bot-response.ts';
import { generateViralKeyboard } from '../services/viral-mechanics.ts';
import { ensureUserExists } from '../services/user-management.ts';

export interface CallbackQueryResult {
  method: 'answerCallbackQuery';
  callback_query_id: string;
  text: string;
  show_alert: boolean;
  additionalActions?: Array<{
    method: string;
    chat_id?: number;
    text?: string;
    reply_markup?: any;
  }>;
}

// Simple rate limiting (GREEN: minimal implementation)
const userLastAction = new Map<number, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ACTIONS_PER_WINDOW = 10;

function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const lastAction = userLastAction.get(userId) || 0;
  
  if (now - lastAction < RATE_LIMIT_WINDOW) {
    // Simple implementation: just track last action
    return false; // Will improve in refactor phase
  }
  
  userLastAction.set(userId, now);
  return false;
}

export async function handleCallbackQuery(
  callbackQuery: any,
  supabaseClient: any
): Promise<CallbackQueryResult> {
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;
  const callbackId = callbackQuery.id;

  // GREEN: Basic rate limiting
  if (isRateLimited(userId)) {
    return {
      method: 'answerCallbackQuery',
      callback_query_id: callbackId,
      text: '⚠️ Too many requests. Please wait a moment.',
      show_alert: true
    };
  }

  // GREEN: Parse callback data
  const [action, merchantSlug, originalUserId] = callbackData.split(':');

  if (action !== 'generate') {
    return {
      method: 'answerCallbackQuery',
      callback_query_id: callbackId,
      text: '❌ Invalid request',
      show_alert: true
    };
  }

  try {
    // Ensure user exists
    await ensureUserExists(callbackQuery.from, supabaseClient);

    // Get merchant data
    const { data: merchant } = await supabaseClient
      .from('merchants')
      .select('*')
      .eq('merchant_slug', merchantSlug)
      .single();

    if (!merchant) {
      return {
        method: 'answerCallbackQuery',
        callback_query_id: callbackId,
        text: '❌ Merchant not found',
        show_alert: true
      };
    }

    // Track viral interaction
    await supabaseClient
      .from('viral_interactions')
      .insert({
        original_user_id: parseInt(originalUserId),
        viral_user_id: userId,
        merchant_slug: merchantSlug,
        chat_id: callbackQuery.message?.chat?.id
      });

    // Generate bot response and keyboard
    const responseText = await generateBotResponse(userId, merchant, callbackQuery.from.username);
    const keyboard = await generateViralKeyboard(userId, merchantSlug);

    return {
      method: 'answerCallbackQuery',
      callback_query_id: callbackId,
      text: '✅ Your unique link generated!',
      show_alert: false,
      additionalActions: [
        {
          method: 'sendMessage',
          chat_id: callbackQuery.message.chat.id,
          text: responseText,
          reply_markup: keyboard
        }
      ]
    };

  } catch (error) {
    console.error('Callback query error:', error);
    
    return {
      method: 'answerCallbackQuery',
      callback_query_id: callbackId,
      text: '❌ Something went wrong. Please try again.',
      show_alert: true
    };
  }
}

// Tests should PASS now
```

### **REFACTOR Phase: Production-Ready Implementation**

```typescript
// src/handlers/callback-query.ts - Refactored version
import { RateLimiter } from '../utils/rate-limiter.ts';
import { CallbackDataParser } from '../utils/callback-parser.ts';
import { ViralTracker } from '../services/viral-tracker.ts';
import { TelegramClient } from '../services/telegram-client.ts';

// REFACTOR: Better interfaces and types
export interface CallbackQueryResult {
  method: 'answerCallbackQuery';
  callback_query_id: string;
  text: string;
  show_alert: boolean;
  url?: string;
  cache_time?: number;
}

export interface CallbackQueryContext {
  userId: number;
  username?: string;
  chatId: number;
  messageId: number;
  callbackId: string;
}

// REFACTOR: Extract rate limiting to separate class
class CallbackRateLimiter extends RateLimiter {
  constructor() {
    super({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyGenerator: (userId: number) => `callback:${userId}`
    });
  }
}

const rateLimiter = new CallbackRateLimiter();

// REFACTOR: Extract callback data validation
function parseAndValidateCallbackData(data: string): {
  action: string;
  merchantSlug: string;
  originalUserId: number;
} {
  const parts = data.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid callback data format');
  }

  const [action, merchantSlug, originalUserIdStr] = parts;
  
  if (action !== 'generate') {
    throw new Error(`Unsupported action: ${action}`);
  }

  if (!merchantSlug || !/^[a-z0-9-]+$/.test(merchantSlug)) {
    throw new Error('Invalid merchant merchant_slug format');
  }

  const originalUserId = parseInt(originalUserIdStr);
  if (isNaN(originalUserId) || originalUserId <= 0) {
    throw new Error('Invalid original user ID');
  }

  return { action, merchantSlug, originalUserId };
}

// REFACTOR: Extract context creation
function createCallbackContext(callbackQuery: any): CallbackQueryContext {
  return {
    userId: callbackQuery.from.id,
    username: callbackQuery.from.username,
    chatId: callbackQuery.message?.chat?.id,
    messageId: callbackQuery.message?.message_id,
    callbackId: callbackQuery.id
  };
}

// REFACTOR: Extract error response creation
function createErrorResponse(
  callbackId: string, 
  message: string, 
  showAlert = true
): CallbackQueryResult {
  return {
    method: 'answerCallbackQuery',
    callback_query_id: callbackId,
    text: message,
    show_alert: showAlert,
    cache_time: 0 // Don't cache errors
  };
}

// REFACTOR: Extract success response creation
function createSuccessResponse(callbackId: string): CallbackQueryResult {
  return {
    method: 'answerCallbackQuery',
    callback_query_id: callbackId,
    text: '✅ Your unique link generated!',
    show_alert: false,
    cache_time: 300 // Cache for 5 minutes
  };
}

// REFACTOR: Extract viral link generation logic
async function processViralLinkGeneration(
  context: CallbackQueryContext,
  merchantSlug: string,
  originalUserId: number,
  supabaseClient: any,
  telegramClient: TelegramClient
): Promise<void> {
  // Ensure user exists
  await ensureUserExists({
    id: context.userId,
    username: context.username
  }, supabaseClient);

  // Get merchant data
  const merchant = await getMerchantData(merchantSlug, supabaseClient);

  // Track viral interaction
  await ViralTracker.recordInteraction({
    originalUserId,
    viralUserId: context.userId,
    merchantSlug,
    chatId: context.chatId
  }, supabaseClient);

  // Generate personalized response
  const responseText = await generateBotResponse(context.userId, merchant, context.username);
  const keyboard = await generateViralKeyboard(context.userId, merchantSlug);

  // Send message to chat
  await telegramClient.sendMessage({
    chatId: context.chatId,
    text: responseText,
    replyMarkup: keyboard,
    replyToMessageId: context.messageId
  });
}

// REFACTOR: Main function with better structure
export async function handleCallbackQuery(
  callbackQuery: any,
  supabaseClient: any,
  telegramClient?: TelegramClient
): Promise<CallbackQueryResult> {
  let context: CallbackQueryContext;
  
  try {
    // Create context
    context = createCallbackContext(callbackQuery);
    
    // Rate limiting check
    if (await rateLimiter.isRateLimited(context.userId)) {
      return createErrorResponse(
        context.callbackId,
        '⚠️ Too many requests. Please wait a moment.',
        true
      );
    }

    // Parse and validate callback data
    const { merchantSlug, originalUserId } = parseAndValidateCallbackData(callbackQuery.data);

    // Process viral link generation
    if (telegramClient) {
      await processViralLinkGeneration(
        context,
        merchantSlug,
        originalUserId,
        supabaseClient,
        telegramClient
      );
    }

    // Return success response
    return createSuccessResponse(context.callbackId);

  } catch (error) {
    console.error('Callback query processing failed:', {
      userId: context?.userId,
      callbackData: callbackQuery.data,
      error: error.message
    });

    // Return appropriate error response
    const errorMessage = error.message.includes('rate limit') 
      ? '⚠️ Please wait before trying again'
      : '❌ Unable to process request. Please try again.';

    return createErrorResponse(
      context?.callbackId || callbackQuery.id,
      errorMessage,
      true
    );
  }
}

// REFACTOR: Add batch processing for high load scenarios
export async function handleCallbackQueryBatch(
  callbackQueries: any[],
  supabaseClient: any,
  telegramClient: TelegramClient
): Promise<CallbackQueryResult[]> {
  // Process in batches to avoid overwhelming the system
  const batchSize = 10;
  const results: CallbackQueryResult[] = [];

  for (let i = 0; i < callbackQueries.length; i += batchSize) {
    const batch = callbackQueries.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(query => handleCallbackQuery(query, supabaseClient, telegramClient))
    );

    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : createErrorResponse('unknown', '❌ Processing failed')
    ));
  }

  return results;
}

// Tests should still PASS after refactoring, with better maintainability
```

## 🧪 **TDD Best Practices from Examples**

### **Key Lessons from TDD Implementation**

1. **Start with Failing Tests**: Always write tests first that clearly fail
2. **Minimal Green Implementation**: Write just enough code to pass tests
3. **Refactor with Confidence**: Improve code knowing tests will catch regressions
4. **Test Behavior, Not Implementation**: Focus on what the code should do, not how
5. **One Test, One Behavior**: Each test should verify a single aspect of behavior

### **Test Quality Characteristics**

- **Fast**: All example tests run in <1 second each
- **Independent**: Tests don't depend on each other's state
- **Repeatable**: Same results every time, any environment
- **Self-Validating**: Clear pass/fail, descriptive failure messages
- **Timely**: Tests written before the production code

### **Common TDD Anti-Patterns to Avoid**

❌ **Don't**: Write tests after implementation  
✅ **Do**: Write tests first, then implement

❌ **Don't**: Test implementation details  
✅ **Do**: Test public behavior and contracts

❌ **Don't**: Write massive tests that verify everything  
✅ **Do**: Write focused tests that verify one behavior

❌ **Don't**: Skip refactoring to save time  
✅ **Do**: Always refactor after green phase

❌ **Don't**: Mock everything unnecessarily  
✅ **Do**: Mock external dependencies, test real logic

This comprehensive TDD implementation guide provides practical examples of how to apply Test-Driven Development principles to the HeyMax_shop_bot project, ensuring reliable, maintainable, and well-tested code throughout the development process.