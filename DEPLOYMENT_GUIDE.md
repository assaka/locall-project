# Production Deployment Guide

## 🚀 Deployment Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Supabase account and project setup
- [ ] Stripe account with API keys
- [ ] Domain/hosting platform (Vercel recommended)

### 1. Environment Setup

#### Copy Environment Variables
```bash
cp .env.example .env.local
```

#### Required Environment Variables
```bash
# Core Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_your_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OAuth Integrations
HUBSPOT_CLIENT_ID=your_hubspot_client_id
HUBSPOT_CLIENT_SECRET=your_hubspot_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALENDLY_CLIENT_ID=your_calendly_client_id
CALENDLY_CLIENT_SECRET=your_calendly_client_secret

# Security
API_SECRET=your_strong_api_secret
JWT_SECRET=your_jwt_secret

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### 2. Database Setup

#### Run SQL Migrations in Supabase
Execute these files in order in your Supabase SQL Editor:

1. **User Setup** (`sql/user.sql`)
2. **Feature Tables** (`sql/feature_tables.sql`)
3. **RLS Policies** (`sql/RLSpolicy.sql`)
4. **Multi-tenancy** (`sql/supabase-multitenancy.sql`)

#### Verify Tables Created
Ensure these tables exist:
- `oauth_connections`
- `loyalty_programs`
- `referral_codes`
- `referrals`
- `loyalty_transactions`
- `webform_configs`
- `webform_submissions`
- `billing_customers`
- `billing_subscriptions`
- `billing_invoices`
- `usage_records`

### 3. OAuth App Registration

#### HubSpot Setup
1. Go to HubSpot Developer Portal
2. Create new app
3. Add redirect URI: `https://yourdomain.com/api/oauth/callback/hubspot`
4. Note Client ID and Secret

#### Google Setup
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://yourdomain.com/api/oauth/callback/google`
4. Enable Calendar API
5. Note Client ID and Secret

#### Calendly Setup
1. Go to Calendly Developer Portal
2. Create new app
3. Add redirect URI: `https://yourdomain.com/api/oauth/callback/calendly`
4. Note Client ID and Secret

### 4. Stripe Configuration

#### Webhook Setup
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.created`
   - `customer.updated`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.deleted`
   - `invoice.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_method.attached`
4. Note webhook signing secret

### 5. Build and Deploy

#### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

#### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm start
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Deploy to Other Platforms
- **Netlify**: Connect GitHub repo, set build command to `npm run build`
- **AWS Amplify**: Connect repo, configure build settings
- **Docker**: Use provided Dockerfile

### 6. Post-Deployment Verification

#### Test Core Features
- [ ] Dashboard loads without errors
- [ ] OAuth integrations work
- [ ] Loyalty program creation
- [ ] Webform tracking
- [ ] Billing subscription flow
- [ ] API endpoints respond correctly

#### Test URLs
- Dashboard: `https://yourdomain.com/dashboard`
- Integrations: `https://yourdomain.com/dashboard/integrations`
- Loyalty: `https://yourdomain.com/dashboard/loyalty`
- Webforms: `https://yourdomain.com/dashboard/webforms`
- Billing: `https://yourdomain.com/dashboard/billing`
- Admin: `https://yourdomain.com/dashboard/admin`

#### API Health Check
Test these endpoints:
- `GET /api/health` - Health check
- `GET /api/oauth/sync` - OAuth status
- `GET /api/loyalty/programs` - Loyalty programs
- `GET /api/webforms/analytics` - Webform analytics
- `GET /api/billing/customer` - Billing status

### 7. Monitoring and Maintenance

#### Error Monitoring
Set up error tracking with:
- Sentry
- LogRocket
- Datadog

#### Performance Monitoring
Monitor:
- API response times
- Database query performance
- Frontend loading times
- Conversion rates

#### Security Monitoring
- API rate limiting
- Fraud detection alerts
- OAuth token refresh
- Webhook signature validation

### 8. Scaling Considerations

#### Database Optimization
- Index frequently queried columns
- Implement read replicas
- Set up connection pooling

#### API Rate Limiting
- Implement Redis for rate limiting
- Set up API quotas
- Monitor usage patterns

#### CDN and Caching
- Use Vercel Edge Network
- Implement static asset caching
- Set up API response caching

### 9. Backup and Recovery

#### Database Backups
- Enable Supabase automatic backups
- Set up point-in-time recovery
- Test restore procedures

#### Code Backup
- Maintain Git repository
- Tag production releases
- Document deployment procedures

### 10. Troubleshooting

#### Common Issues

**OAuth Redirect Mismatch**
- Verify redirect URIs match exactly
- Check protocol (http vs https)
- Ensure domain matches

**Stripe Webhook Failures**
- Verify webhook URL is accessible
- Check webhook signing secret
- Monitor webhook delivery logs

**Database Connection Issues**
- Verify Supabase connection string
- Check service role key permissions
- Monitor connection pool usage

**Build Failures**
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify environment variables

#### Support Resources
- Supabase Documentation
- Stripe API Reference
- Next.js Deployment Guide
- OAuth Provider Documentation

## ✅ Production Ready Checklist

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] OAuth apps registered and configured
- [ ] Stripe webhooks set up
- [ ] Production build successful
- [ ] All features tested
- [ ] Error monitoring configured
- [ ] Security measures implemented
- [ ] Backup procedures established
- [ ] Performance optimized

## 🎉 Go Live!

Your Locall platform is now ready for production with:
- ✅ Advanced OAuth integrations
- ✅ Complete loyalty and referral system
- ✅ Comprehensive webform tracking
- ✅ Full billing and subscription management
- ✅ Real-time analytics and monitoring
- ✅ Enterprise-grade security features

Happy deploying! 🚀
