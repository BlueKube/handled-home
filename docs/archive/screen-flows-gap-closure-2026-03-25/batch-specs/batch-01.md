# Batch 1: Share Landing Hero Photo + Onboarding Error/Skip Fixes

## Phase
Phase 1: Critical Bugs & Blocking UX (HIGH priority, customer-facing)

## Why it matters
The Share Landing page is the first impression for referred users — showing a placeholder icon instead of the actual service photo destroys trust and conversion. Silent error swallowing in onboarding hides failures from users, and missing skip options block users who want to defer plan selection or subscription.

## Scope
1. **F4 Share Landing hero photo** — When `hero_photo_path` exists, render the actual image from Supabase storage instead of showing a placeholder ImageIcon
2. **F5 Onboarding error swallowing** — Replace empty `catch {}` blocks in PropertyStep, HomeSetupStep (coverage + sizing) with user-facing toast error messages
3. **F5 Onboarding skip options** — Add "Skip for now" ghost buttons to PlanStep and SubscribeStep per spec

## Non-goals
- Changing the Share Landing layout or CTAs
- Changing onboarding step order or navigation logic
- Adding the progress bar label suppression (separate batch)
- Changing ArrowLeft to ChevronLeft (Phase 5)

## File targets
| Action | File |
|--------|------|
| Modify | src/pages/ShareLanding.tsx |
| Modify | src/pages/customer/OnboardingWizard.tsx |

## Acceptance criteria
- [ ] When `hero_photo_path` is present, ShareLanding renders an `<img>` tag with the Supabase storage public URL
- [ ] When `hero_photo_path` is absent, ShareLanding shows the gradient + ImageIcon placeholder (existing behavior)
- [ ] PropertyStep `catch {}` replaced with `toast.error("Your address couldn't be saved — check your connection and try again.")`
- [ ] HomeSetupStep coverage `catch {}` replaced with `toast.error("Your coverage preferences couldn't be saved — check your connection and try again.")`
- [ ] HomeSetupStep sizing `catch {}` replaced with `toast.error("Home size details couldn't be saved — you can skip this step and update later in Settings.")`
- [ ] PlanStep has a ghost button: "Skip for now — browse plans later from your dashboard"
- [ ] SubscribeStep has a ghost button: "Skip for now — subscribe when you're ready"
- [ ] Both skip buttons call `completeStep` to advance past the step
- [ ] `npm run build` passes

## Regression risks
- Hero photo URL construction must handle both full URLs and relative storage paths
- Skip buttons must properly advance onboarding state so users aren't stuck

## Visual validation checklist
- [ ] Share Landing with photo shows actual image, not placeholder
- [ ] Share Landing without photo shows gradient placeholder (unchanged)
- [ ] Plan step shows skip button below plan cards
- [ ] Subscribe step shows skip button below Subscribe Now
- [ ] Error toasts appear when save fails
