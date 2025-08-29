# HeyMax Shop Bot - TDD Development Setup

## Quick Start (5 minutes)

### Prerequisites

1. **Docker Desktop** - Required for Supabase local development
   ```bash
   # Install Docker Desktop from: https://docs.docker.com/desktop/
   # Ensure Docker is running before proceeding
   ```

2. **Environment Already Setup** ✅
   - Deno 2.4.5 ✅
   - Supabase CLI 2.39.2 ✅
   - Node.js 24.6.0 ✅

### TDD Development Workflow

#### 1. Start Local Development Environment

```bash
# Start Supabase local instance (requires Docker)
supabase start

# This will:
# - Start PostgreSQL database on localhost:54321
# - Start Supabase API server
# - Apply migrations from supabase/migrations/
# - Load seed data from supabase/seed.sql
```

#### 2. Run TDD Tests

```bash
# Run all tests (should pass after Supabase is running)
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode for TDD development
npm run tdd:start
```

#### 3. TDD Cycle Commands

```bash
# RED: Run failing tests
export PATH="$HOME/.deno/bin:$PATH" && deno test --allow-env --allow-net --allow-read --allow-write tests/unit/database.test.ts

# GREEN: Apply database migrations
supabase db reset  # Resets DB and applies all migrations + seed data

# REFACTOR: Run tests again to verify improvements
npm run test:coverage
```

## Project Structure

```
heymax_shop_bot/
├── tests/
│   ├── unit/           # Unit tests (TDD cycle tests)
│   ├── integration/    # API integration tests
│   ├── performance/    # Load testing
│   └── e2e/           # End-to-end testing
├── supabase/
│   ├── functions/     # Edge Functions (TypeScript/Deno)
│   ├── migrations/    # Database schema changes
│   └── seed.sql      # Test data for TDD
├── dataset/          # 187 Singapore merchants dataset
└── src/             # Source code structure
```

## TDD Status

### ✅ Completed

- Development environment setup (Deno, Supabase CLI, Node.js)
- Project structure following TDD patterns
- Database schema with test-first approach
- Initial failing tests (RED phase confirmed)
- Database migrations and seed data ready

### 🚧 Next Steps (Requires Docker Desktop)

1. Install Docker Desktop and start Docker daemon
2. Run `supabase start` to launch local development environment
3. Verify tests pass (GREEN phase)
4. Begin Supabase Edge Functions TDD implementation
5. Implement Telegram webhook with TDD cycles

## Performance Targets (Validated by Tests)

- Database queries: <1 second response time
- Test suite: <30 seconds total execution
- Unit tests: <10 seconds execution
- Coverage: >80% overall, >90% critical components

## Development Commands

```bash
# Development workflow
npm run tdd:start        # Start TDD watch mode
npm run test            # Run all tests
npm run test:coverage   # Run tests with coverage report
npm run pipeline        # Run full CI/CD pipeline locally

# Database operations  
supabase db reset       # Reset database with fresh migrations + seed
supabase db migrate     # Apply pending migrations
supabase start          # Start local Supabase instance
supabase stop           # Stop local Supabase instance
```

Ready to continue TDD implementation once Docker Desktop is installed! 🚀
