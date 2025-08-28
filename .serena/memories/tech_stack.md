# Technology Stack

## Programming Language
- **Python 3.13.7** (primary language for bot development)

## Framework & APIs
- **Telegram Bot API**: Core bot functionality and inline queries
- **HeyMax Affiliate API**: Merchant data and tracking link generation
- **Flask/FastAPI**: Web framework for webhook handling (to be determined)

## Data & Storage
- **HeyMax Merchant Dataset**: JSON schema with 500+ merchants including tracking links, MPD rates, promotions
- **User Tracking**: Telegram user_id for affiliate link personalization
- **Analytics Storage**: Click tracking, conversion measurement (implementation TBD)

## Infrastructure (Planned)
- **Hosting**: Cloud functions or VPS (to be determined)
- **Webhooks**: Telegram webhook endpoints for real-time message handling
- **Security**: Telegram bot token management, API key protection

## Key Integrations
- **HeyMax Platform**: Existing merchant affiliate system access
- **Telegram API**: Bot commands, inline queries, message formatting
- **Analytics**: Real-time click tracking and conversion measurement

## Development Tools
- **Git**: Version control (Apple Git-154)
- **Python Environment**: Virtual environment management needed
- **Testing**: Framework TBD (pytest likely)
- **Linting**: Code style enforcement TBD