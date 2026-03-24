# Batch 3: Viral Loop Wiring — Celebration + Receipt Referral Cards

## Why It Matters

High-intent moments (first service celebration, receipt viewing) are prime opportunities for organic referral growth. Adding referral cards at these touchpoints connects the viral loop per the product spec.

## Scope

- **P1-1**: Add referral card to `FirstServiceCelebration` overlay (between "Share the news" CTA and dismiss button)
- **P1-2**: Add referral card to `VisitDetail` receipt page (between Share CTA and Receipt Suggestions)

## Non-Goals

- Modifying the referral hub page itself
- Adding growth event tracking (can be wired later)
- Changing `useReferralCodes` hook behavior

## File Targets

| Action | File |
|--------|------|
| **Edit** | `src/components/customer/FirstServiceCelebration.tsx` |
| **Edit** | `src/pages/customer/VisitDetail.tsx` |

## Design

### Celebration Referral Card (P1-1)
- Card with `bg-accent/5` and `border-accent/20`
- Users icon + "Know someone who'd love this?"
- Caption: "Earn a $30 credit when a friend subscribes."
- Button (accent, sm): "Get Your Referral Code" → `/customer/referrals`
- Positioned after "Share the news" button, before "Continue to dashboard"

### Receipt Referral Card (P1-2)
- Card with `bg-accent/5`
- Users icon + "Your neighbors would love this"
- Caption: "Share your referral code and earn credits when friends subscribe."
- Inline referral code if available (monospace, copy button)
- Button (accent, sm): "Share Code" → `/customer/referrals`
- Positioned after Share CTA, before Receipt Suggestions
- Only shown for COMPLETED jobs

## Acceptance Criteria

1. Celebration overlay shows referral card after "Share the news" CTA
2. Tapping "Get Your Referral Code" navigates to `/customer/referrals`
3. Visit detail shows referral card below share button for completed jobs
4. Referral code renders inline with monospace font + copy button (if code exists)
5. "Share Code" links to `/customer/referrals`
6. Both cards use accent color scheme matching CrossPollinationCard pattern
7. All touch targets >= 44px

## Regression Risks

- Celebration overlay layout may overflow on small screens with added card
- VisitDetail spacing between existing sections
