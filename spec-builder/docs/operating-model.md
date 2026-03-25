# Spec Builder — Operating Model

## Revenue Model

### Pricing Tiers

| Tier | Price | Target | Key Limits |
|------|-------|--------|-----------|
| **Free** | $0 | Solo devs evaluating the product | 1 project, 1 user, 20 AI generations/month, no personas |
| **Pro** | $29/user/month | Individual devs and small teams | Unlimited projects, unlimited AI, all personas, git connection, export |
| **Team** | $49/user/month | Teams of 2–25 | Everything in Pro + collaboration, roles, templates, priority support |
| **Enterprise** | Custom | Teams of 25+ | SSO, audit logs, custom personas, self-hosted option |

### Annual discount
- 20% off for annual billing ($23.20/user/month Pro, $39.20/user/month Team)

### Revenue math (target: Year 1)

| Metric | Target |
|--------|--------|
| Free users | 5,000 |
| Free → Pro conversion | 8% = 400 Pro users |
| Pro → Team upgrade | 25% = 100 Team seats |
| Pro MRR | 400 × $29 = $11,600 |
| Team MRR | 100 × $49 = $4,900 |
| **Total MRR target** | **$16,500** |
| **ARR target** | **$198,000** |

---

## Cost Structure

### Variable Costs (per user/month)

| Cost | Free tier | Pro tier | Team tier |
|------|-----------|----------|-----------|
| AI API (Claude) | ~$0.10 (20 gen cap) | ~$2.50 (avg usage) | ~$3.00 (avg usage) |
| Supabase (DB, auth, realtime) | ~$0.02 | ~$0.05 | ~$0.08 |
| Vercel hosting | ~$0.01 | ~$0.02 | ~$0.03 |
| **Total variable** | **~$0.13** | **~$2.57** | **~$3.11** |

### Fixed Costs (monthly)

| Cost | Amount |
|------|--------|
| Supabase Pro plan | $25 |
| Vercel Pro plan | $20 |
| Domain + DNS | $2 |
| Monitoring (Sentry, analytics) | $30 |
| **Total fixed** | **~$77/month** |

---

## Unit Economics

| Metric | Pro | Team |
|--------|-----|------|
| Revenue per user | $29.00 | $49.00 |
| Variable cost per user | $2.57 | $3.11 |
| **Gross margin per user** | **$26.43 (91%)** | **$45.89 (94%)** |
| Contribution margin after fixed | ~$26 | ~$45 |

### Breakeven

- Fixed costs: $77/month
- Need 3 Pro users or 2 Team users to cover fixed costs
- At 50 paying users: ~$1,300 MRR with 88% gross margin

---

## Success Metric Thresholds

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Monthly active users (MAU) | >500 | 200–500 | <200 |
| Free → Pro conversion (monthly) | >8% | 4–8% | <4% |
| Pro monthly churn | <5% | 5–8% | >8% |
| Team monthly churn | <3% | 3–5% | >5% |
| AI generation success rate | >95% | 90–95% | <90% |
| Average session duration | >15 min | 8–15 min | <8 min |
| Documents per project (avg) | >5 | 3–5 | <3 |
| PRDs generated per project/month | >2 | 1–2 | <1 |
| NPS score | >50 | 30–50 | <30 |

---

## Operational Rules

### AI Generation Limits

- **Free tier:** 20 generations/month, hard cap, counter resets on billing cycle
- **Pro/Team:** No hard cap; soft alert at 500 generations/month (likely abuse or integration issue)
- **Rate limit:** Max 5 concurrent generation requests per user
- **Timeout:** 60 seconds per generation; retry once on timeout, then surface error to user

### Billing & Subscription

- **Payment:** Stripe integration, credit card or ACH
- **Billing cycle:** Monthly or annual, charged at start of cycle
- **Upgrade:** Prorated, immediate access to new tier features
- **Downgrade:** Takes effect at end of current billing cycle
- **Payment failure retry:** 3 attempts — Day 0, Day 3, Day 7
- **Grace period:** 7 days after final retry failure
- **Suspension:** After grace period — read-only access, no AI generations, export still works
- **Cancellation:** Data retained for 30 days, then permanently deleted

### Data Retention

- **Active accounts:** All data retained indefinitely
- **Free tier inactive (90 days no login):** Warning email → 30 days → archive (data compressed, no AI access) → 90 more days → delete
- **Cancelled accounts:** 30-day retention, then hard delete
- **Document history:** Last 100 versions per document (Pro/Team), last 10 (Free)

### Support

- **Free:** Community forum + docs only
- **Pro:** Email support, 48-hour response SLA
- **Team:** Email support, 24-hour response SLA, priority queue
- **Enterprise:** Dedicated support channel, 4-hour response SLA

---

## Risk Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| AI API cost spike | >$5/user/month avg | Investigate usage patterns, consider generation limits |
| Churn spike | >10% monthly for any tier | User research, exit survey analysis, feature prioritization review |
| Generation failure rate | >10% in 24h window | Incident response — check API status, switch models, notify users |
| Database size growth | >80% of Supabase tier limit | Plan tier upgrade, archive old project data |
| Concurrent users | >80% of Supabase realtime limit | Scale plan or optimize connection pooling |
