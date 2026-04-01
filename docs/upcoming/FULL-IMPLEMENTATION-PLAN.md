# Full Implementation Plan: Round 6 — TestFlight Readiness

> **Created:** 2026-04-01
> **Purpose:** Get Handled Home onto TestFlight for iOS device testing. Fix all blockers identified in the Capacitor/iOS audit. This round is focused on configuration, native setup, and deployment — not new features.

---

## Context

The app is ~80% ready for TestFlight. The web build is solid, backend is configured, and mobile-critical features (safe areas, touch targets, push notification code) are properly implemented. However:

- The iOS native project hasn't been generated yet (`ios/` directory missing)
- `capacitor.config.ts` points to a Lovable dev server, not production
- App ID uses an auto-generated Lovable identifier
- APNs/push notification certificates aren't configured
- Auth deep links need a custom URL scheme for email confirmation on device
- Missing Mapbox API token for map features
- App icons and splash screen assets don't exist yet

### What this round does NOT include

- New features (Round 5 already added significant functionality)
- Database migrations (schema is stable)
- Edge function changes (all deployed)
- Stripe production setup (separate from TestFlight — test mode is fine)

---

## Phase 1: Capacitor Configuration & Native Project Setup

**Problem:** The `capacitor.config.ts` points to a Lovable dev server with cleartext enabled and a generic app ID. The iOS project hasn't been generated.

**Goals:**
1. Update `capacitor.config.ts` with production-ready settings (app ID, server URL, cleartext off)
2. Remove the remote server URL so the app bundles locally (standard for TestFlight)
3. Generate the iOS project via `npx cap add ios` + `npx cap sync`
4. Verify the build pipeline works end-to-end

**Scope:**
- Update `capacitor.config.ts`:
  - `appId`: Change from `app.lovable.xxx` to proper bundle ID (e.g., `com.handledhome.app` — human decides)
  - Remove `server.url` entirely (Capacitor will serve from bundled `dist/` — correct for TestFlight)
  - Set `cleartext: false`
- Run `npm run build && npx cap add ios && npx cap sync`
- Verify `ios/` directory is generated with correct bundle ID
- Update `DEPLOYMENT.md` with iOS build instructions

**Human decision needed:** What bundle ID to use (e.g., `com.handledhome.app`). Must match Apple Developer account.

**Estimated batches:** 2 (S)

---

## Phase 2: iOS App Assets (Icons & Splash Screen)

**Problem:** The iOS project needs app icons (1024x1024 for App Store, plus all scaled sizes) and a launch screen. Without these, TestFlight will reject the build or show a blank icon.

**Goals:**
1. Create or source app icon assets at required iOS sizes
2. Configure splash screen / launch storyboard
3. Place assets in `ios/App/App/Assets.xcassets/`

**Scope:**
- Generate app icon set from a single 1024x1024 PNG source
- Create `AppIcon.appiconset` with all required sizes (20, 29, 40, 60, 76, 83.5, 1024 at 1x/2x/3x)
- Configure `LaunchScreen.storyboard` with brand colors and app name
- Verify icons appear correctly in Xcode

**Human decision needed:** Source artwork for the app icon. If none exists, we can create a simple text-based placeholder for TestFlight testing.

**Estimated batches:** 1-2 (S)

---

## Phase 3: Auth Deep Links & URL Scheme

**Problem:** Supabase email confirmation links redirect to a URL. On iOS, these links open in Safari instead of the app unless a custom URL scheme or universal links are configured. Users confirming their email will land in Safari, not the app.

**Goals:**
1. Register a custom URL scheme in the iOS project (e.g., `handledhome://`)
2. Update Supabase auth redirect URLs to use the custom scheme
3. Add Capacitor App listener to handle deep link routing
4. Test the email confirmation → app flow

**Scope:**
- Add custom URL scheme to `ios/App/App/Info.plist`
- Update `AuthPage.tsx` to include the custom scheme in redirect URLs
- Add `App.addListener('appUrlOpen', ...)` handler for routing deep links
- Update Supabase project settings with the new redirect URL whitelist
- Update `DEPLOYMENT.md` with deep link configuration

**Estimated batches:** 2 (S)

---

## Phase 4: iOS Info.plist & Permissions

**Problem:** iOS requires privacy usage descriptions for any hardware the app accesses (camera, location, photos). Without these, the App Store review will reject the build.

**Goals:**
1. Add required `NS*UsageDescription` keys to Info.plist
2. Configure App Transport Security for production
3. Verify all Capacitor plugins have correct entitlements

**Scope:**
- Add to `Info.plist`:
  - `NSCameraUsageDescription` — "Take photos of completed service work for quality verification"
  - `NSPhotoLibraryUsageDescription` — "Select photos to upload as service proof"
  - `NSLocationWhenInUseUsageDescription` — "Show your service area and nearby providers on the map"
- Verify ATS configuration (App Transport Security) allows Supabase + Mapbox domains
- Add push notification entitlement to Xcode project

**Human decision needed:** Which permissions to request. Camera and photo library are needed for proof capture. Location is needed for maps. Push notifications need APNs certificate from Apple Developer account.

**Estimated batches:** 1 (S)

---

## Phase 5: Environment & Build Verification

**Problem:** The app needs all environment variables set correctly for a production build that runs on device. Some variables (Mapbox token) are missing.

**Goals:**
1. Verify all VITE_ environment variables are set
2. Run a clean production build
3. Sync to iOS and verify in Xcode simulator
4. Document the complete TestFlight submission process

**Scope:**
- Verify `.env` has: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_MAPBOX_ACCESS_TOKEN`
- Run `npm run build && npx cap sync ios`
- Open in Xcode, run on simulator, verify key flows:
  - Auth (signup, login)
  - Dashboard loads
  - Map renders
  - Photo capture works
  - Navigation between roles
- Update `DEPLOYMENT.md` with complete TestFlight checklist
- Update `docs/upcoming/TODO.md` with any remaining human actions (APNs cert, App Store Connect setup)

**Human actions required (cannot be done by agent):**
- Create app in App Store Connect
- Upload APNs certificate to Supabase (for push notifications)
- Set `VITE_MAPBOX_ACCESS_TOKEN` in `.env`
- Archive and upload to TestFlight from Xcode
- Add TestFlight testers

**Estimated batches:** 2 (S)

---

## Execution Order

1. **Phase 1** (Capacitor config) — must come first, generates the iOS project
2. **Phase 2** (App assets) — depends on iOS project existing
3. **Phase 3** (Deep links) — depends on iOS project existing
4. **Phase 4** (Info.plist) — depends on iOS project existing
5. **Phase 5** (Build verification) — final validation pass

**Estimated total:** 8-9 batches across 5 phases

---

## Success Criteria

1. `npm run build && npx cap sync ios` completes without errors
2. App runs in Xcode iOS simulator with all key flows working
3. App icon appears correctly
4. Auth email confirmation links open the app (deep links)
5. Info.plist has all required privacy descriptions
6. DEPLOYMENT.md has complete TestFlight submission checklist
7. TODO.md lists all human actions needed for final TestFlight submission

---

## What the Human Must Do (Cannot Be Automated)

These steps require Apple Developer account access and cannot be done by the agent:

1. **Choose a bundle ID** (e.g., `com.handledhome.app`) and register it in Apple Developer portal
2. **Create the app** in App Store Connect
3. **Generate APNs certificate** and upload to Supabase project settings
4. **Provide app icon artwork** (1024x1024 PNG) or approve a placeholder
5. **Set `VITE_MAPBOX_ACCESS_TOKEN`** in the `.env` file
6. **Archive and upload** the build to TestFlight from Xcode
7. **Add TestFlight testers** by email
