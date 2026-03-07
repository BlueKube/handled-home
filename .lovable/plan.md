

## Smart Banner + Web Fallback for BYOC Invite Links

### What We're Building
Keep BYOC onboarding fully functional in the browser (no app install required). Add an iOS/Android smart app banner that suggests the native app when available. Plan the deep-link wiring for later.

### Implementation Steps

**1. Add Smart App Banner meta tag to `index.html`**
- Add `<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID, app-argument={url}">` for iOS Safari smart banner (once you have an App Store ID — placeholder for now)
- For Android, Chrome handles this via a Web App Manifest or Digital Asset Links — no code needed until you publish to Play Store

**2. Create an in-app install banner component**
- A dismissible `<SmartAppBanner />` component shown on the customer dashboard and post-onboarding success screen
- Copy: "Open faster next time in the app" with App Store / Play Store buttons
- Uses `localStorage` to track dismissal so it doesn't nag
- Only renders on mobile user agents (not desktop)

**3. Keep the canonical invite URL as-is**
- `/byoc/activate/:token` remains the SMS link — works fully in browser
- No changes to `ByocActivate.tsx` or the onboarding wizard
- When native deep linking is wired later, this same URL will be intercepted by Universal Links / App Links

**4. Document deep-link prep for later**
- Add a note in `docs/tasks.md` for future work: Capacitor App URL listener, iOS Universal Links (`apple-app-site-association`), Android App Links (`assetlinks.json`), route parsing for `/byoc/activate/:token` inside the native shell

### What's NOT changing
- No app install requirement
- No changes to the BYOC onboarding flow
- No Capacitor deep-link wiring yet (deferred)

### Files touched
- `index.html` — smart banner meta tag (placeholder until App Store ID exists)
- New: `src/components/SmartAppBanner.tsx` — dismissible install suggestion
- `src/pages/customer/Dashboard.tsx` or post-onboarding success screen — render the banner
- `docs/tasks.md` — add deep-link task for future sprint

