# Free-Tier MVP Architecture Analysis - HeyMax_shop_bot

## Executive Summary
Completely redesigned architecture for zero-cost MVP using only free-tier services (Supabase) to validate viral social commerce concept before scaling investment.

## Core Architecture Pattern: Serverless Monolith
- **Single Supabase Edge Function**: Handles all bot interactions (TypeScript/Deno)
- **PostgreSQL Database**: User tracking + merchant data + simple analytics
- **Telegram Webhook**: Direct integration to edge function
- **Zero Infrastructure Cost**: Perfect for MVP validation

```
Telegram Group Chat
    ↓ webhook
Supabase Edge Function
    ↓ query
PostgreSQL Database  
    ↓ generate
Affiliate Link + Viral Response
```

## Free Tier Capacity Analysis

| Resource | Free Limit | MVP Usage | Utilization |
|----------|------------|-----------|-------------|
| Edge Functions | 500K/month | ~16K/month | 3% |
| Database Storage | 500MB | ~50MB | 10% |
| Active Users | 50K/month | 11K total | 22% |

**Sustainable Load**: 550 daily active users (5% of 11K total users)
**Monthly Function Calls**: ~16,500 (well within 500K limit)

## Simplified Data Model

```sql
-- Core tables optimized for free tier limits
CREATE TABLE users (
  id BIGINT PRIMARY KEY, -- Telegram user_id
  username TEXT,
  first_seen TIMESTAMP DEFAULT NOW(),
  link_count INTEGER DEFAULT 0
);

CREATE TABLE merchants (
  merchant_slug TEXT PRIMARY KEY,
  merchant_name TEXT,
  tracking_link TEXT,
  base_mpd DECIMAL
);

CREATE TABLE link_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(id),
  merchant_slug TEXT REFERENCES merchants(slug),
  chat_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Technology Stack (Free Tier Only)
- **Backend**: Supabase Edge Functions (serverless TypeScript/Deno)
- **Database**: Supabase PostgreSQL (500MB)
- **Hosting**: Supabase platform
- **Version Control**: GitHub (free)
- **CI/CD**: GitHub Actions (2000 minutes/month)
- **Monitoring**: Supabase Dashboard + built-in logs

## MVP Implementation Timeline: 2-3 Weeks

### Week 1: Foundation
- Supabase project setup + database schema
- Basic edge function structure
- Telegram webhook configuration
- Core data models implementation

### Week 2: Core Features  
- Inline query parsing (`@HeyMax_shop_bot [merchant]`)
- Affiliate link generation with user tracking
- Merchant data management (static dataset)
- Basic user tracking and analytics

### Week 3: Viral Mechanics
- "Get MY Unique Link" button functionality
- Callback query handling for viral loops
- Simple analytics dashboard
- Testing + deployment + monitoring

## MVP Success Metrics
- **Response Time**: <1 second for inline queries
- **User Engagement**: 500+ link generations/month
- **Viral Coefficient**: 1.2+ (each user generates 1.2+ new interactions)
- **Function Usage**: <400K calls/month (80% of free limit)

## Scaling & Upgrade Path
1. **Immediate**: Supabase Pro ($25/month) for 2M function calls
2. **Growth**: Add Redis caching + advanced analytics
3. **Scale**: Microservices migration for millions of users

This free-tier MVP provides zero-risk validation while maintaining clear scaling trajectory.