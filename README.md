# HeyMax Shop Bot 🛍️

> **Production-Ready MVP**: Telegram inline bot that transforms group chats into Max Miles earning opportunities through viral social commerce.

[![Supabase](https://img.shields.io/badge/platform-Supabase%20Edge%20Functions-blue)](https://supabase.com)

## 🚀 What is HeyMax Shop Bot?

HeyMax Shop Bot is a **production-ready Telegram inline bot** that enables users to earn [Max Miles](https://heymax.ai) on purchases by generating personalized affiliate links directly in group chats. Built for HeyMax's platform ($6M run rate, 272M+ Max Miles issued), it transforms group conversations into viral earning opportunities.

**📊 Project Status**: ✅ **MVP Complete** - All 3 sprints delivered, 43/43 tests passing, production-ready deployment scripts

### Key Features

- 🔍 **Inline Search**: Type `@heymax_shop_bot amazon` in any chat to find
  merchants
- 🎯 **Personalized Links**: Generate tracked affiliate links earning Max Miles
  per $1 spent
- ⚡ **Viral Mechanics**: "Get MY Unique Link" buttons create viral loops in
  group chats
- 📊 **Real-time Analytics**: Track viral coefficient, clicks, and conversions
- 🛍️ **187+ Merchants**: Singapore's top merchants with instant link generation
- 💬 **Group Chat Native**: Works seamlessly in private chats, groups, and
  channels

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

- **Runtime**:
  [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno +
  TypeScript)
- **Database**: PostgreSQL with viral interaction tracking
- **APIs**: Telegram Bot API with webhook integration
- **Testing**: Deno native testing + Artillery load testing
- **Deployment**: Automated scripts with monitoring

## 🚦 Quick Start

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.com/manual/getting_started/installation) (≥2.0.0) 
- Node.js (≥18.0.0) for package management
- Telegram Bot Token from [@BotFather](https://telegram.me/BotFather)
- Docker Desktop (for local Supabase instance)

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
# Install dependencies and setup
npm install

# Run all tests (43 test cases) 
npm test

# Start TDD workflow (recommended for development)
npm run tdd:start

# Run performance testing with load simulation
npm run test:performance

# Complete CI/CD pipeline 
npm run pipeline
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
4. **Viral Growth**: Others can tap "Get MY Unique Link" to create their own
   links

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

Comprehensive test suite with 43/43 tests passing and TDD-driven development:

```bash
# Unit tests (30 test cases)
npm run test:unit

# Integration tests (comprehensive TDD suite)
npm run test:integration

# Quick integration test run
npm run test:integration:quick

# Performance tests (5 test cases) 
npm run test:performance

# Full TDD pipeline
npm run pipeline

# Watch mode for TDD development
npm run test:watch
```

### TDD-Enhanced Test Categories

- **Unit Tests**: Core bot functionality, affiliate link generation, viral mechanics
- **Integration Tests**: 
  - Database schema validation and operations
  - Telegram Bot API integration and webhook handling
  - Supabase Edge Function integration with production endpoints
  - End-to-end viral flow validation and coefficient tracking
- **Performance Tests**: Load testing with concurrent user simulation
- **Coverage Requirements**: >80% overall, >90% critical components

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

Access real-time analytics at:
`https://your-project.supabase.co/functions/v1/telegram-bot/analytics`

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
- [ ] Telegram Bot Token configured via
      [@BotFather](https://telegram.me/BotFather)
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

| Tier     | Invocations/Month | Cost | Use Case           |
| -------- | ----------------- | ---- | ------------------ |
| **Free** | <400K             | $0   | MVP, early testing |
| **Pro**  | <2M               | $25  | Growth phase       |
| **Team** | <10M              | $599 | Scale deployment   |

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

## 📊 Current Status & Achievements

### ✅ MVP Complete - All Sprints Delivered

- **Sprint 1**: Foundation & Infrastructure ✅ 
  - Database schema with viral interaction tracking
  - Supabase Edge Functions setup
  - Telegram webhook integration
  
- **Sprint 2**: Core Bot Functionality ✅
  - Inline query processing with fuzzy search
  - Affiliate link generation with user tracking
  - Real-time analytics and engagement metrics
  
- **Sprint 3**: Viral Mechanics & Production ✅
  - "Get MY Unique Link" viral button system
  - Load testing with 100+ concurrent users
  - Automated deployment and monitoring scripts

### 🎯 Key Metrics Achieved

- **Tests**: 43/43 passing (100% success rate)
- **Coverage**: 90% for critical components  
- **Performance**: <1s response time target achieved
- **Scalability**: Free-tier compliant (<400K calls/month)
- **Production**: Automated deployment ready

## 📚 Documentation

- **[Setup Guide](documentation/SETUP.md)**: Detailed installation and configuration
- **[Implementation Guide](documentation/MVP_Implementation_Workflow.md)**: Complete development workflow  
- **[TDD Framework](documentation/TDD_Framework_Setup.md)**: Testing methodology and best practices
- **[Production Deployment](documentation/PRODUCTION_DEPLOYMENT.md)**: Deployment and monitoring guides
- **[Sprint Documentation](documentation/)**: Sprint 1-3 implementation details
- **[CLAUDE.md](CLAUDE.md)**: Development guide for AI assistants

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🚀 Next Steps

### For Users
1. **Try the Bot**: Search for `@heymax_shop_bot` in Telegram
2. **Join Community**: [HeyMax Telegram](https://t.me/+gNZRwXXy9Gc1MzJl) (11K+ members)
3. **Start Earning**: Type `@heymax_shop_bot amazon` in any chat

### For Developers
1. **Deploy Your Instance**: Use `./scripts/production-deploy.sh`
2. **Customize Merchants**: Edit `dataset/extracted_merchants_sg.csv`
3. **Extend Features**: Follow TDD workflow with `npm run tdd:start`

### For Enterprise
1. **Scale Infrastructure**: Upgrade from free tier to Supabase Pro ($25/month)
2. **Regional Expansion**: Adapt merchant dataset for other markets
3. **Custom Features**: Contact hello@heymax.ai for enterprise development

## 🙋‍♀️ Support

### Community

- **Telegram Community**: [HeyMax Community](https://t.me/+gNZRwXXy9Gc1MzJl) (11K+ members)
- **Issues**: [GitHub Issues](https://github.com/calvindotsg/heymax_shop_bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/calvindotsg/heymax_shop_bot/discussions)

### Commercial Support

For enterprise deployment and custom features:

- **Email**: hello@heymax.ai
- **Website**: [heymax.ai](https://heymax.ai)
- **Business Development**: Scaling across Asia Pacific markets

---

**Built with ❤️ by the HeyMax Team** | **Transforming Group Chats into Earning Opportunities**

_Ready to earn Max Miles? Start with: `@heymax_shop_bot amazon`_ 🚀
