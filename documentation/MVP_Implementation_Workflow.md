# MVP Implementation Workflow - HeyMax_shop_bot
*Test-Driven Development (TDD) Agile 3-Sprint Approach for Free-Tier Supabase Architecture*

## 📋 **Project Overview**

**Objective**: Launch viral Telegram bot that transforms group chats into Max Miles earning opportunities  
**Architecture**: Serverless monolith using Supabase Edge Functions + PostgreSQL  
**Timeline**: 2-3 weeks (3 sprints)  
**Budget**: $0 infrastructure cost (free-tier validation)  

## 🎯 **Success Metrics**

### Technical KPIs
- **Response Time**: <1 second for inline queries
- **Uptime**: >99% availability
- **Error Rate**: <1% failed requests
- **Free Tier Usage**: <400K function calls/month (80% of limit)
- **Test Coverage**: >80% overall, >90% critical components
- **Test Performance**: <30 seconds total test suite runtime

### Business KPIs  
- **User Engagement**: 500+ link generations/month
- **Viral Coefficient**: 1.2+ (each user generates 1.2+ interactions)
- **Daily Active Users**: 50+ sustained usage
- **Conversion**: Measurable affiliate link clicks
- **Code Quality**: <1% flaky test rate, 100% deployment safety

---

## 🚀 **TDD Sprint Structure**

### **Sprint 1: Foundation & Infrastructure** (Week 1)
*Focus: TDD setup, database testing, webhook test framework*
- **Phase 1A**: Test Framework Setup (0.5 days)
- **Phase 1B**: Red-Green-Refactor Development (4 days)

### **Sprint 2: Core Bot Functionality** (Week 2) 
*Focus: Test-driven inline queries, affiliate links, user tracking*
- **Phase 2A**: Integration Test Planning (0.5 days)
- **Phase 2B**: TDD Feature Development (5 days)

### **Sprint 3: Viral Mechanics & Launch** (Week 3)
*Focus: TDD viral features, performance testing, deployment pipeline*
- **Phase 3A**: E2E Test Strategy (0.5 days)
- **Phase 3B**: TDD Production Features (5.5 days)

---

## 📖 **Sprint 1: Foundation & Infrastructure**

### **User Stories**

#### **US1.1: Database Schema Setup**
**As a** developer  
**I want** a PostgreSQL database schema in Supabase  
**So that** I can store users, merchants, and interactions  

**TDD Test Specifications:**
- [ ] **RED**: Test fails when tables don't exist
- [ ] **GREEN**: Schema creation makes tests pass
- [ ] **REFACTOR**: Optimize indexes and constraints
- [ ] **Coverage**: 100% schema validation tests

**Acceptance Criteria:**
- [ ] Users table with Telegram user_id as primary key
- [ ] Merchants table with HeyMax data structure
- [ ] Link_generations table for tracking
- [ ] Proper foreign key relationships and indexes

**Technical Tasks:**
```sql
-- Core tables implementation
CREATE TABLE users (
  id BIGINT PRIMARY KEY, -- Telegram user_id
  username TEXT,
  first_seen TIMESTAMP DEFAULT NOW(),
  link_count INTEGER DEFAULT 0
);

CREATE TABLE merchants (
  merchant_slug TEXT PRIMARY KEY,
  merchant_name TEXT NOT NULL,
  tracking_link TEXT NOT NULL,
  base_mpd DECIMAL(4,2),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE link_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  merchant_slug TEXT REFERENCES merchants(merchant_slug),
  chat_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_link_generations_user_id ON link_generations(user_id);
CREATE INDEX idx_link_generations_created_at ON link_generations(created_at);
```

**Effort**: 1 day  
**Dependencies**: None  
**Definition of Done**: Schema deployed, test data inserted, queries verified

#### **US1.2: Supabase Edge Function Structure**
**As a** developer  
**I want** a basic edge function framework  
**So that** I can handle Telegram webhooks  

**Acceptance Criteria:**
- [ ] Edge function responds to Telegram webhook POST requests
- [ ] JSON parsing and validation for Telegram update objects
- [ ] Basic error handling and logging
- [ ] Environment variable configuration

**Technical Tasks:**
```typescript
// supabase/functions/telegram-bot/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const update = await req.json()
    console.log('Received update:', JSON.stringify(update))

    // Route based on update type
    if (update.inline_query) {
      return await handleInlineQuery(update.inline_query, supabase)
    } else if (update.callback_query) {
      return await handleCallbackQuery(update.callback_query, supabase)
    }

    return new Response('OK', { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    console.error('Error processing update:', error)
    return new Response('Error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
```

**Effort**: 2 days  
**Dependencies**: None (can parallel with US1.1)  
**Definition of Done**: Function deploys, receives webhooks, logs correctly

#### **US1.3: Telegram Bot Registration**
**As a** developer  
**I want** to register the bot with Telegram  
**So that** I can receive webhook notifications  

**Acceptance Criteria:**
- [ ] Bot created via @BotFather with appropriate name/description
- [ ] Webhook URL set to Supabase edge function endpoint
- [ ] Inline query enabled in bot settings
- [ ] Bot token securely stored in Supabase environment

**Technical Tasks:**
```bash
# Bot registration steps
1. Create bot via @BotFather: /newbot
2. Set bot name: HeyMax_shop_bot
3. Set description: "Turn group chats into Max Miles earning opportunities"
4. Enable inline queries: /setinline
5. Set webhook: 
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
   -d "url=https://<PROJECT>.supabase.co/functions/v1/telegram-bot"
```

**Effort**: 0.5 days  
**Dependencies**: US1.2 (Edge function deployed)  
**Definition of Done**: Webhook receives test messages, bot responds to /start

#### **US1.4: Basic Merchant Dataset**
**As a** developer  
**I want** seed merchant data in the database  
**So that** I can test affiliate link generation  

**Acceptance Criteria:**
- [ ] Top 20 popular merchants from HeyMax dataset
- [ ] Merchant slugs match expected inline query patterns
- [ ] Tracking link templates with {{USER_ID}} placeholders
- [ ] Basic merchant categories and MPD rates

**Technical Tasks:**
```sql
-- Seed popular merchants
INSERT INTO merchants (merchant_slug, merchant_name, tracking_link, base_mpd) VALUES
('pelago-by-singapore-airlines', 'Pelago by Singapore Airlines', 'https://pelago.pxf.io/Wqa5xZ?subid1={{USER_ID}}', 8.0),
('apple', 'Apple', 'https://apple.com/affiliate?ref={{USER_ID}}', 2.0),
('starbucks', 'Starbucks', 'https://starbucks.com/ref/{{USER_ID}}', 5.0),
-- ... 17 more popular merchants
```

**Effort**: 1 day  
**Dependencies**: US1.1 (Database schema)  
**Definition of Done**: 20+ merchants seeded, queries return valid data

### **Sprint 1 Summary**
**Total Effort**: 4.5 days  
**Parallel Execution**: US1.1 + US1.2 (40% time saving)  
**Sprint Goal**: Functional infrastructure ready for bot logic implementation

---

## 📖 **Sprint 2: Core Bot Functionality**

### **User Stories**

#### **US2.1: Inline Query Processing**
**As a** Telegram user  
**I want** to type `@HeyMax_shop_bot [merchant]` in any chat  
**So that** I can quickly find merchants and generate affiliate links  

**Acceptance Criteria:**
- [ ] Parse inline queries for merchant search terms
- [ ] Fuzzy matching against merchant database
- [ ] Return formatted inline results with merchant info
- [ ] Handle "no merchants found" gracefully

**Technical Tasks:**
```typescript
async function handleInlineQuery(inlineQuery: any, supabase: any) {
  const query = inlineQuery.query.trim().toLowerCase()
  const userId = inlineQuery.from.id
  
  if (!query) {
    return await answerInlineQuery(inlineQuery.id, [
      {
        type: 'article',
        id: 'help',
        title: '🔍 Search for merchants',
        description: 'Try: @HeyMax_shop_bot pelago',
        input_message_content: {
          message_text: '💡 Type merchant name after @HeyMax_shop_bot to find earning opportunities!'
        }
      }
    ])
  }

  // Search merchants with fuzzy matching
  const { data: merchants } = await supabase
    .from('merchants')
    .select('*')
    .or(`name.ilike.%${query}%,merchant_slug.ilike.%${query}%`)
    .limit(10)

  if (!merchants?.length) {
    return await answerInlineQuery(inlineQuery.id, [{
      type: 'article',
      id: 'no-results',
      title: `❌ No merchants found for "${query}"`,
      description: 'Try: pelago, apple, starbucks, adidas...',
      input_message_content: {
        message_text: `🔍 No merchants found for "${query}". Try popular brands like Pelago, Apple, or Starbucks!`
      }
    }])
  }

  // Return merchant results
  const results = merchants.map(merchant => ({
    type: 'article',
    id: merchant.merchant_slug,
    title: `🛍️ ${merchant.name}`,
    description: `Earn ${merchant.base_mpd} Max Miles per $1 spent`,
    input_message_content: {
      message_text: await generateBotResponse(userId, merchant, inlineQuery.from.username)
    },
    reply_markup: await generateViralKeyboard(userId, merchant.merchant_slug)
  }))

  return await answerInlineQuery(inlineQuery.id, results)
}
```

**Effort**: 2 days  
**Dependencies**: US1.1, US1.2, US1.4  
**Definition of Done**: Inline queries work in test group, returns valid merchant results

#### **US2.2: Affiliate Link Generation**
**As a** user  
**I want** personalized affiliate links  
**So that** my purchases earn Max Miles tracked to my account  

**Acceptance Criteria:**
- [ ] Replace {{USER_ID}} with actual Telegram user ID
- [ ] Add UTM parameters for attribution tracking
- [ ] Store link generation event in database
- [ ] Handle invalid merchant slugs gracefully

**Technical Tasks:**
```typescript
async function generateAffiliateLink(userId: string, merchantSlug: string, supabase: any): Promise<string> {
  const { data: merchant } = await supabase
    .from('merchants')
    .select('*')
    .eq('merchant_slug', merchantSlug)
    .single()

  if (!merchant) {
    throw new Error(`Merchant ${merchantSlug} not found`)
  }

  // Replace placeholder with actual user ID
  let affiliateLink = merchant.tracking_link.replace('{{USER_ID}}', userId)
  
  // Add UTM parameters
  const utmParams = new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'bot',
    utm_campaign: 'heymax_shop_bot',
    utm_content: merchantSlug
  })
  
  const separator = affiliateLink.includes('?') ? '&' : '?'
  affiliateLink += `${separator}${utmParams.toString()}`

  // Log generation event
  await supabase
    .from('link_generations')
    .insert({
      user_id: parseInt(userId),
      merchant_slug: merchantSlug,
      chat_id: null // Will be set later for group tracking
    })

  return affiliateLink
}
```

**Effort**: 1.5 days  
**Dependencies**: US2.1  
**Definition of Done**: Links generated correctly, tracking logged, UTM parameters present

#### **US2.3: User Registration & Tracking**
**As a** bot  
**I want** to track user registrations and activity  
**So that** I can measure engagement and viral growth  

**Acceptance Criteria:**
- [ ] Auto-register users on first interaction
- [ ] Update user statistics (link_count, last_seen)
- [ ] Handle username changes gracefully
- [ ] Privacy-compliant data collection

**Technical Tasks:**
```typescript
async function ensureUserExists(telegramUser: any, supabase: any) {
  const userId = telegramUser.id
  
  // Upsert user (insert or update)
  const { data: user } = await supabase
    .from('users')
    .upsert({
      id: userId,
      username: telegramUser.username || null,
      first_seen: new Date().toISOString(),
      link_count: 0
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  // Update username if changed
  if (telegramUser.username && user?.username !== telegramUser.username) {
    await supabase
      .from('users')
      .update({ username: telegramUser.username })
      .eq('id', userId)
  }

  return user
}

async function incrementUserLinkCount(userId: number, supabase: any) {
  await supabase.rpc('increment_link_count', { user_id: userId })
}
```

**Effort**: 1 day  
**Dependencies**: US2.1  
**Definition of Done**: Users auto-registered, stats updated, privacy preserved

#### **US2.4: Bot Response Formatting**
**As a** user  
**I want** attractive, informative bot responses  
**So that** I understand the earning opportunity and can take action  

**Acceptance Criteria:**
- [ ] Formatted message with emojis and clear structure
- [ ] Show earning rate and merchant description
- [ ] Personal greeting with username
- [ ] Call-to-action for both user and others

**Technical Tasks:**
```typescript
async function generateBotResponse(userId: string, merchant: any, username?: string): Promise<string> {
  const displayName = username ? `@${username}` : `User ${userId}`
  const affiliateLink = await generateAffiliateLink(userId, merchant.merchant_slug, supabase)
  
  return `🎯 ${displayName}, your ${merchant.name} shopping link is ready!

✨ Earn ${merchant.base_mpd} Max Miles per $1 spent - turn your ${merchant.name} shopping into free flights, dining, and more!

👆 Tap your personalized link above to start earning
👇 Others: Generate YOUR unique link to earn Max Miles at ${merchant.name} too!

💡 Try other merchants: @HeyMax_shop_bot [merchant] (e.g., Apple, Starbucks, Adidas)`
}
```

**Effort**: 1 day  
**Dependencies**: US2.2  
**Definition of Done**: Messages format correctly, links display properly, text is engaging

### **Sprint 2 Summary**
**Total Effort**: 5.5 days  
**Parallel Execution**: US2.3 + US2.4 (25% time saving)  
**Sprint Goal**: Working inline bot that generates affiliate links

---

## 📖 **Sprint 3: Viral Mechanics & Launch**

### **User Stories**

#### **US3.1: Viral Button Implementation**
**As a** group member  
**I want** to click "Get MY Unique Link"  
**So that** I can generate my own affiliate link for the same merchant  

**Acceptance Criteria:**
- [ ] Inline keyboard with "Get MY Unique Link" button
- [ ] Button callback generates new user's personalized response
- [ ] Viral tracking (who clicked from whose original link)
- [ ] Rate limiting to prevent abuse

**Technical Tasks:**
```typescript
async function generateViralKeyboard(originalUserId: string, merchantSlug: string): Promise<any> {
  return {
    inline_keyboard: [
      [
        {
          text: `🛍️ Shop ${merchantSlug} & Earn Miles (for @${originalUserId})`,
          url: await generateAffiliateLink(originalUserId, merchantSlug, supabase)
        }
      ],
      [
        {
          text: "⚡ Get MY Unique Link for " + merchantSlug,
          callback_data: `generate:${merchantSlug}:${originalUserId}`
        }
      ]
    ]
  }
}

async function handleCallbackQuery(callbackQuery: any, supabase: any) {
  const userId = callbackQuery.from.id
  const [action, merchantSlug, originalUserId] = callbackQuery.data.split(':')
  
  if (action === 'generate') {
    // Ensure user exists
    await ensureUserExists(callbackQuery.from, supabase)
    
    // Generate new affiliate link
    const { data: merchant } = await supabase
      .from('merchants')
      .select('*')
      .eq('merchant_slug', merchantSlug)
      .single()
    
    if (!merchant) {
      return await answerCallbackQuery(callbackQuery.id, '❌ Merchant not found', true)
    }
    
    // Track viral interaction
    await supabase
      .from('viral_interactions')
      .insert({
        original_user_id: parseInt(originalUserId),
        viral_user_id: userId,
        merchant_slug: merchantSlug,
        chat_id: callbackQuery.message?.chat?.id
      })
    
    // Generate viral response
    const responseText = await generateBotResponse(userId, merchant, callbackQuery.from.username)
    const keyboard = await generateViralKeyboard(userId, merchantSlug)
    
    // Send new message to chat
    await sendMessage(callbackQuery.message.chat.id, responseText, keyboard)
    
    return await answerCallbackQuery(callbackQuery.id, '✅ Your unique link generated!', false)
  }
}
```

**Effort**: 2 days  
**Dependencies**: US2.1, US2.2  
**Definition of Done**: Buttons work, viral loops function, tracking recorded

#### **US3.2: Analytics & Monitoring**
**As a** developer  
**I want** basic analytics and monitoring  
**So that** I can track bot usage and detect issues  

**Acceptance Criteria:**
- [ ] Track daily/monthly active users
- [ ] Monitor function invocation counts (free tier limits)
- [ ] Basic viral coefficient calculation
- [ ] Error rate and response time monitoring

**Technical Tasks:**
```typescript
// Add to database schema
CREATE TABLE viral_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id BIGINT REFERENCES users(id),
  viral_user_id BIGINT REFERENCES users(id),
  merchant_slug TEXT REFERENCES merchants(merchant_slug),
  chat_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

// Analytics queries
async function getAnalytics(supabase: any) {
  const [
    totalUsers,
    dailyActiveUsers,
    totalLinks,
    viralInteractions,
    functionInvocations
  ] = await Promise.all([
    supabase.from('users').select('count', { count: 'exact' }),
    supabase.from('link_generations').select('count', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString()),
    supabase.from('link_generations').select('count', { count: 'exact' }),
    supabase.from('viral_interactions').select('count', { count: 'exact' }),
    // Function invocations tracked via Supabase dashboard
  ])
  
  const viralCoefficient = totalUsers.count > 0 
    ? (viralInteractions.count / totalUsers.count) 
    : 0
    
  return {
    totalUsers: totalUsers.count,
    dailyActiveUsers: dailyActiveUsers.count,
    totalLinks: totalLinks.count,
    viralCoefficient: viralCoefficient.toFixed(2),
    functionInvocationsWarning: functionInvocations > 400000 // 80% of free tier
  }
}
```

**Effort**: 1.5 days  
**Dependencies**: US3.1  
**Definition of Done**: Analytics dashboard accessible, alerts configured for limits

#### **US3.3: Load Testing & Performance**
**As a** developer  
**I want** to test bot performance under load  
**So that** I can ensure it handles viral growth spikes  

**Acceptance Criteria:**
- [ ] Test 100 concurrent inline queries
- [ ] Measure response times under load
- [ ] Test database connection limits
- [ ] Validate free tier resource usage

**Technical Tasks:**
```bash
# Load testing script using Artillery
npm install -g artillery

# artillery-config.yml
config:
  target: 'https://api.telegram.org/bot<TOKEN>'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300  
      arrivalRate: 20
      name: "Sustained load"
scenarios:
  - name: "Inline Query Test"
    weight: 100
    flow:
      - post:
          url: "/getUpdates"
          json:
            inline_query:
              id: "{{ $randomString() }}"
              from:
                id: "{{ $randomInt(100000, 999999) }}"
                username: "testuser{{ $randomInt() }}"
              query: "pelago"

# Run load test
artillery run artillery-config.yml
```

**Effort**: 1 day  
**Dependencies**: US3.2  
**Definition of Done**: Bot handles 100+ concurrent users, <1s response time maintained

#### **US3.4: Production Deployment**
**As a** product owner  
**I want** the bot deployed to production  
**So that** real users can start using it  

**Acceptance Criteria:**
- [ ] Production Supabase project configured
- [ ] Environment variables properly set
- [ ] Webhook URL updated to production
- [ ] Monitoring and logging active
- [ ] Backup and recovery procedures documented

**Technical Tasks:**
```bash
# Production deployment checklist
1. Create production Supabase project
2. Deploy database schema to production
3. Seed production merchant data
4. Deploy edge function to production
5. Update Telegram webhook to production URL
6. Configure environment variables
7. Set up monitoring alerts
8. Document incident response procedures
9. Create backup schedule
10. Test production deployment
```

**Effort**: 1 day  
**Dependencies**: US3.3  
**Definition of Done**: Production bot live, monitoring active, incident procedures ready

#### **US3.5: Launch & User Onboarding**
**As a** user  
**I want** clear instructions on how to use the bot  
**So that** I can quickly start earning Max Miles  

**Acceptance Criteria:**
- [ ] /start command with clear usage instructions
- [ ] Help message with examples and merchant list
- [ ] Group admin guidance for adding bot
- [ ] Launch announcement ready for HeyMax community

**Technical Tasks:**
```typescript
async function handleStartCommand(message: any, supabase: any) {
  const helpText = `🎯 Welcome to HeyMax Shop Bot!

🚀 **How to earn Max Miles in any chat:**
1. Type @HeyMax_shop_bot followed by a merchant name
2. Select your merchant from the results
3. Tap your personalized link to start shopping & earning!

💡 **Try these popular merchants:**
• Pelago (8 miles/$) - Travel & experiences
• Apple (2 miles/$) - Electronics 
• Starbucks (5 miles/$) - Food & drinks
• Adidas (4 miles/$) - Sports & lifestyle

⚡ **Viral earning:** When others see your link, they can generate their own and earn too!

🎪 **Add me to group chats** so everyone can discover earning opportunities together!

Type @HeyMax_shop_bot pelago to try it now! 🛍️`

  await sendMessage(message.chat.id, helpText)
}
```

**Effort**: 0.5 days  
**Dependencies**: US3.4  
**Definition of Done**: Help system complete, launch materials ready, community notified

### **Sprint 3 Summary**
**Total Effort**: 6 days  
**Parallel Execution**: US3.2 + US3.3 (30% time saving)  
**Sprint Goal**: Production-ready viral bot with monitoring and analytics

---

## 🔄 **Risk Management & Contingencies**

### **High-Risk Items**

#### **Risk 1: Free Tier Limits Exceeded**
**Probability**: Medium | **Impact**: High  
**Mitigation**: 
- Monitor function calls daily (80% threshold alerts)
- Implement rate limiting (100 requests/hour per user)
- Plan upgrade to Supabase Pro ($25/month) if needed
- Cache frequently accessed merchant data

#### **Risk 2: Telegram API Changes**
**Probability**: Low | **Impact**: Medium  
**Mitigation**:
- Pin API version in webhook configuration
- Monitor Telegram developer announcements
- Implement error handling for API changes
- Test with Telegram Bot API test environment

#### **Risk 3: HeyMax Integration Issues**
**Probability**: Medium | **Impact**: Low  
**Mitigation**:
- Start with static merchant dataset (MVP approach)
- Plan API integration for Phase 2
- Validate affiliate link formats regularly
- Maintain merchant data quality

#### **Risk 4: Performance Degradation**
**Probability**: Medium | **Impact**: Medium  
**Mitigation**:
- Load test at 80% expected capacity
- Optimize database queries with proper indexes
- Implement connection pooling
- Plan for horizontal scaling with paid tiers

### **Quality Gates**

#### **Code Quality**
- [ ] TypeScript strict mode enabled
- [ ] ESLint configuration applied
- [ ] Error handling for all external API calls
- [ ] Proper logging for debugging

#### **Security**  
- [ ] No hardcoded secrets in code
- [ ] Input validation for all user data
- [ ] Rate limiting implemented
- [ ] SQL injection prevention

#### **Performance**
- [ ] <1 second response time for 95% of requests
- [ ] <500ms database query times
- [ ] <100ms edge function cold start time
- [ ] <1% error rate under normal load

#### **Business Logic**
- [ ] Affiliate links generate correctly
- [ ] Viral mechanics work as expected
- [ ] Analytics track accurately
- [ ] User privacy preserved

---

## 📊 **Success Measurement**

### **Week 1 (Sprint 1) Goals**
- [ ] Database schema deployed and tested
- [ ] Edge function receives webhooks successfully  
- [ ] Bot responds to basic commands
- [ ] 20+ merchants seeded in database

### **Week 2 (Sprint 2) Goals**
- [ ] Inline queries return merchant results
- [ ] Affiliate links generate with proper tracking
- [ ] User registration and statistics work
- [ ] Bot responses format correctly

### **Week 3 (Sprint 3) Goals**
- [ ] Viral buttons create new interactions
- [ ] Analytics dashboard shows key metrics
- [ ] Load testing passes (100+ concurrent users)
- [ ] Production deployment complete and monitored

### **Post-Launch (Week 4+) Validation**
- [ ] 50+ daily active users within 2 weeks
- [ ] 500+ link generations per month
- [ ] 1.2+ viral coefficient sustained
- [ ] <400K function calls/month (within free tier)
- [ ] User feedback positive (informal survey)

---

## 🛠️ **Technical Debt & Future Enhancements**

### **Immediate Technical Debt (Accept for MVP)**
- Single edge function handles all logic (will need decomposition at scale)
- No advanced caching (acceptable for free tier validation)
- Basic error handling (improve with production experience)
- Limited analytics (sufficient for MVP validation)

### **Phase 2 Enhancements (Post-MVP)**
- Real-time viral feed showing community earnings
- Advanced analytics with conversion tracking
- HeyMax API integration for dynamic merchant data
- Enhanced user interface with rich media
- Group admin revenue sharing features
- Multi-language support for APAC expansion

### **Scaling Preparation**
- Database read replicas (when approaching storage limits)
- Redis caching layer (Upstash free tier)
- Microservices decomposition (separate concerns)
- Multi-region deployment (global scale)

---

## ✅ **Definition of Done (Overall MVP)**

### **Functional Requirements**
- [ ] Users can discover merchants via inline queries
- [ ] Personalized affiliate links generate correctly  
- [ ] Viral "Get MY Unique Link" buttons create new interactions
- [ ] User tracking and analytics capture engagement
- [ ] Bot responds in <1 second for 95% of requests

### **Technical Requirements**  
- [ ] Deployed to production Supabase environment
- [ ] Monitoring and alerting configured
- [ ] Error rate <1% under normal load
- [ ] Free tier usage <80% of limits
- [ ] Security best practices implemented

### **Business Requirements**
- [ ] Demonstration video showing viral mechanics
- [ ] User guide and documentation complete
- [ ] HeyMax community announcement ready
- [ ] Success metrics dashboard accessible
- [ ] Plan for Phase 2 features documented

---

This comprehensive workflow provides a complete roadmap for implementing the HeyMax_shop_bot MVP within 2-3 weeks using agile methodology and free-tier infrastructure, with clear success criteria and risk mitigation strategies.