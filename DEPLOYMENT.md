# Deployment Guide

Step-by-step instructions for deploying the Porch Potty Creator System.

---

## Prerequisites

- Node.js 20+
- Supabase project (with database and Edge Functions enabled)
- Supabase CLI installed (`npm install -g supabase`)
- Resend account (for transactional email)
- Sentry account (for error monitoring — optional)

---

## 1. Environment Variables

### Client-side (.env)

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_ADMIN_PASSWORD="your-admin-password"
VITE_SENTRY_DSN="your-sentry-dsn"  # optional
```

### Edge Function Secrets (set via Supabase CLI)

```bash
# Email sending
supabase secrets set RESEND_API_KEY=re_your_api_key
supabase secrets set EMAIL_FROM="Porch Potty <creators@porchpotty.com>"

# Shopify sync (Client Credentials OAuth — no static token needed)
supabase secrets set SHOPIFY_STORE_URL=https://your-store.myshopify.com
supabase secrets set SHOPIFY_CLIENT_ID=your_client_id
supabase secrets set SHOPIFY_CLIENT_SECRET=your_client_secret
```

---

## 2. Database Setup

### Apply Migrations

Migrations are in `supabase/migrations/`. Apply them in order:

```bash
supabase db push
```

Or apply individually:
```bash
supabase migration up
```

### Key Migrations

| Migration | Purpose |
|-----------|---------|
| 001-009 | Core tables (creators, content_submissions, performance_records, notifications, sync_logs) |
| 010 | system_settings (configurable thresholds) |
| 011 | audit_logs (admin action tracking) |
| 012 | dismissed_duplicate_ids column on creators |
| 013 | creator_briefs (product-specific guidelines, seeded for 6 products) |
| 014 | email_log (email send tracking) |
| 015 | admin_roles (RBAC foundation) |
| 016 | Enable Supabase Realtime on notifications table |

### Enable Realtime

Migration 016 runs `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`. Verify it was applied:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

The `notifications` table should appear in the results.

### Scheduled Sync (Optional)

Migration 017 contains a pg_cron SQL template. To enable daily Shopify sync:

1. Enable the `pg_cron` extension in Supabase Dashboard > Database > Extensions
2. Run in SQL Editor:

```sql
SELECT cron.schedule(
  'daily-shopify-sync',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/shopify-sync',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := concat('{"periodStart": "', (current_date - interval '2 days')::date, '", "periodEnd": "', current_date, '"}')::jsonb
  )
  $$
);
```

### Admin Roles RLS

The default `admin_roles` RLS policy allows any authenticated user to write. For production, restrict writes to service role:

```sql
DROP POLICY "Authenticated users can manage roles" ON admin_roles;

CREATE POLICY "Service role can manage roles"
  ON admin_roles FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Authenticated users can read roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (true);
```

---

## 3. Deploy Edge Functions

```bash
# Email sending
supabase functions deploy send-email

# Shopify sync
supabase functions deploy shopify-sync
```

Verify deployment:
```bash
supabase functions list
```

---

## 4. Build and Deploy Frontend

```bash
npm install
npm run build
```

The built files are in `dist/`. Deploy to your hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

---

## 5. Post-Deploy Verification

1. **Application form** — Submit a test application at `/apply`
2. **Admin login** — Log in at `/admin/login`
3. **Dashboard** — Verify analytics charts render at `/admin/dashboard`
4. **Approve a creator** — Verify onboarding email is sent (check email_log table)
5. **Shopify sync** — Trigger manual sync at `/admin/sync`, verify results
6. **Notifications** — Verify realtime updates appear in the bell icon
7. **Settings** — Verify settings save and persist at `/admin/settings`

---

## 6. CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml` runs:
- TypeScript type check
- Unit tests (40 tests)
- Production build

To enable:
1. Go to repo Settings > Actions > General
2. Set GitHub Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check `send-email` Edge Function is deployed + RESEND_API_KEY secret is set |
| Realtime not working | Verify migration 016 applied: `SELECT * FROM pg_publication_tables` |
| Shopify sync fails | Check SHOPIFY_STORE_URL, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET secrets |
| Sentry not reporting | Check VITE_SENTRY_DSN is set in .env |
| Build fails | Run `npx tsc --noEmit` to check for type errors |
