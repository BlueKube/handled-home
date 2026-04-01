

## TestFlight Readiness — Lovable Actions

### What you need to do manually (Lovable Cloud UI)

**Add `handledhome://auth/callback` to auth redirect URLs:**
1. Open the backend settings (Cloud → Users → Auth Settings)
2. Add `handledhome://auth/callback` to the list of allowed redirect URLs
3. This allows email confirmation links to open correctly in the native app

### What I will do

**1. Fix build errors (required for TestFlight)**

Two TypeScript errors need fixing:

- `src/components/admin/billing/PayoutRolloverCard.tsx` line 26 — "Type instantiation is excessively deep" — likely a Supabase query type issue, fix with explicit type casting
- `src/pages/admin/LaunchReadiness.tsx` line 112 — `"byoc_invites"` not in allowed table union — the table name may have changed or needs to be added to a type

**2. Update TODO.md**
- Mark "Create app in App Store Connect" as `[x]` (done)
- Mark "Register bundle ID" as `[x]` if you've done that too
- Update the redirect URL item to note it should be configured via Lovable Cloud UI

### Remaining human-only items (cannot be done by Lovable)
- Generate APNs key and upload for push notifications
- Xcode archive and TestFlight upload
- Add TestFlight testers

