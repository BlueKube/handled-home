# Module 13: Referrals & Incentives

## Scope
Referral links, reward tracking, neighborhood density campaigns, fraud controls.

## Tables
- `referral_codes` — user_id, code, reward_type, reward_value, uses, max_uses, created_at
- `referral_redemptions` — code_id, referred_user_id, status, rewarded_at
- `density_campaigns` — zone_id, discount_percent, threshold_homes, current_homes, status

## Key User Stories
- As a customer, I can share my referral link
- As a customer, I earn rewards when friends sign up
- As an admin, I can configure density campaigns
- As the system, I prevent referral fraud

## Dependencies
- Module 01 (auth & roles)
- Module 05 (subscription engine)

## Acceptance Criteria
- [ ] Referral link generation and sharing
- [ ] Reward tracking and fulfillment
- [ ] Density campaign configuration
- [ ] Fraud detection basics
