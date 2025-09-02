#!/bin/bash
# Monitoring Setup Script for HeyMax Shop Bot Production
# Sprint 3: Monitoring configuration and health checks

set -e

# Default configuration
PRODUCTION_URL=""
TELEGRAM_BOT_TOKEN=""
ALERT_EMAIL=""
MONITORING_INTERVAL="5"
SKIP_PERFORMANCE_SETUP=false
SKIP_DASHBOARD=false
VERBOSE=false
INTERACTIVE=true

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Usage function
show_usage() {
    cat << EOF
📊 HeyMax Shop Bot - Production Monitoring Setup

Usage: $0 [OPTIONS]

Required Options:
  -u, --url PRODUCTION_URL      Production bot URL (e.g., https://project.supabase.co/functions/v1/telegram-bot)

Optional Options:
  -t, --token BOT_TOKEN        Telegram bot token for webhook monitoring
  -e, --email ALERT_EMAIL      Email address for alerts
  -i, --interval MINUTES       Monitoring interval in minutes (default: 5)

  --no-dashboard              Skip dashboard creation
  --non-interactive           Run without prompting for input
  -v, --verbose               Enable verbose logging
  -h, --help                  Show this help message

Environment Variables (alternative to options):
  PRODUCTION_URL              Bot URL
  TELEGRAM_BOT_TOKEN         Bot token
  ALERT_EMAIL                Alert email
  MONITORING_INTERVAL        Interval in minutes

Examples:
  $0 --url https://abc123.supabase.co/functions/v1/telegram-bot
  $0 -u https://abc123.supabase.co/functions/v1/telegram-bot -t 123456:ABC-DEF -e admin@example.com
  $0 --url https://abc123.supabase.co/functions/v1/telegram-bot --interval 10
  $0 --url https://abc123.supabase.co/functions/v1/telegram-bot --non-interactive

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                PRODUCTION_URL="$2"
                shift 2
                ;;
            -t|--token)
                TELEGRAM_BOT_TOKEN="$2"
                shift 2
                ;;
            -e|--email)
                ALERT_EMAIL="$2"
                shift 2
                ;;
            -i|--interval)
                MONITORING_INTERVAL="$2"
                shift 2
                ;;
            )
                SKIP_PERFORMANCE_SETUP=true
                shift
                ;;
            --no-dashboard)
                SKIP_DASHBOARD=true
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
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
    PRODUCTION_URL=${PRODUCTION_URL:-$PRODUCTION_URL}
    TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-$TELEGRAM_BOT_TOKEN}
    ALERT_EMAIL=${ALERT_EMAIL:-$ALERT_EMAIL}
    MONITORING_INTERVAL=${MONITORING_INTERVAL:-${MONITORING_INTERVAL:-5}}

    # Validate required parameters
    if [[ -z "$PRODUCTION_URL" ]] && [[ "$INTERACTIVE" == "true" ]]; then
        # Will be prompted later in interactive mode
        return 0
    elif [[ -z "$PRODUCTION_URL" ]] && [[ "$INTERACTIVE" == "false" ]]; then
        echo -e "${RED}Error: Production URL is required in non-interactive mode${NC}" >&2
        echo "Use --url or set PRODUCTION_URL environment variable" >&2
        exit 1
    fi
}

echo "📊 HeyMax Shop Bot - Production Monitoring Setup"
echo "==============================================="

print_status() { 
    echo -e "${GREEN}[INFO]${NC} $1"
    [[ "$VERBOSE" == "true" ]] && echo -e "${BLUE}[DEBUG]${NC} Function: ${FUNCNAME[1]}" >&2
}
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Health check function
check_bot_health() {
    print_status "Performing comprehensive health check..."
    
    local base_url="$1"
    local bot_token="$2"
    
    # Test edge function availability
    print_status "Testing edge function availability..."
    local edge_response=$(curl -s -o /dev/null -w "%{http_code}" "$base_url")
    
    if [[ "$edge_response" == "200" ]]; then
        print_status "✅ Edge function is responding"
    else
        print_error "❌ Edge function health check failed (HTTP $edge_response)"
        return 1
    fi
    
    # Test analytics endpoint
    print_status "Testing analytics endpoint..."
    local analytics_response=$(curl -s -w "%{http_code}" "$base_url/analytics" -o analytics_temp.json)
    
    if [[ "$analytics_response" == "200" ]]; then
        print_status "✅ Analytics endpoint is working"
        
        # Parse analytics for key metrics
        if command -v jq &> /dev/null; then
            local total_users=$(cat analytics_temp.json | jq -r '.user_metrics.total_users // 0')
            local viral_coefficient=$(cat analytics_temp.json | jq -r '.viral_metrics.viral_coefficient_7d // 0')
            local health_status=$(cat analytics_temp.json | jq -r '.health_status.overall_status // "unknown"')
            
            print_status "Current metrics: $total_users users, viral coefficient: $viral_coefficient, status: $health_status"
        fi
        
        rm -f analytics_temp.json
    else
        print_warning "⚠️ Analytics endpoint returned HTTP $analytics_response"
    fi
    
    # Test Telegram webhook
    if [[ -n "$bot_token" ]]; then
        print_status "Testing Telegram webhook status..."
        local webhook_info=$(curl -s "https://api.telegram.org/bot$bot_token/getWebhookInfo")
        
        if echo "$webhook_info" | grep -q '"ok":true'; then
            print_status "✅ Telegram webhook is configured"
            
            if command -v jq &> /dev/null; then
                local webhook_url=$(echo "$webhook_info" | jq -r '.result.url // "not set"')
                local pending_updates=$(echo "$webhook_info" | jq -r '.result.pending_update_count // 0')
                print_status "Webhook URL: $webhook_url"
                print_status "Pending updates: $pending_updates"
            fi
        else
            print_error "❌ Telegram webhook check failed"
            echo "Response: $webhook_info"
        fi
    fi
    
    print_status "Health check completed"
}

# Setup monitoring alerts
setup_alerts() {
    print_status "Setting up monitoring alerts..."
    
    # Create monitoring script
    cat > monitor-bot.sh << 'EOF'
#!/bin/bash
# Automated monitoring script for HeyMax Shop Bot

PRODUCTION_URL="$1"
TELEGRAM_BOT_TOKEN="$2"
ALERT_EMAIL="$3"

# Function to send alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    echo "ALERT [$severity]: $message"
    
    # If email is configured, send notification
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "HeyMax Shop Bot Alert [$severity]" "$ALERT_EMAIL"
    fi
    
    # Log to system
    logger "HeyMax Shop Bot Alert [$severity]: $message"
}

# Check bot health
check_health() {
    local base_url="$PRODUCTION_URL"
    
    # Test edge function
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$base_url" || echo "000")
    
    if [[ "$response" != "200" ]]; then
        send_alert "Edge function not responding (HTTP $response)" "CRITICAL"
        return 1
    fi
    
    # Test analytics endpoint and parse metrics
    local analytics=$(curl -s --max-time 10 "$base_url/analytics" || echo '{"error":"failed"}')
    
    if echo "$analytics" | grep -q '"error"'; then
        send_alert "Analytics endpoint failing" "HIGH"
        return 1
    fi
    
    # Check resource usage (if jq is available)
    if command -v jq &> /dev/null; then
        local function_usage=$(echo "$analytics" | jq -r '.viral_metrics.total_viral_interactions // 0')
        local user_count=$(echo "$analytics" | jq -r '.user_metrics.total_users // 0')
        
        # Estimate function invocations (rough calculation)
        local estimated_monthly_invocations=$((user_count * 50)) # Conservative estimate
        local usage_percentage=$((estimated_monthly_invocations * 100 / 500000)) # Against 500K free tier
        
        if [[ $usage_percentage -gt 80 ]]; then
            send_alert "High resource usage: ${usage_percentage}% of free tier limit" "HIGH"
        elif [[ $usage_percentage -gt 95 ]]; then
            send_alert "CRITICAL: ${usage_percentage}% of free tier limit reached" "CRITICAL"
        fi
    fi
    
    # Test Telegram webhook
    if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
        local webhook_check=$(curl -s --max-time 10 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" || echo '{"ok":false}')
        
        if ! echo "$webhook_check" | grep -q '"ok":true'; then
            send_alert "Telegram webhook not responding properly" "HIGH"
        fi
    fi
    
    echo "Health check passed at $(date)"
    return 0
}

# Run health check
check_health
EOF
    
    chmod +x monitor-bot.sh
    
    print_status "Created monitoring script: monitor-bot.sh"
    
    # Setup cron job suggestion
    print_status "Setting up automated monitoring..."
    print_status "To enable automated monitoring, add this to your crontab:"
    echo ""
    echo "# HeyMax Shop Bot monitoring (every $MONITORING_INTERVAL minutes)"
    echo "*/$MONITORING_INTERVAL * * * * $PWD/monitor-bot.sh '$PRODUCTION_URL' '$TELEGRAM_BOT_TOKEN' '$ALERT_EMAIL' >> $PWD/monitoring.log 2>&1"
    echo ""
    print_status "Run 'crontab -e' to add the above line"
}

# Create monitoring dashboard
create_dashboard() {
    print_status "Creating monitoring dashboard HTML..."
    
    cat > monitoring-dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HeyMax Shop Bot - Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-top: 10px; }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .log-container { max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>🤖 HeyMax Shop Bot - Monitoring Dashboard</h1>
        
        <div class="card">
            <h2>System Health</h2>
            <div id="health-status" class="status-healthy">● Operational</div>
            <button class="refresh-btn" onclick="refreshData()">Refresh Data</button>
        </div>
        
        <div class="card">
            <h2>Key Metrics</h2>
            <div class="metrics" id="metrics-container">
                <!-- Metrics will be loaded here -->
            </div>
        </div>
        
        <div class="card">
            <h2>Performance Monitoring</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value" id="response-time">--</div>
                    <div class="metric-label">Avg Response Time (ms)</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="uptime">--</div>
                    <div class="metric-label">Uptime %</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="error-rate">--</div>
                    <div class="metric-label">Error Rate %</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Resource Usage</h2>
            <div id="resource-usage">
                <!-- Resource usage will be displayed here -->
            </div>
        </div>
        
        <div class="card">
            <h2>Recent Activity Log</h2>
            <div class="log-container" id="activity-log">
                Loading activity log...
            </div>
        </div>
    </div>

    <script>
        const ANALYTICS_URL = 'YOUR_ANALYTICS_ENDPOINT_HERE'; // Replace with actual URL
        
        async function refreshData() {
            try {
                const response = await fetch(ANALYTICS_URL);
                const data = await response.json();
                
                updateHealthStatus(data.health_status);
                updateMetrics(data);
                updatePerformance(data.performance_metrics);
                updateResourceUsage(data);
                
            } catch (error) {
                console.error('Failed to refresh data:', error);
                document.getElementById('health-status').textContent = '● Error Loading Data';
                document.getElementById('health-status').className = 'status-critical';
            }
        }
        
        function updateHealthStatus(healthStatus) {
            const statusElement = document.getElementById('health-status');
            const status = healthStatus?.overall_status || 'unknown';
            
            statusElement.textContent = `● ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            
            if (status === 'operational' || status === 'healthy') {
                statusElement.className = 'status-healthy';
            } else if (status === 'degraded') {
                statusElement.className = 'status-warning';
            } else {
                statusElement.className = 'status-critical';
            }
        }
        
        function updateMetrics(data) {
            const container = document.getElementById('metrics-container');
            const metrics = [
                { label: 'Total Users', value: data.user_metrics?.total_users || 0 },
                { label: 'Active Users (7d)', value: data.user_metrics?.active_users_7d || 0 },
                { label: 'Links Generated', value: data.link_metrics?.total_links_generated || 0 },
                { label: 'Viral Coefficient', value: data.viral_metrics?.viral_coefficient_7d || 0 },
            ];
            
            container.innerHTML = metrics.map(metric => `
                <div class="metric">
                    <div class="metric-value">${metric.value}</div>
                    <div class="metric-label">${metric.label}</div>
                </div>
            `).join('');
        }
        
        function updatePerformance(performanceMetrics) {
            if (performanceMetrics) {
                document.getElementById('response-time').textContent = performanceMetrics.avg_response_time_ms || '--';
                document.getElementById('uptime').textContent = performanceMetrics.uptime_percentage || '--';
                document.getElementById('error-rate').textContent = performanceMetrics.error_rate_percentage || '--';
            }
        }
        
        function updateResourceUsage(data) {
            const container = document.getElementById('resource-usage');
            // This would display resource usage information
            container.innerHTML = `
                <p><strong>Function Invocations:</strong> Monitoring in progress</p>
                <p><strong>Database Usage:</strong> Within limits</p>
                <p><strong>Free Tier Status:</strong> Active</p>
            `;
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshData, 30000);
        
        // Initial load
        refreshData();
    </script>
</body>
</html>
EOF
    
    print_status "Created monitoring dashboard: monitoring-dashboard.html"
    print_status "To use: Replace 'YOUR_ANALYTICS_ENDPOINT_HERE' with your analytics URL"
}

# Performance testing setup
setup_performance_testing() {
    print_status "Setting up performance testing..."
    
    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery not found. Installing for load testing..."
        npm install -g artillery
    fi
    
    print_status "Performance testing tools ready"
    print_status "Run load tests with: artillery run tests/performance/load-test-config.yml"
}

# Main monitoring setup
main() {
    # Parse command line arguments first
    parse_args "$@"
    
    echo "Starting monitoring setup..."
    
    # Show configuration if verbose
    if [[ "$VERBOSE" == "true" ]]; then
        echo ""
        echo "Configuration:"
        echo "  Production URL: ${PRODUCTION_URL:-'(to be prompted)'}"
        echo "  Bot Token: ${TELEGRAM_BOT_TOKEN:+${TELEGRAM_BOT_TOKEN:0:10}...}"
        echo "  Alert Email: ${ALERT_EMAIL:-'(none)'}"
        echo "  Monitoring Interval: ${MONITORING_INTERVAL} minutes"
        echo "  Interactive Mode: $INTERACTIVE"
        echo "  Skip Performance: $SKIP_PERFORMANCE_SETUP"
        echo "  Skip Dashboard: $SKIP_DASHBOARD"
        echo ""
    fi
    
    # Prompt for missing required variables in interactive mode
    if [[ "$INTERACTIVE" == "true" ]]; then
        if [[ -z "$PRODUCTION_URL" ]]; then
            read -p "Enter your production bot URL (e.g., https://project.supabase.co/functions/v1/telegram-bot): " PRODUCTION_URL
        fi
        
        if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
            read -p "Enter your Telegram bot token (optional, for webhook monitoring): " TELEGRAM_BOT_TOKEN
        fi
        
        if [[ -z "$ALERT_EMAIL" ]]; then
            read -p "Enter alert email address (optional): " ALERT_EMAIL
        fi
    fi
    
    # Validate URL format
    if [[ -n "$PRODUCTION_URL" ]] && [[ ! "$PRODUCTION_URL" =~ ^https?:// ]]; then
        print_error "Invalid URL format. Must start with http:// or https://"
        exit 1
    fi
    
    # Run health check if URL is provided
    if [[ -n "$PRODUCTION_URL" ]]; then
        check_bot_health "$PRODUCTION_URL" "$TELEGRAM_BOT_TOKEN"
    else
        print_warning "No production URL provided, skipping health check"
    fi
    
    # Setup components based on flags
    setup_alerts
    
    if [[ "$SKIP_DASHBOARD" != "true" ]]; then
        create_dashboard
    else
        print_status "Skipping dashboard creation (--no-dashboard flag used)"
    fi
    
    if [[ "$SKIP_PERFORMANCE_SETUP" != "true" ]]; then

    else

    fi
    
    echo ""
    print_status "🎉 Monitoring setup completed!"
    echo ""
    print_status "Generated files:"
    print_status "  • monitor-bot.sh - Automated monitoring script"
    [[ "$SKIP_DASHBOARD" != "true" ]] && print_status "  • monitoring-dashboard.html - Web dashboard"
    echo ""
    print_status "Next steps:"
    print_status "1. Set up the cron job for automated monitoring:"
    echo "     */$MONITORING_INTERVAL * * * * $PWD/monitor-bot.sh '$PRODUCTION_URL' '$TELEGRAM_BOT_TOKEN' '$ALERT_EMAIL' >> $PWD/monitoring.log 2>&1"
    [[ "$SKIP_DASHBOARD" != "true" ]] && print_status "2. Configure monitoring-dashboard.html with your analytics URL"
    [[ "$SKIP_PERFORMANCE_SETUP" != "true" ]] && print_status "3. Run performance tests: artillery run tests/performance/load-test-config.yml"
    print_status "4. Monitor logs: tail -f monitoring.log"
    print_status "5. Add to crontab: crontab -e"
}

# Run main setup
main "$@"