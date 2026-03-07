# PRD: Playwright E2E + Synthetic UX Review Harness

**Status**: Phase 1 — Implemented  
**Created**: 2026-03-07  
**Last Updated**: 2026-03-07  
**Owner**: Engineering  

---

## 1. Overview

This document specifies the end-to-end testing and UX review architecture for Handled Home. It covers two layers:

- **Phase 1A — Playwright E2E Harness**: Automated browser tests that validate flows, redirects, and screen presence
- **Phase 1B — Synthetic UX Review Scaffold**: AI persona-based evaluation of milestone screenshots

Together they form a testing loop:

1. **Playwright** runs flows, takes screenshots, verifies logic
2. **Synthetic users** (AI personas) review screenshots and narrate UX concerns
3. **Report generation** combines pass/fail + UX findings into one artifact

---

## 2. What Playwright Catches

- **Broken flows** — wizard steps fail to advance
- **Missing elements** — buttons, headings, forms absent
- **Regressions** — previously working screens break
- **Wrong redirects** — auth redirect chain, BYOC token routing

## 3. What Playwright Does NOT Catch

- Whether a screen feels confusing
- Whether a CTA is psychologically weak
- Whether the user understands what happens next
- Whether the flow feels like work

That is exactly where synthetic users come in. They sit **on top of** the screenshots Playwright generates — they don't replace Playwright, they extend it.

---

## 4. Phase 1A — Playwright E2E Harness

### 4.1 Configuration (`playwright.config.ts`)

| Setting | Value |
|---------|-------|
| Test directory | `./e2e` |
| Output directory | `test-results` |
| Base URL | `process.env.BASE_URL` (falls back to `http://invalid-base-url-set-BASE_URL-secret`) |
| Browser | Chromium only |
| Device | iPhone 15 |
| Retries | 1 on CI, 0 locally |
| Trace | `on-first-retry` |
| Video | `retain-on-failure` |
| Screenshot | `only-on-failure` (plus explicit milestone screenshots) |
| Reporter | `html` + `list` |

**Important**: The fallback URL is intentionally invalid. If `BASE_URL` is not set, tests fail loudly rather than silently hitting a wrong environment.

### 4.2 Projects

| Project | Auth | Test Match | Purpose |
|---------|------|------------|---------|
| `auth-setup` | Performs login | `auth.setup.ts` | Saves storage state to `e2e/.auth/user.json` |
| `chromium-mobile` | Pre-authenticated | All **except** `byoc-happy-path.spec.ts` | Invalid-invite and refresh-resilience tests |
| `chromium-mobile-no-auth` | None | `byoc-happy-path.spec.ts` only | Validates auth redirect flow |

**Design decision**: `chromium-mobile` uses `testIgnore: /byoc-happy-path\.spec\.ts/` to prevent the happy-path test from running twice (once unauthenticated, once with pre-auth state).

### 4.3 Test Specs

#### `e2e/byoc-happy-path.spec.ts` — No pre-auth

Uses: `/byoc/activate/${TEST_BYOC_TOKEN}` (unauthenticated entry point)

1. Navigate to `/byoc/activate/${TEST_BYOC_TOKEN}` unauthenticated
2. Assert redirect to `/auth?redirect=...`
3. Fill login form, submit
4. **Assert URL becomes** `/customer/onboarding/byoc/${TEST_BYOC_TOKEN}` (validates redirect chain)
5. Walk through all wizard screens:
   - Recognition → Confirm → Property → Home Setup → Activating → Services → Success → Dashboard
6. Assert "Your Home Team" visible on dashboard
7. Save milestone screenshots to `test-results/milestones/`:
   - `byoc-01-recognition.png`
   - `byoc-02-confirm.png`
   - `byoc-03-property.png`
   - `byoc-04-home-setup.png`
   - `byoc-05-services.png`
   - `byoc-06-success.png`
   - `byoc-07-dashboard.png`

#### `e2e/byoc-invalid-invite.spec.ts` — Pre-authenticated

Uses: `/customer/onboarding/byoc/invalid-token-xyz-playwright` (guaranteed-bad token format)

1. Navigate to `/customer/onboarding/byoc/invalid-token-xyz-playwright`
2. Assert fallback screen (inactive/invalid/expired text)
3. Assert safe-continue button visible
4. Screenshot: `test-results/milestones/byoc-invalid-fallback.png`

#### `e2e/byoc-refresh-resilience.spec.ts` — Pre-authenticated

Uses: `/customer/onboarding/byoc/${TEST_BYOC_TOKEN}` (authenticated entry point)

1. Navigate to `/customer/onboarding/byoc/${TEST_BYOC_TOKEN}`
2. Advance to confirm screen → `page.reload()` → assert wizard functional
3. Advance to property screen → `page.reload()` → assert form present
4. Advance to services screen → `page.reload()` → assert screen intact
5. Screenshots in `test-results/milestones/`:
   - `byoc-refresh-confirm.png`
   - `byoc-refresh-property.png`
   - `byoc-refresh-services.png`

### 4.4 CI Workflow (`.github/workflows/playwright.yml`)

- **Triggers**: push to `main`, PR targeting `main`
- **Node caching**: via `actions/setup-node` with `cache: npm`
- **Browser install**: `npx playwright install --with-deps chromium`
- **Artifacts uploaded on `always()`**:
  - `playwright-report/` (HTML report)
  - `test-results/` (screenshots, videos, traces, milestones)

### 4.5 Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `BASE_URL` | Lovable Preview URL (e.g. `https://id-preview--a671f2cf-...lovable.app`) |
| `TEST_USER_EMAIL` | Test account email in preview environment |
| `TEST_USER_PASSWORD` | Test account password |
| `TEST_BYOC_TOKEN` | Active BYOC invite token in preview database |

### 4.6 Assumptions

- Test user account exists and is email-confirmed in preview environment with `customer` role
- BYOC token is linked to a real provider org and remains active
- Preview URL is stable across CI runs

### 4.7 Test Idempotency

**Known limitation**: The happy-path and refresh-resilience tests are NOT fully idempotent. Running them twice against the same token/user will encounter "already activated" states. Mitigations:

- Use a dedicated test user per CI run (future), or
- Handle already-activated state gracefully in tests, or
- Reset test data between runs via a cleanup script

### 4.8 Deno Edge Function Tests

`supabase/functions/activate-byoc-invite/index.test.ts` uses Deno imports and must be run separately via `deno test`, not through the standard `npm test` pipeline. This is not included in the CI workflow yet.

---

## 5. Phase 1B — Synthetic UX Review Scaffold

### 5.1 Architecture

```
Playwright tests run
        │
        ▼
Milestone screenshots saved to test-results/milestones/
        │
        ▼
generate-synthetic-ux-report.ts reads screenshots + persona prompts
        │
        ▼
(Phase 2: LLM API evaluates each screenshot × persona)
        │
        ▼
test-results/ux-review-report.md generated
```

### 5.2 Personas (6 for Phase 1)

| Persona | File | Key Trait |
|---------|------|-----------|
| Busy Homeowner | `busy-homeowner.md` | Low patience, skims headings, two kids |
| Price-Sensitive Homeowner | `price-sensitive-homeowner.md` | Reads pricing carefully |
| Tech-Savvy Early Adopter | `tech-savvy-early-adopter.md` | Judges by design quality |
| Confused First-Time User | `confused-first-time-user.md` | Reads everything, needs reassurance |
| Skeptical Provider | `skeptical-provider.md` | Protective of client relationships |
| Impatient User | `impatient-user.md` | 45-second attention span |

### 5.3 Evaluation Dimensions

For each screen × persona, the reviewer answers:

1. What do you think this screen is for?
2. What would you tap first?
3. What is confusing or unclear?
4. What makes you hesitate?
5. What would make you quit?
6. Scores (1–10): **Clarity**, **Trust**, **Friction**
7. Top improvement suggestion

### 5.4 Report Format (`test-results/ux-review-report.md`)

Organized per-screen, per-persona:

```markdown
## Screen: Recognition

### Persona: Busy Homeowner

**What this screen is for**: [AI response]
**First tap**: [AI response]
**Confusion points**: [AI response]
**Hesitation**: [AI response]
**Quit trigger**: [AI response]

| Clarity | Trust | Friction |
|---------|-------|----------|
| 8       | 8     | 3        |

**Top improvement**: [AI response]
```

Summary section at end:
- Most confusing screen
- Most frequent hesitation
- Screens with low trust
- Top 5 UX fixes

### 5.5 Execution Strategy

**Part A — Built now (Phase 1)**:
- Playwright harness with milestone screenshots
- Persona prompt files in `e2e/prompts/personas/`
- System prompt in `e2e/prompts/ux-review-system.md`
- Scaffold script `scripts/generate-synthetic-ux-report.ts`
- Report template with `[pending AI review]` placeholders

**Part B — External AI execution (Phase 2)**:
- Integrate LLM API (OpenAI, Claude, or Lovable AI models)
- Send screenshot + persona prompt to vision-capable model
- Auto-populate evaluation tables
- Optionally run as a GitHub Actions step after Playwright

This split keeps Phase 1 practical without blocking on API integration.

---

## 6. File Structure

```
playwright.config.ts
e2e/
  .gitignore                          # Ignores .auth/
  auth.setup.ts                       # Shared login, saves storage state
  byoc-happy-path.spec.ts             # Unauthenticated → full wizard
  byoc-invalid-invite.spec.ts         # Bad token → fallback UI
  byoc-refresh-resilience.spec.ts     # Reload at key steps
  prompts/
    ux-review-system.md               # System prompt for AI reviewer
    personas/
      busy-homeowner.md
      price-sensitive-homeowner.md
      tech-savvy-early-adopter.md
      confused-first-time-user.md
      skeptical-provider.md
      impatient-user.md
scripts/
  generate-synthetic-ux-report.ts     # Report generator (scaffold)
test-results/
  milestones/                         # Stable screenshot folder for synthetic review
  ux-review-report.md                 # Generated report
.github/
  workflows/
    playwright.yml                    # CI workflow
```

---

## 7. Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| E2E tests | `npm run test:e2e` | Run Playwright tests |
| E2E UI mode | `npm run test:e2e:ui` | Interactive Playwright debugging |
| UX report | `npm run ux-report` | Generate synthetic review scaffold |

---

## 8. Rollout Plan

### Phase 1 (Current) — BYOC Onboarding

Synthetic users only on the highest-risk flow:
- BYOC onboarding (3 test specs, 7 milestone screenshots)
- 6 persona prompt files
- Report scaffold with placeholders

### Phase 2 — Expand Coverage

Expand to additional flows:
- Standard onboarding
- Service day flow
- Dashboard
- Proof / receipt flow
- Plan selection

LLM API integration for automated reviews.

### Phase 3 — Scale

- Provider onboarding
- 50–100 persona simulations overnight
- Multiple flow branches
- Automated CI integration for synthetic reviews

---

## 9. Security Notes

### RLS for BYOC Provider Org Visibility

The `can_read_provider_org_via_byoc(p_user_id, p_org_id)` function grants visibility to provider orgs when:

1. The user has an existing `byoc_activation` for that org, **OR**
2. The user's `customer_onboarding_progress.metadata.byoc_token` matches an active invite for that org

**Important**: The function does NOT expose all provider orgs with active invites to all authenticated users. It is scoped to the specific user's context.

Access control:
- `REVOKE ALL` from `PUBLIC` and `anon`
- `GRANT EXECUTE` to `authenticated` only

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Preview URL changes between deploys | Use `BASE_URL` secret, update as needed |
| BYOC test token expires or is deactivated | Use a dedicated long-lived token in preview |
| Test user account state conflicts | Use a dedicated test-only account |
| Tests not idempotent (double activation) | Known P2 — future: reset data or fresh users per run |
| LLM API costs for synthetic reviews | Phase 2; start with manual prompt-paste evaluation |
| Flaky selectors due to UI changes | Use role-based and text-based selectors, avoid CSS classes |
| Deno edge function tests not in CI | Document separately; add Deno test step in Phase 2 |

---

## 11. Success Criteria

- [ ] Playwright CI runs green on every PR to `main`
- [ ] Milestone screenshots are saved and accessible as CI artifacts
- [ ] Invalid invite test catches broken error boundaries
- [ ] Refresh resilience test catches lost wizard state
- [ ] Persona prompts are usable for manual AI review immediately
- [ ] Report scaffold generates correct structure from screenshots
- [ ] RLS policy scoped to user-specific BYOC context (not broad exposure)

---

## 12. Review History

### Code Review — 2026-03-07

Findings fixed in this iteration:

| Severity | Finding | Fix |
|----------|---------|-----|
| P1 | `@playwright/test` in production `dependencies` | Moved to `devDependencies` |
| P1 | RLS over-exposed all provider orgs with active invites | Scoped to user's own onboarding token context |
| P2 | Happy path ran twice (in both projects) | Added `testIgnore` to `chromium-mobile` project |
| P2 | `SECURITY DEFINER` function missing `REVOKE` | Added `REVOKE ALL` from `PUBLIC, anon` + `GRANT` to `authenticated` |
| P3 | `ProtectedRoute` dropped `location.hash` on redirect | Now includes `location.hash` |
| P3 | Deno tests undocumented | Documented in this PRD |
