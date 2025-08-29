# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# HeyMax Shop Bot Development Guide

## Project Overview

HeyMax Shop Bot is a production-ready Telegram inline bot that enables viral
social commerce through Max Miles earning. Users can generate personalized
affiliate links directly in group chats, creating viral earning opportunities.
The bot is built with Supabase Edge Functions (Deno/TypeScript) and serves 187+
Singapore merchants.

**Key Stats**: 43/43 tests passing, 90% coverage, production-ready MVP deployed

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram      │───▶│  Supabase Edge   │───▶│   PostgreSQL    │
│   Webhook       │    │   Functions      │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Analytics &    │
                       │   Monitoring     │
                       └──────────────────┘
```

### Core Components

- **Main Bot Logic**: `supabase/functions/telegram-bot/index.ts` (1,200+ lines)
- **Database Schema**: PostgreSQL with users, merchants, link_generations,
  viral_interactions
- **Testing Framework**: Deno native testing with
  unit/integration/performance/e2e suites
- **Deployment**: Automated Bash scripts with monitoring and validation

## File Structure & Key Locations

```
heymax_shop_bot/
├── supabase/
│   ├── functions/telegram-bot/index.ts    # Main bot logic (PRIMARY FILE)
│   ├── migrations/                        # Database schema files
│   ├── config.toml                       # Supabase configuration
│   └── seed.sql                          # Merchant data seeding
├── tests/
│   ├── unit/                             # 30 unit tests
│   ├── integration/                      # 8 integration tests
│   ├── performance/                      # 5 performance tests
│   └── e2e/                             # End-to-end tests
├── scripts/
│   ├── production-deploy.sh              # Main deployment script
│   ├── extract_affiliation_fields_sg.py # Merchant data extraction
│   └── monitoring-setup.sh              # Production monitoring
├── dataset/
│   └── extracted_merchants_sg.csv       # Singapore merchant data
└── documentation/                       # Comprehensive docs
```

## Essential Commands

### Development Workflow

```bash
# Initial setup (requires Docker Desktop)
npm run setup:local          # Initialize Supabase locally
supabase start              # Start all Supabase services

# Database operations
npm run db:migrate          # Apply database migrations
npm run db:reset            # Reset database with seed data
supabase db reset           # Alternative reset command

# Testing (TDD Approach - CRITICAL for development)
npm test                    # Run all 43 tests
npm run test:watch          # TDD watch mode (recommended for development)
npm run test:coverage       # Coverage reporting
npm run test:performance    # Load testing with Artillery
npm run pipeline            # Full CI/CD pipeline

# Single test execution
npm test -- tests/unit/telegram-bot.test.ts           # Core bot tests
npm test -- tests/integration/database.test.ts        # Database integration
npm test -- tests/performance/performance-validation.test.ts # Load tests

# Local development server
supabase functions serve   # Serve Edge Functions locally
```

### Deno-Specific Commands (Alternative to npm)

```bash
# Direct Deno usage (if npm not available)
deno test --allow-env --allow-net --allow-read --allow-write tests/
deno test --allow-env --allow-net --allow-read --allow-write --watch tests/
deno run --allow-env --allow-net --allow-read --allow-write --watch supabase/functions/telegram-bot/index.ts
```

### Production Deployment

```bash
# Deploy to production (requires env vars)
./scripts/production-deploy.sh \
  --project-id YOUR_PROJECT_ID \
  --token $TELEGRAM_BOT_TOKEN \
  --anon-key $SUPABASE_ANON_KEY

# Monitor production
./scripts/monitoring-setup.sh \
  --url https://your-project.supabase.co/functions/v1/telegram-bot
```

## Architecture Deep Dive

### Core Bot Flow (supabase/functions/telegram-bot/index.ts)

The main bot logic follows a webhook-based request/response pattern:

1. **Webhook Handler** → Routes to appropriate function based on update type
2. **Inline Query** → `handleInlineQuery()` → Fuzzy merchant search → Link generation
3. **Callback Query** → `handleCallbackQuery()` → Viral link creation → Database tracking
4. **Message Handler** → `/start` and `/help` commands

### Key Functions & Their Purpose

```typescript
// Primary request router - handles all Telegram updates
serve(async (req) => { ... })

// Inline query processing - core functionality
async function handleInlineQuery(query: TelegramInlineQuery) { ... }

// Viral mechanics - creates "Get MY Link" buttons
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) { ... }

// Merchant fuzzy search - calculateMatchScore algorithm
function calculateMatchScore(query: string, merchantName: string): number { ... }

// Database operations - user tracking and analytics
async function createUser(user: TelegramUser) { ... }
async function logLinkGeneration(...) { ... }
async function logViralInteraction(...) { ... }
```

### Database Architecture

- **users**: Telegram user tracking with activity metrics  
- **merchants**: 187 Singapore merchants with Max Miles rates
- **link_generations**: Affiliate link tracking with UTM parameters
- **viral_interactions**: Viral loop tracking for coefficient analysis

### Critical Configuration

**supabase/config.toml line 327-328:**
```toml
[functions.telegram-bot]
verify_jwt = false  # REQUIRED - Telegram webhooks can't provide JWTs
```

## Development Patterns

### 1. Error Handling

```typescript
// Standard error response pattern
return new Response(
  JSON.stringify({
    method: "answerInlineQuery",
    inline_query_id: query.id,
    results: [],
    cache_time: 0,
  }),
  {
    status: 200,
    headers: { "Content-Type": "application/json" },
  },
);
```

### 2. Database Queries

```typescript
// Standard Supabase query pattern
const { data, error } = await supabaseClient
  .from("table_name")
  .select("*")
  .eq("column", value);

if (error) throw error;
```

### 3. Telegram API Integration

```typescript
// Bot info fetching pattern
const response = await fetch(
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`,
);
const data = await response.json();
```

## Testing Strategy

### Test Categories

- **Unit Tests** (30): Core bot functionality, affiliate link generation, viral
  mechanics
- **Integration Tests** (8): Database operations, Telegram API integration
- **Performance Tests** (5): Load testing with Artillery (100+ concurrent users)
- **E2E Tests** (5): Complete user journey validation

### Running Specific Test Suites

```bash
npm run test -- tests/unit/telegram-bot.test.ts           # Core bot tests
npm run test -- tests/integration/database.test.ts        # DB integration
npm run test -- tests/performance/performance-validation.test.ts # Load tests
```

## Configuration Management

### Environment Variables (Required for Production)

- `TELEGRAM_BOT_TOKEN`: From @BotFather
- `SUPABASE_URL`: Production Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key for client operations
- `SUPABASE_SERVICE_ROLE_KEY`: Service key for admin operations

### Supabase Configuration (`supabase/config.toml`)

```toml
[functions.telegram-bot]
verify_jwt = false  # Required for Telegram webhook access
```

## Common Issues & Solutions

### 1. HTTP 401 Errors

- **Cause**: JWT verification enabled for Edge Functions
- **Solution**: Set `verify_jwt = false` in config.toml
- **Location**: `supabase/config.toml` line 327-328

### 2. Bot Username Display Issues

- **Problem**: `@heymax_shop_bot` displays as `@heymaxshopbot` in Telegram
- **Solution**: Use Telegram deep links format: `https://t.me/botusername`
- **Implementation**: `getBotInfo()` function for dynamic resolution

### 3. Deployment Script Failures

- **Common Issue**: Missing required CLI arguments
- **Required Args**: `--project-id`, `--token`, `--anon-key`
- **Script**: `./scripts/production-deploy.sh`

## Database Schema Key Tables

### users

- `telegram_user_id` (primary key)
- `username`, `display_name`
- `total_links_generated`, `total_viral_conversions`
- `created_at`, `last_active`

### merchants

- `merchant_name` (primary key)
- `affiliate_link_template`
- `max_miles_rate`, `category`
- `is_active`

### link_generations

- `id` (primary key)
- `user_id`, `merchant_name`
- `generated_link`, `utm_source`
- `created_at`

### viral_interactions

- `id` (primary key)
- `original_user_id`, `viral_user_id`
- `merchant_name`, `interaction_type`
- `created_at`

## Performance Considerations

### Free Tier Limits

- **Edge Function Invocations**: <400K/month
- **Database Operations**: Reasonable limits for MVP scale
- **Monitoring**: Built-in analytics tracking

### Optimization Strategies

- Efficient database queries with proper indexing
- Minimal external API calls (cached bot info)
- Streamlined response payloads
- Performance testing validates <2s response times

## Security & Compliance

### Input Validation

- All user inputs sanitized and validated
- Telegram-specific security patterns implemented
- SQL injection prevention through Supabase client

### Rate Limiting

- Telegram API rate limit compliance
- Built-in Supabase database connection limits
- Graceful error handling for limits

## Monitoring & Analytics

### Health Check Endpoint

- **URL**: `https://project.supabase.co/functions/v1/telegram-bot/analytics`
- **Purpose**: Production monitoring and viral coefficient tracking
- **Access**: GET requests with proper Authorization headers

### Key Metrics

- **Viral Coefficient**: Target >1.2 for sustainable growth
- **User Engagement**: Click-through rates on affiliate links
- **Performance**: Response times, error rates, function invocations
- **Cost Management**: Free-tier usage monitoring

## Development Workflow Patterns

### TDD Methodology (CRITICAL - This codebase is TDD-first)

**Red-Green-Refactor Cycle:**
1. **RED**: Write failing test first (`npm run test:watch` for continuous feedback)
2. **GREEN**: Implement minimal code to pass test 
3. **REFACTOR**: Improve code quality while keeping tests green

**Test File Organization:**
- `tests/unit/telegram-bot*.test.ts` - Core bot functionality tests
- `tests/integration/database.test.ts` - Database operation tests  
- `tests/performance/performance-validation.test.ts` - Load testing

### Local Development Pattern

```bash
# Start TDD development session
npm run test:watch                    # Terminal 1: Continuous testing
supabase start                       # Terminal 2: Start services  
supabase functions serve             # Terminal 3: Function dev server
# Edit supabase/functions/telegram-bot/index.ts in Terminal 4
```

### Code Modification Strategy

**When adding features:**
1. **Test First**: Add failing test in appropriate test file
2. **Minimal Implementation**: Add code in `supabase/functions/telegram-bot/index.ts`
3. **Validate**: Ensure all 43 tests still pass
4. **Database Changes**: Add migration in `supabase/migrations/` if needed

**When debugging:**
1. **Isolate**: Use single test execution (`npm test -- tests/unit/telegram-bot.test.ts`)
2. **Trace**: Check Supabase logs (`supabase functions logs`)
3. **Test Locally**: Use `supabase functions serve` with test webhook calls

### Deployment Safety Protocol

- **Always test locally first** (`npm run pipeline`)
- **Use deployment script validation** (`./scripts/production-deploy.sh`)
- **Monitor health after deployment** (analytics endpoint)
- **Maintain rollback capability** (git commit before deployment)

## Quick Start for New Developers

1. **Environment Setup**:
   ```bash
   git clone [repository]
   cd heymax_shop_bot
   npm run setup:local
   ```

2. **Development Workflow**:
   ```bash
   npm run test:watch  # Start TDD workflow
   # Make changes to supabase/functions/telegram-bot/index.ts
   # Tests auto-run and guide development
   ```

3. **Local Testing**:
   ```bash
   supabase functions serve  # Serve locally
   # Test with ngrok tunnel for Telegram webhook
   ```

4. **Production Deploy**:
   ```bash
   ./scripts/production-deploy.sh --project-id ID --token TOKEN --anon-key KEY
   ```

## Support & Resources

- **Documentation**: `/documentation/` directory for detailed guides
- **Community**: [HeyMax Telegram Community](https://t.me/+gNZRwXXy9Gc1MzJl)
- **Issues**: GitHub Issues for bug reports and feature requests
- **Business**: hello@heymax.ai for commercial support

---

**This CLAUDE.md file provides comprehensive guidance for Claude Code instances
working on the HeyMax Shop Bot codebase. Follow TDD principles, maintain test
coverage, and ensure all changes preserve the viral social commerce mechanics
that drive user growth.**
