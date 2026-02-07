# Deployment Guide

This project is optimized for deployment on **Vercel**, which provides built-in support for Next.js App Router and edge functions.

## Production Requirements

1.  **Vercel Account**: A Pro or Enterprise team account is recommended for production workloads.
2.  **Supabase Project**: A dedicated production project (separate from dev).
3.  **Domain Names**: 
    - Primary: `krishnaconnect.in`
    - Secondary: `chat.krishnaconsciousnesssociety.com`

## Environment Variables

Ensure the following variables are set in the Vercel Project Settings:

### Required Variables
| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your production Supabase instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public "anon" API key for Supabase. |

### Optional Variables
| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for AI-powered features. |
| `NEXT_PUBLIC_GIPHY_API_KEY` | Giphy API key for GIF integration in posts and messages. |
| `NEXT_PUBLIC_ENABLE_MONETIZATION` | Enable monetization features (true/false). Default: false. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Google AdSense client ID (required if monetization enabled). |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for web push notifications. |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push notifications (server-side only). |

> **Security Note:** Never expose the Supabase `service_role` key or the `VAPID_PRIVATE_KEY` in client-side environment variables. Use `NEXT_PUBLIC_` prefix only for client-accessible variables.

## Deployment Steps

1.  **Push to `main`**: Ensure all code is reviewed and merged into the `main` branch.
2.  **Automatic Build**: Vercel will detect the commit and start a build automatically.
3.  **Build Process**:
    -   Next.js compilation and optimization
    -   Static page generation
    -   API routes bundling
    -   Service worker generation for PWA
4.  **Verification**:
    -   Check the "Deployments" tab in Vercel.
    -   Verify that build logs show no errors.
    -   Test the preview URL before promoting if using a staging workflow.
    -   Verify PWA manifest and service worker are properly deployed.
    -   Test push notification functionality.
5.  **Production Promotion**: Once verified, promote the deployment to production domains.

## Post-Deployment Checklist

- [ ] Verify all environment variables are correctly set
- [ ] Test authentication (email/password and OAuth)
- [ ] Test real-time messaging functionality
- [ ] Verify push notifications are working
- [ ] Check PWA installation on mobile and desktop
- [ ] Test image uploads and media sharing
- [ ] Verify AI features (if Gemini key is set)
- [ ] Test GIF integration (if Giphy key is set)
- [ ] Check analytics tracking
- [ ] Verify SSL certificates and HTTPS
- [ ] Test all critical user flows

## Database Migrations

When deploying code that requires schema changes:
1.  Run the necessary SQL migration scripts in the **production** Supabase SQL Editor in chronological order:
    - `supabase/migrations/01_Schema.sql` - Base database schema
    - `supabase/migrations/02_RLS.sql` - Row Level Security policies
    - `supabase/migrations/03_Functions_Triggers.sql` - Stored procedures and triggers
    - `supabase/migrations/20260124_add_settings_to_profiles.sql` - Profile settings
    - `supabase/migrations/20260124_privacy_protocols.sql` - Privacy features
    - `supabase/migrations/20260202_create_missing_tables.sql` - Additional tables
    - `supabase/migrations/20260206_fix_posts_updated_at.sql` - Post timestamp fix
    - `supabase/migrations/20260206_pinned_posts.sql` - Pinned posts feature
    - Any additional migration files as they are added
2.  Verify no breaking changes (e.g., column renames) affect the currently live app before the new code is deployed.
3.  Test RLS policies in a staging environment first.
4.  Back up the production database before running migrations.

## PWA Configuration

The application is configured as a Progressive Web App:
- **Manifest**: `/public/manifest.json` defines app metadata, icons, and display settings
- **Service Worker**: `/public/service-worker.js` handles caching and offline functionality
- **Icons**: Multiple sizes available in `/public/icons/` for various devices
- **Install Prompt**: Users can install the app from their browser

To verify PWA:
1. Open Chrome DevTools → Application tab
2. Check Manifest and Service Workers sections
3. Run Lighthouse PWA audit
4. Test "Add to Home Screen" functionality

## Monitoring & Analytics

### Vercel Analytics
- Automatically enabled for deployed apps
- Track page views, user sessions, and performance metrics
- Access via Vercel Dashboard → Analytics

### Vercel Speed Insights
- Real User Monitoring (RUM) for Core Web Vitals
- Tracks LCP, FID, CLS, and other performance metrics
- Access via Vercel Dashboard → Speed Insights

### Error Tracking
- Check Vercel Function Logs for API route errors
- Monitor Supabase Dashboard for database errors
- Set up alerts for critical errors

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` or expose sensitive keys
2. **RLS Policies**: Always test in staging before production
3. **OAuth Callbacks**: Ensure callback URLs are whitelisted in OAuth providers
4. **CORS**: Configure properly for API routes
5. **Rate Limiting**: Consider implementing rate limiting for API routes
6. **VAPID Keys**: Keep private key secure and never expose client-side
