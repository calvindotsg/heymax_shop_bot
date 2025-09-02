# GitHub Copilot Instructions

## Project Overview

HeyMax Shop Bot is a production-ready Telegram inline bot enabling viral social commerce through Max Miles affiliate links. Built with Supabase Edge Functions (Deno/TypeScript) and serving 187+ Singapore merchants with comprehensive test coverage (51/51 tests, 95% coverage).

## Essential Architecture Knowledge

### Single-File Monolith Pattern
- **Primary file**: `supabase/functions/telegram-bot/index.ts` (1,200+ lines) contains ALL bot logic
- Follows webhook-driven request/response pattern with function-based organization
- Uses global state caching (BOT_INFO) and centralized error handling patterns

### Database Schema (PostgreSQL via Supabase)
- `users`: Telegram user tracking with viral metrics (`total_links_generated`, `total_viral_conversions`)  
- `merchants`: 187+ Singapore merchants with `affiliate_link_template` and `max_miles_rate`
- `link_generations`: UTM-tracked affiliate links with chat context
- `viral_interactions`: Tracks viral coefficient for growth analytics

### Critical Configuration
**Required in `supabase/config.toml`:**
```toml
[functions.telegram-bot]
verify_jwt = false  # ESSENTIAL - Telegram webhooks can't provide JWTs
```

## Development Workflow (TDD-First)

### Test-Driven Development (Critical)
This codebase is **strictly TDD-first**. Always follow Red-Green-Refactor:

```bash
# Start TDD session
npm run test:watch  # Continuous testing feedback
# 1. RED: Write failing test first 
# 2. GREEN: Minimal implementation in supabase/functions/telegram-bot/index.ts
# 3. REFACTOR: Improve while keeping tests green
```

### Essential Commands
```bash
# Development
npm test                              # Run all 51 tests  
npm run test:watch                   # TDD watch mode (use this!)
supabase start                       # Start local services
supabase functions serve             # Local development server

# Database
npm run db:reset                     # Reset with seed data
npm run db:migrate                   # Apply migrations

# Deployment  
./scripts/production-deploy.sh \
  --project-id ID --token TOKEN --anon-key KEY
```

## Code Patterns & Conventions

### Telegram Response Pattern
All bot responses follow this structure:
```typescript
return new Response(
  JSON.stringify({
    method: "answerInlineQuery", 
    inline_query_id: query.id,
    results: [], // InlineQueryResult array
    cache_time: 0,
  }),
  { status: 200, headers: { "Content-Type": "application/json" } }
);
```

### Database Query Pattern  
```typescript
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("column", value);
if (error) throw error; // Critical: Always check errors
```

### UTM Parameter Pattern
All affiliate links must include these UTM parameters:
- `utm_source=telegram`
- `utm_medium=heymax_shop_bot` 
- `utm_campaign=viral_social_commerce`

## Key Functions in index.ts

- `serve()` - Main webhook handler, routes by update type
- `handleInlineQuery()` - Core functionality: fuzzy search + link generation
- `handleCallbackQuery()` - Viral mechanics: "Get MY Link" button handling  
- `calculateMatchScore()` - Merchant fuzzy search algorithm
- `createUser()`, `logLinkGeneration()` - Database tracking functions

## Testing Strategy

### Test File Organization
- `tests/unit/core-bot-functionality.test.ts` - Basic bot operations
- `tests/unit/viral-mechanics.test.ts` - Viral coefficient tracking  
- `tests/unit/database-operations.test.ts` - Database CRUD operations
- `tests/utils/` - Shared test helpers and mock data

### Test Utilities
- `tests/utils/telegram-helpers.ts` - Telegram-specific test functions
- `tests/utils/mock-data.ts` - Consistent test data (MERCHANTS, USERS)
- `tests/utils/test-helpers.ts` - Performance benchmarks and validation

## Common Issues & Solutions

### HTTP 401 Errors
**Problem**: JWT verification blocks Telegram webhooks  
**Solution**: Set `verify_jwt = false` in `supabase/config.toml` line 327-328

### Bot Username Resolution  
**Problem**: `@heymax_shop_bot` displays as `@heymaxshopbot`  
**Solution**: Use `getBotInfo()` function for dynamic username resolution

### Performance Requirements
- Response time target: <2s for inline queries
- Viral coefficient target: >1.2 for sustainable growth
- Free tier constraints: <400K function invocations/month

## File Modification Guidelines

### Adding Features
1. **Write failing test** in appropriate `tests/unit/*.test.ts` file
2. **Implement in index.ts** - add to existing function or create new helper
3. **Database changes**: Add migration in `supabase/migrations/`  
4. **Verify all 51 tests pass** before committing

### Production Deployment
1. **Local validation**: `npm run pipeline` (tests + linting)
2. **Deploy with script**: Use `production-deploy.sh` with required args
3. **Monitor health**: Check analytics endpoint post-deployment

## Integration Points

- **Telegram Bot API**: Webhook-based, uses `TELEGRAM_BOT_TOKEN`
- **Supabase**: Edge Functions + PostgreSQL, requires service role key
- **HeyMax Platform**: Max Miles affiliate tracking via UTM parameters
- **Analytics**: Built-in viral coefficient tracking via database queries

When modifying this bot, prioritize maintaining the viral mechanics that drive user growth and ensure all changes preserve the TDD test coverage that validates core functionality.
