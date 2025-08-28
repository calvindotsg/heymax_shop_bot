# Production Scripts - Command Line Arguments Enhancement

## Overview
Enhanced both production scripts (`production-deploy.sh` and `monitoring-setup.sh`) with comprehensive command line argument support for flexible configuration and automation.

## Production Deployment Script (`scripts/production-deploy.sh`)

### New Command Line Options

#### Required Options:
- `-p, --project-id PROJECT_ID` - Supabase production project ID
- `-t, --token BOT_TOKEN` - Telegram bot token from @BotFather

#### Optional Options:
- `-o, --org-id ORG_ID` - Supabase organization ID (for new projects)
- `-d, --db-password PASSWORD` - Production database password
- `-y, --yes` - Skip confirmation prompts (automation friendly)
- `-s, --skip-seed` - Skip merchant data seeding
- `--dry-run` - Show what would be deployed without executing
- `-v, --verbose` - Enable verbose logging with debug information
- `-h, --help` - Show comprehensive help message

### Environment Variable Support:
- `PRODUCTION_PROJECT_ID` - Alternative to --project-id
- `TELEGRAM_BOT_TOKEN` - Alternative to --token
- `SUPABASE_ORG_ID` - Alternative to --org-id
- `PRODUCTION_DB_PASSWORD` - Alternative to --db-password

### Enhanced Features:
- **Dry-run mode**: Validate deployment steps without execution
- **Verbose logging**: Debug information and execution tracing
- **Automation support**: Skip confirmations for CI/CD pipelines
- **Flexible seeding**: Option to skip data seeding for existing deployments
- **Enhanced error handling**: Clear validation and helpful error messages

### Usage Examples:
```bash
# Basic deployment
./scripts/production-deploy.sh --project-id abc123 --token 123456:ABC-DEF

# Automated deployment (CI/CD friendly)
./scripts/production-deploy.sh -p abc123 -t 123456:ABC-DEF --yes --skip-seed

# Dry-run validation
./scripts/production-deploy.sh --project-id abc123 --token 123456:ABC-DEF --dry-run

# Verbose debugging
./scripts/production-deploy.sh -p abc123 -t 123456:ABC-DEF --verbose
```

## Monitoring Setup Script (`scripts/monitoring-setup.sh`)

### New Command Line Options

#### Required Options:
- `-u, --url PRODUCTION_URL` - Production bot URL (e.g., https://project.supabase.co/functions/v1/telegram-bot)

#### Optional Options:
- `-t, --token BOT_TOKEN` - Telegram bot token for webhook monitoring
- `-e, --email ALERT_EMAIL` - Email address for alerts
- `-i, --interval MINUTES` - Monitoring interval in minutes (default: 5)
- `--no-performance` - Skip performance testing setup
- `--no-dashboard` - Skip dashboard creation
- `--non-interactive` - Run without prompting for input
- `-v, --verbose` - Enable verbose logging
- `-h, --help` - Show comprehensive help message

### Environment Variable Support:
- `PRODUCTION_URL` - Alternative to --url
- `TELEGRAM_BOT_TOKEN` - Alternative to --token
- `ALERT_EMAIL` - Alternative to --email
- `MONITORING_INTERVAL` - Alternative to --interval

### Enhanced Features:
- **Non-interactive mode**: Fully automated setup without prompts
- **Configurable monitoring interval**: Customizable cron job frequency
- **Selective component setup**: Skip dashboard or performance testing as needed
- **URL validation**: Automatic validation of production URL format
- **Health check integration**: Immediate validation of bot availability

### Usage Examples:
```bash
# Basic monitoring setup
./scripts/monitoring-setup.sh --url https://abc123.supabase.co/functions/v1/telegram-bot

# Complete setup with alerts
./scripts/monitoring-setup.sh -u https://abc123.supabase.co/functions/v1/telegram-bot -t 123456:ABC-DEF -e admin@example.com

# Custom monitoring interval
./scripts/monitoring-setup.sh --url https://abc123.supabase.co/functions/v1/telegram-bot --interval 10

# Automated setup (CI/CD friendly)
./scripts/monitoring-setup.sh --url https://abc123.supabase.co/functions/v1/telegram-bot --non-interactive --no-performance

# Minimal setup
./scripts/monitoring-setup.sh --url https://abc123.supabase.co/functions/v1/telegram-bot --no-dashboard --no-performance
```

## Benefits

### For Development:
- **Quick testing**: Dry-run mode for validation without side effects
- **Debugging**: Verbose mode with detailed execution logging
- **Flexibility**: Skip components based on development needs

### For Production:
- **Automation ready**: Non-interactive modes for CI/CD pipelines
- **Secure configuration**: Environment variable support for secrets
- **Reliable deployment**: Comprehensive validation and error handling

### For Operations:
- **Customizable monitoring**: Configurable intervals and alert settings
- **Selective setup**: Choose only needed monitoring components
- **Easy maintenance**: Clear help documentation and examples

## Implementation Quality
- ✅ **POSIX compliant**: Works across different shell environments
- ✅ **Error handling**: Comprehensive validation and helpful messages
- ✅ **Documentation**: Built-in help with examples
- ✅ **Backwards compatible**: Maintains existing interactive functionality
- ✅ **Security conscious**: Masks sensitive tokens in verbose output
- ✅ **CI/CD ready**: Non-interactive modes for automation

Both scripts now provide enterprise-grade flexibility while maintaining ease of use for developers and operators.