# TDD Quick Start Guide - HeyMax_shop_bot

## 🚀 **Getting Started with TDD**

### **1. Environment Setup (5 minutes)**

```bash
# Clone and setup project
cd heymax_shop_bot
npm init -y
npm install --save-dev @supabase/supabase-js

# Setup Deno testing environment
curl -fsSL https://deno.land/x/install/install.sh | sh
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc

# Setup Supabase local development
npx supabase login
npx supabase init
npx supabase start
```

### **2. Run First TDD Cycle (10 minutes)**

```bash
# Create test file
mkdir -p tests/unit
touch tests/unit/database.test.ts

# Write failing test (RED)
deno test tests/unit/database.test.ts --allow-env --allow-net

# Implement minimum code (GREEN)  
deno test tests/unit/database.test.ts --allow-env --allow-net

# Refactor and verify (REFACTOR)
deno test tests/unit/database.test.ts --allow-env --allow-net --coverage
```

### **3. TDD Workflow Commands**

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run performance tests
npm run test:performance

# Run CI pipeline locally
npm run pipeline
```

## 📋 **TDD User Story Template**

### **Example: US1.1 - Database Schema Setup**

#### **1. RED Phase: Write Failing Tests**

```typescript
// tests/unit/database.test.ts
Deno.test("users table should exist", async () => {
  const result = await supabase
    .from("users")
    .select("count", { count: "exact" });

  assertEquals(result.error, null);
});

// Run: deno test --allow-env --allow-net
// Expected: ❌ Test fails (table doesn't exist)
```

#### **2. GREEN Phase: Make Tests Pass**

```sql
-- supabase/migrations/001_create_users.sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_seen TIMESTAMP DEFAULT NOW(),
  link_count INTEGER DEFAULT 0
);

-- Run: supabase db reset
-- Run: deno test --allow-env --allow-net  
-- Expected: ✅ Test passes
```

#### **3. REFACTOR Phase: Improve Code**

```sql
-- Add indexes and constraints
CREATE INDEX idx_users_username ON users(username);
ALTER TABLE users ADD CONSTRAINT check_link_count_positive CHECK (link_count >= 0);

-- Run: deno test --allow-env --allow-net --coverage
-- Expected: ✅ Tests pass with improved performance
```

## 🎯 **Sprint-by-Sprint TDD Guide**

### **Sprint 1: Foundation (Week 1)**

- **Day 1**: TDD framework setup + database tests
- **Day 2**: Edge function structure with TDD
- **Day 3**: Telegram webhook testing
- **Day 4**: Merchant dataset with TDD
- **Day 5**: Integration testing + refactoring

### **Sprint 2: Core Features (Week 2)**

- **Day 1**: Inline query TDD implementation
- **Day 2**: Affiliate link generation with tests
- **Day 3**: User tracking TDD
- **Day 4**: Bot response formatting tests
- **Day 5**: Integration testing + performance validation

### **Sprint 3: Viral & Launch (Week 3)**

- **Day 1**: Viral button TDD implementation
- **Day 2**: Analytics testing framework
- **Day 3**: Load testing + performance validation
- **Day 4**: Production deployment pipeline
- **Day 5**: Launch preparation + monitoring tests

## ✅ **TDD Quality Gates**

### **Code Coverage Requirements**

- **Unit Tests**: >90% coverage for critical components
- **Integration Tests**: >80% coverage for API endpoints
- **E2E Tests**: >70% coverage for user workflows
- **Performance Tests**: 100% coverage for viral scenarios

### **Test Performance Standards**

- **Unit Test Suite**: <10 seconds execution time
- **Integration Suite**: <20 seconds execution time
- **Full Test Suite**: <30 seconds total runtime
- **Performance Tests**: <60 seconds for load testing

### **Quality Metrics**

- **Flaky Test Rate**: <1% (tests must be reliable)
- **Test Coverage**: >80% overall, >90% critical paths
- **Code Quality**: ESLint + TypeScript strict mode passing
- **Performance**: <1 second response time validated by tests

## 🔄 **TDD Daily Workflow**

### **Morning Routine (Start of development)**

```bash
1. Pull latest changes: git pull origin main
2. Run full test suite: npm run test
3. Check coverage report: npm run test:coverage
4. Review failed tests: Fix any broken tests first
5. Plan TDD cycles: Identify next Red-Green-Refactor cycle
```

### **Development Cycle (During development)**

```bash
1. Write failing test (RED): deno test [specific-test] 
2. Write minimum code (GREEN): Make test pass
3. Improve code (REFACTOR): Optimize while keeping tests green
4. Commit cycle: git commit -m "feat: [feature] with TDD cycle"
5. Push changes: git push origin feature/[branch]
```

### **End of Day (Before finishing)**

```bash
1. Run full test suite: npm run test
2. Check performance: npm run test:performance  
3. Review coverage: npm run test:coverage
4. Clean up tests: Remove any debug code
5. Push final changes: git push origin feature/[branch]
```

## 🚨 **Common TDD Anti-Patterns to Avoid**

### **❌ Don't Do This**

- Writing implementation code before tests
- Writing tests that always pass (false positives)
- Ignoring the refactor phase
- Large test files with poor organization
- Slow tests that break the TDD flow
- Mocking everything (integration tests need real dependencies)

### **✅ Do This Instead**

- Always write tests first (RED phase)
- Write tests that can fail meaningfully
- Refactor regularly to improve code quality
- Keep tests focused and well-organized
- Optimize test performance for fast feedback
- Balance unit tests with integration tests

## 📊 **TDD Success Metrics Dashboard**

### **Daily Metrics to Track**

- **Test Coverage**: Monitor overall and component-level coverage
- **Test Performance**: Track test suite execution time
- **Build Success Rate**: Monitor CI/CD pipeline success rate
- **Bug Detection**: Track bugs caught by tests vs. production
- **Development Velocity**: Measure feature completion with TDD

### **Weekly Review Questions**

1. Are tests providing confidence for refactoring?
2. Is test coverage sufficient for viral growth scenarios?
3. Are tests catching bugs before production?
4. Is the TDD cycle helping or hindering development velocity?
5. Are performance tests validating free-tier constraints?

## 🎯 **Ready to Start?**

```bash
# Quick setup command
curl -fsSL https://raw.githubusercontent.com/calvindotsg/heymax_shop_bot/setup-tdd.sh | bash

# Or manual setup
git clone calvindotsg/heymax_shop_bot
cd heymax_shop_bot  
npm install
npm run test
npm run setup:local

# Start first TDD cycle
npm run tdd:start
```

**Next Steps**: Follow Sprint 1 TDD workflow in `MVP_Implementation_Workflow.md`
with test-first approach for database schema setup.

---

_This guide provides everything needed to start TDD development for the
HeyMax_shop_bot MVP. Each sprint builds on the previous with increasing
complexity and confidence._
