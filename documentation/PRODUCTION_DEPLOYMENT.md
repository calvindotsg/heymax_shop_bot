# HeyMax Shop Bot - Production Deployment

## Deployment Information
- **Deployed**: Fri 29 Aug 2025 16:11:33 +08
- **Project ID**: dajqynmonepfnccepdmi
- **Edge Function URL**: https://dajqynmonepfnccepdmi.supabase.co/functions/v1/telegram-bot
- **Analytics URL**: https://dajqynmonepfnccepdmi.supabase.co/functions/v1/telegram-bot/analytics

## Environment Configuration
- Environment: production
- Log Level: info
- Database: PostgreSQL (Supabase managed)

## Monitoring & Maintenance
- Supabase Dashboard: https://app.supabase.com/project/dajqynmonepfnccepdmi
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
