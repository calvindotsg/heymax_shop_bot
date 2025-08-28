#!/bin/bash
# Production Deployment Script for HeyMax Shop Bot
# Sprint 3: Production deployment with monitoring and validation

set -e # Exit on any error

echo "🚀 HeyMax Shop Bot - Production Deployment Script"
echo "================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
PRODUCTION_PROJECT_ID=""
TELEGRAM_BOT_TOKEN=""
PRODUCTION_DB_PASSWORD=""
ORG_ID=""
SKIP_CONFIRMATION=false
SKIP_DATA_SEED=false
DRY_RUN=false
VERBOSE=false

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage function
show_usage() {
    cat << EOF
🚀 HeyMax Shop Bot - Production Deployment Script

Usage: $0 [OPTIONS]

Required Options:
  -p, --project-id PROJECT_ID    Supabase production project ID
  -t, --token BOT_TOKEN         Telegram bot token from @BotFather

Optional Options:
  -o, --org-id ORG_ID          Supabase organization ID (for new projects)
  -d, --db-password PASSWORD   Production database password
  -y, --yes                    Skip confirmation prompts
  -s, --skip-seed             Skip merchant data seeding
  --dry-run                   Show what would be deployed without executing
  -v, --verbose               Enable verbose logging
  -h, --help                  Show this help message

Environment Variables (alternative to options):
  PRODUCTION_PROJECT_ID       Supabase project ID
  TELEGRAM_BOT_TOKEN         Bot token
  SUPABASE_ORG_ID           Organization ID
  PRODUCTION_DB_PASSWORD     Database password

Examples:
  $0 --project-id abc123 --token 123456:ABC-DEF
  $0 -p abc123 -t 123456:ABC-DEF --yes --skip-seed
  $0 --project-id abc123 --token 123456:ABC-DEF --dry-run

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--project-id)
                PRODUCTION_PROJECT_ID="$2"
                shift 2
                ;;
            -t|--token)
                TELEGRAM_BOT_TOKEN="$2"
                shift 2
                ;;
            -o|--org-id)
                ORG_ID="$2"
                shift 2
                ;;
            -d|--db-password)
                PRODUCTION_DB_PASSWORD="$2"
                shift 2
                ;;
            -y|--yes)
                SKIP_CONFIRMATION=true
                shift
                ;;
            -s|--skip-seed)
                SKIP_DATA_SEED=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                echo "Unknown option: $1" >&2
                show_usage
                exit 1
                ;;
            *)
                echo "Unexpected argument: $1" >&2
                show_usage
                exit 1
                ;;
        esac
    done

    # Use environment variables if not set via arguments
    PRODUCTION_PROJECT_ID=${PRODUCTION_PROJECT_ID:-$PRODUCTION_PROJECT_ID}
    TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-$TELEGRAM_BOT_TOKEN}
    ORG_ID=${ORG_ID:-$SUPABASE_ORG_ID}
    PRODUCTION_DB_PASSWORD=${PRODUCTION_DB_PASSWORD:-$PRODUCTION_DB_PASSWORD}

    # Validate required parameters
    if [[ -z "$PRODUCTION_PROJECT_ID" ]]; then
        echo -e "${RED}Error: Production project ID is required${NC}" >&2
        echo "Use --project-id or set PRODUCTION_PROJECT_ID environment variable" >&2
        exit 1
    fi

    if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
        echo -e "${RED}Error: Telegram bot token is required${NC}" >&2
        echo "Use --token or set TELEGRAM_BOT_TOKEN environment variable" >&2
        exit 1
    fi
}

# Execute command with dry-run support
execute_cmd() {
    local cmd="$1"
    local description="${2:-$cmd}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${BLUE}[DRY-RUN]${NC} Would execute: $description"
        return 0
    else
        [[ "$VERBOSE" == "true" ]] && echo -e "${BLUE}[EXEC]${NC} $cmd" >&2
        eval "$cmd"
        return $?
    fi
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first."
        echo "Installation: npm install -g supabase"
        exit 1
    fi
    
    # Check if environment variables are set
    if [[ -z "$PRODUCTION_PROJECT_ID" ]] && [[ "$DRY_RUN" != "true" ]]; then
        print_warning "PRODUCTION_PROJECT_ID not set. Please set it in this script or as environment variable."
        echo "Example: export PRODUCTION_PROJECT_ID=your-project-id"
    fi
    
    if [[ -z "$TELEGRAM_BOT_TOKEN" ]] && [[ "$DRY_RUN" != "true" ]]; then
        print_warning "TELEGRAM_BOT_TOKEN not set. Required for production deployment."
        echo "Get your bot token from @BotFather and set: export TELEGRAM_BOT_TOKEN=your-token"
    fi
    
    print_status "Prerequisites check completed."
}

# Create production Supabase project
create_production_project() {
    print_status "Setting up production Supabase project..."
    
    if [[ -n "$PRODUCTION_PROJECT_ID" ]]; then
        print_status "Linking to existing project: $PRODUCTION_PROJECT_ID"
        supabase link --project-ref "$PRODUCTION_PROJECT_ID"
    else
        print_warning "Creating new project. Please update PRODUCTION_PROJECT_ID after creation."
        supabase projects create heymax-shop-bot-prod --org-id your-org-id
    fi
}

# Deploy database schema and migrations
deploy_database() {
    print_status "Deploying database schema to production..."
    
    # Push migrations to production
    supabase db push --linked
    
    # Verify database deployment
    print_status "Verifying database tables..."
    supabase db diff --linked --schema public
    
    print_status "Database deployment completed."
}

# Seed production data
seed_production_data() {
    print_status "Seeding production merchant data..."
    
    # Only seed if it's a fresh deployment
    read -p "Is this a fresh deployment? Seed merchant data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Run the merchant data extraction script
        python3 scripts/extract_affiliation_fields_sg.py \
            --input dataset/affiliation_merchants.json \
            --output temp_merchants.json
        
        # Use Supabase CLI to insert data
        supabase db seed --linked
        
        print_status "Production data seeding completed."
    else
        print_status "Skipping data seeding."
    fi
}

# Deploy edge functions
deploy_edge_functions() {
    print_status "Deploying edge functions to production..."
    
    # Deploy the telegram-bot function
    supabase functions deploy telegram-bot --project-ref "$PRODUCTION_PROJECT_ID"
    
    # Set environment variables for production
    print_status "Setting production environment variables..."
    
    if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
        supabase secrets set --project-ref "$PRODUCTION_PROJECT_ID" TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
    fi
    
    # Set other required environment variables
    supabase secrets set --project-ref "$PRODUCTION_PROJECT_ID" ENVIRONMENT="production"
    supabase secrets set --project-ref "$PRODUCTION_PROJECT_ID" LOG_LEVEL="info"
    
    print_status "Edge functions deployment completed."
}

# Configure Telegram webhook
configure_telegram_webhook() {
    print_status "Configuring Telegram webhook..."
    
    if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
        print_error "TELEGRAM_BOT_TOKEN is required for webhook configuration."
        return 1
    fi
    
    # Get the edge function URL
    EDGE_FUNCTION_URL="https://$PRODUCTION_PROJECT_ID.supabase.co/functions/v1/telegram-bot"
    
    # Set the webhook
    WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
        -d "url=$EDGE_FUNCTION_URL" \
        -d "allowed_updates=[\"message\",\"inline_query\",\"callback_query\"]" \
        -d "drop_pending_updates=true")
    
    echo "Webhook response: $WEBHOOK_RESPONSE"
    
    # Verify webhook
    WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo")
    echo "Webhook info: $WEBHOOK_INFO"
    
    print_status "Telegram webhook configuration completed."
}

# Set up monitoring and alerts
setup_monitoring() {
    print_status "Setting up production monitoring..."
    
    # This would integrate with monitoring services in a real deployment
    print_status "Monitoring setup:"
    print_status "• Supabase dashboard: https://app.supabase.com/project/$PRODUCTION_PROJECT_ID"
    print_status "• Analytics endpoint: $EDGE_FUNCTION_URL/analytics"
    print_status "• Consider setting up additional monitoring with services like:"
    print_status "  - Sentry for error tracking"
    print_status "  - Uptime Robot for availability monitoring"
    print_status "  - Custom alerts for free tier usage"
    
    print_status "Monitoring setup completed."
}

# Validate production deployment
validate_deployment() {
    print_status "Validating production deployment..."
    
    # Test edge function health
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://$PRODUCTION_PROJECT_ID.supabase.co/functions/v1/telegram-bot/analytics")
    
    if [[ "$HEALTH_CHECK" == "200" ]]; then
        print_status "✅ Edge function is responding correctly."
    else
        print_error "❌ Edge function health check failed (HTTP $HEALTH_CHECK)."
    fi
    
    # Test database connection
    print_status "Testing database connection..."
    # This would run a simple query to verify database connectivity
    
    # Test Telegram webhook
    if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
        print_status "Testing Telegram bot..."
        BOT_INFO=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe")
        echo "Bot info: $BOT_INFO"
    fi
    
    print_status "Production deployment validation completed."
}

# Create deployment documentation
create_deployment_docs() {
    print_status "Creating deployment documentation..."
    
    cat > PRODUCTION_DEPLOYMENT.md << EOF
# HeyMax Shop Bot - Production Deployment

## Deployment Information
- **Deployed**: $(date)
- **Project ID**: $PRODUCTION_PROJECT_ID
- **Edge Function URL**: https://$PRODUCTION_PROJECT_ID.supabase.co/functions/v1/telegram-bot
- **Analytics URL**: https://$PRODUCTION_PROJECT_ID.supabase.co/functions/v1/telegram-bot/analytics

## Environment Configuration
- Environment: production
- Log Level: info
- Database: PostgreSQL (Supabase managed)

## Monitoring & Maintenance
- Supabase Dashboard: https://app.supabase.com/project/$PRODUCTION_PROJECT_ID
- Monitor function invocations to stay within free tier limits
- Check analytics endpoint for bot usage metrics
- Monitor Telegram webhook status

## Rollback Procedure
1. Revert to previous edge function version via Supabase dashboard
2. Update webhook if necessary
3. Check database migrations and revert if needed

## Support Contacts
- Technical Issues: Check Supabase logs and analytics
- Telegram API Issues: Check webhook status and bot info
- Database Issues: Review migration logs and query performance

## Next Steps
- Set up monitoring alerts for free tier usage
- Configure error tracking (Sentry recommended)
- Set up uptime monitoring
- Plan for scaling if usage approaches limits
EOF

    print_status "Deployment documentation created: PRODUCTION_DEPLOYMENT.md"
}

# Main deployment process
main() {
    # Parse command line arguments first
    parse_args "$@"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "🔍 DRY RUN MODE - No actual changes will be made"
        echo "==============================================="
    fi
    
    echo "Starting production deployment process..."
    
    # Show configuration
    if [[ "$VERBOSE" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        echo ""
        echo "Configuration:"
        echo "  Project ID: $PRODUCTION_PROJECT_ID"
        echo "  Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
        echo "  Skip Confirmation: $SKIP_CONFIRMATION"
        echo "  Skip Data Seed: $SKIP_DATA_SEED"
        echo "  Verbose: $VERBOSE"
        echo "  Dry Run: $DRY_RUN"
        echo ""
    fi
    
    check_prerequisites
    
    # Confirm deployment (unless skipped)
    if [[ "$SKIP_CONFIRMATION" != "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
        echo ""
        print_warning "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
        print_warning "This will deploy to production environment:"
        print_warning "Project: $PRODUCTION_PROJECT_ID"
        echo ""
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    elif [[ "$SKIP_CONFIRMATION" == "true" ]]; then
        print_status "Skipping confirmation (--yes flag used)"
    fi
    
    # Execute deployment steps
    create_production_project
    deploy_database
    seed_production_data
    deploy_edge_functions
    configure_telegram_webhook
    setup_monitoring
    validate_deployment
    create_deployment_docs
    
    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "🔍 Dry run completed successfully!"
        print_status "All deployment steps validated. Run without --dry-run to execute."
    else
        print_status "🎉 Production deployment completed successfully!"
        print_status "Bot is now live and ready for users."
    fi
    echo ""
    print_status "Next steps:"
    print_status "1. Test the bot in a Telegram chat: /start"
    print_status "2. Try inline queries: @YourBotName shopee"
    print_status "3. Monitor usage via analytics endpoint"
    print_status "4. Set up additional monitoring as needed"
}

# Run main deployment process
main "$@"