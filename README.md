# HeyMax Shop Bot 🛍️

> Telegram inline bot that transforms group chats into Max Miles earning opportunities through viral social commerce.

[![TDD Pipeline](https://github.com/calvindotsg/heymax_shop_bot/actions/workflows/tdd-pipeline.yml/badge.svg)](https://github.com/calvindotsg/heymax_shop_bot/actions/workflows/tdd-pipeline.yml)
[![Supabase](https://img.shields.io/badge/platform-Supabase%20Edge%20Functions-blue)](https://supabase.com)
[![GitHub commit activity (branch)](https://img.shields.io/github/commit-activity/w/calvindotsg/heymax_shop_bot/main)](https://github.com/calvindotsg/heymax_shop_bot/commits/main/)

## 🚀 What is HeyMax Shop Bot?

HeyMax Shop Bot is a production-ready Telegram inline bot that enables users to earn [Max Miles](https://heymax.ai) on purchases by generating personalized affiliate links directly in group chats. Built for HeyMax's platform ($6M run rate, 272M+ Max Miles issued), it transforms group conversations into viral earning opportunities.

### Key Features

- 🔍 **Inline Search**: Type `@heymax_shop_bot amazon` in any chat to find merchants
- 🎯 **Personalized Links**: Generate tracked affiliate links earning Max Miles per $1 spent  
- ⚡ **Viral Mechanics**: "Get MY Unique Link" buttons create viral loops in group chats
- 📊 **Real-time Analytics**: Track viral coefficient, clicks, and conversions
- 🛍️ **187+ Merchants**: Singapore's top merchants with instant link generation
- 💬 **Group Chat Native**: Works seamlessly in private chats, groups, and channels

## 🏗️ Architecture

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

### Tech Stack

- **Runtime**: [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno + TypeScript)
- **Database**: PostgreSQL with viral interaction tracking
- **APIs**: Telegram Bot API with webhook integration
- **Testing**: Deno native testing + Artillery load testing
- **Deployment**: Automated scripts with monitoring

## 🚦 Quick Start

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.com/manual/getting_started/installation) (≥2.0.0)
- Telegram Bot Token from [@BotFather](https://telegram.me/BotFather)

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/calvindotsg/heymax_shop_bot.git
cd heymax_shop_bot

# Start Supabase local instance (requires Docker desktop)
supabase start
```

### 2. Development & Testing

```bash
# Run tests (43 test cases)
npm test

# Start TDD workflow
npm run tdd:start

# Performance testing
npm run test:performance
```

### 3. Production Deployment

```bash
# Deploy to production (requires environment variables)
./scripts/production-deploy.sh \
  --project-id your_project_id \
  --token $TELEGRAM_BOT_TOKEN \
  --anon-key $SUPABASE_ANON_KEY
```

## 📱 User Experience

### Basic Usage

1. **Search**: Type `@heymax_shop_bot amazon` in any Telegram chat
2. **Select**: Choose merchant from fuzzy-matched results
3. **Share**: Tap personalized affiliate link to earn Max Miles
4. **Viral Growth**: Others can tap "Get MY Unique Link" to create their own links

### Example Flow

```
User: @heymax_shop_bot amazon

Bot Response:
🎯 @username, your Amazon link is ready!
✨ Earn 8.0 Max Miles per $1 spent
💰 Example: Spend $100 → Earn 800 Max Miles
🚀 Your personalized link: [Amazon Link]
⚡ Others: Tap "Get MY Link" to earn Max Miles at Amazon too!

[🛍️ Shop Amazon & Earn Miles (@username)] [⚡ Get MY Unique Link for Amazon]
```

## 🧪 Testing

Comprehensive test suite with 100% core functionality coverage:

```bash
# Unit tests (30 test cases)
npm run test -- tests/unit/

# Integration tests (8 test cases) 
npm run test -- tests/integration/

# Performance tests (5 test cases)
npm run test:performance

# Full pipeline
npm run pipeline
```

### Test Categories

- **Unit Tests**: Core bot functionality, affiliate link generation, viral mechanics
- **Integration Tests**: Database operations, Telegram API integration
- **Performance Tests**: Load testing with Artillery (100+ concurrent users)
- **E2E Tests**: Complete user journey validation

## 📊 Analytics & Monitoring

### Real-time Metrics

- **Viral Coefficient**: Track viral loop effectiveness (target: >1.2)
- **User Engagement**: Click-through rates, conversion tracking
- **Performance**: Response times, error rates, function invocations
- **Cost Management**: Free-tier usage monitoring with upgrade alerts

### Monitoring Setup

```bash
# Setup production monitoring
./scripts/monitoring-setup.sh \
  --url https://your-project.supabase.co/functions/v1/telegram-bot
```

### Analytics Dashboard

Access real-time analytics at: `https://your-project.supabase.co/functions/v1/telegram-bot/analytics`

## 🔧 Development

### Project Structure

```
heymax_shop_bot/
├── supabase/
│   ├── functions/telegram-bot/index.ts    # Main bot logic
│   ├── migrations/                        # Database schema
│   └── config.toml                       # Supabase configuration
├── tests/
│   ├── unit/                             # Unit test suites  
│   ├── integration/                      # Integration tests
│   └── performance/                      # Load testing
├── scripts/
│   ├── production-deploy.sh              # Deployment automation
│   └── monitoring-setup.sh              # Monitoring configuration
├── dataset/
│   └── extracted_merchants_sg.csv       # Singapore merchant data
└── documentation/                       # Comprehensive docs
```

### Key Components

#### Core Bot Logic (`supabase/functions/telegram-bot/index.ts`)
- **Inline Query Processing**: Fuzzy search with merchant matching  
- **Affiliate Link Generation**: User ID tracking with UTM parameters
- **Viral Mechanics**: Callback query system for viral link generation
- **Analytics Tracking**: Real-time viral coefficient and user engagement

#### Database Schema
- **Users**: Telegram user tracking with activity metrics
- **Merchants**: Singapore merchant data with Max Miles rates
- **Link Generations**: Affiliate link tracking with analytics
- **Viral Interactions**: Viral loop tracking for coefficient analysis

### TDD Workflow

The project follows Test-Driven Development:

```bash
# Start TDD workflow
npm run tdd:start

# Development cycle:
# 1. Write failing test (RED)
# 2. Implement feature (GREEN) 
# 3. Refactor code (REFACTOR)
# 4. Repeat
```

## 🚀 Production Deployment

### Deployment Checklist

- [ ] Supabase project created with PostgreSQL database
- [ ] Telegram Bot Token configured via [@BotFather](https://telegram.me/BotFather)
- [ ] Environment variables set (see [Configuration](#2-configuration))
- [ ] Database migrations applied (`npm run db:migrate`)
- [ ] Merchant data seeded (automated in deployment script)

### Automated Deployment

```bash
./scripts/production-deploy.sh \
  --project-id abc123 \
  --token 123456:ABC-DEF \
  --anon-key eyJ0eXAiOiJKV1Q... \
  --yes  # Skip confirmation prompts
```

### Infrastructure Scaling

| Tier | Invocations/Month | Cost | Use Case |
|------|------------------|------|----------|
| **Free** | <400K | $0 | MVP, early testing |
| **Pro** | <2M | $25 | Growth phase |
| **Team** | <10M | $599 | Scale deployment |

## 🔐 Security & Compliance

### Security Measures

- **Input Validation**: All user inputs sanitized and validated
- **Rate Limiting**: Telegram API rate limit compliance  
- **Error Handling**: Comprehensive error catching without information leakage
- **Token Security**: Environment-based secret management

### Data Privacy

- **Minimal Data Collection**: Only Telegram user ID and username
- **GDPR Compliance**: User data deletion support via `/delete` command
- **Analytics Privacy**: Aggregated metrics without PII exposure

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TDD workflow (`npm run tdd:start`)
4. Run full test suite (`npm run pipeline`)
5. Submit pull request

### Code Standards

- **TypeScript**: Strict typing with Deno native support
- **Testing**: >80% coverage requirement (90% for critical components)
- **Documentation**: JSDoc comments for all public functions
- **Linting**: Deno native linting (`deno lint`)

## 📈 Business Impact

### Target Market
- **Audience**: 11K existing HeyMax Telegram community members
- **Expansion**: Asia Pacific group chat social commerce
- **Revenue Model**: Affiliate commission on Max Miles earning transactions

### Success Metrics
- **Viral Coefficient**: >1.2 sustainable viral growth
- **User Engagement**: >10% click-through rate on affiliate links  
- **Community Growth**: 50% month-over-month group chat adoption
- **Revenue**: $100K+ monthly affiliate commission target

## 📚 Documentation

- **[Setup Guide](documentation/SETUP.md)**: Detailed installation and configuration
- **[Implementation Guide](documentation/MVP_Implementation_Workflow.md)**: Complete development workflow
- **[TDD Framework](documentation/TDD_Framework_Setup.md)**: Testing methodology and best practices
- **[Production Deployment](documentation/PRODUCTION_DEPLOYMENT.md)**: Deployment and monitoring guides
- **[Sprint Documentation](documentation/)**: Sprint 1-3 implementation details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♀️ Support

### Community
- **Telegram Community**: [HeyMax Community](https://t.me/+gNZRwXXy9Gc1MzJl) (11K+ members)
- **Issues**: [GitHub Issues](https://github.com/calvindotsg/heymax_shop_bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/calvindotsg/heymax_shop_bot/discussions)

### Commercial Support  
For enterprise deployment and custom features:
- **Email**: help@heymax.ai
- **Website**: [heymax.ai](https://heymax.ai)
- **Business Development**: Scaling across Asia Pacific markets

---

**Built with ❤️ by the HeyMax Team** | **Transforming Group Chats into Earning Opportunities**

*Ready to earn Max Miles? Start with: `@heymax_shop_bot amazon`* 🚀