---
title: Provider Probation Ladder
allowed_roles: [ops, superuser]
checklist: Review quality score, issue warning, apply probation, suspend if unresolved
---

# Provider Probation Ladder

## Purpose
Progressively address provider quality issues while giving fair opportunity to improve.

## Steps

1. **Identify at-risk providers** → Review [Provider list](/admin/providers) sorted by quality score
   - Score < 70: Watch list
   - Score < 50: Probation candidate
   - Score < 30: Suspension candidate

2. **Step 1 — Verbal/Written Warning** (Score 50–70 or first pattern):
   - Send notification: "Your quality score has dropped. Here's what to improve..."
   - Document in provider notes via [Provider Detail](/admin/providers)
   - Set 14-day review window

3. **Step 2 — Formal Probation** (Score < 50 or continued issues):
   - Reduce job assignment priority (lower score = fewer jobs)
   - Send formal probation notice with specific improvement targets
   - Set 30-day probation period
   - Add internal note with probation start date

4. **Step 3 — Restricted Service** (No improvement after probation):
   - Limit to existing customers only (no new assignments)
   - Weekly quality review
   - 14-day restricted period

5. **Step 4 — Suspension** (Score < 30 or severe incident):
   - Remove from all active assignments
   - Reassign pending jobs to backup providers
   - Notify affected customers
   - **Superuser approval required** for suspension

6. **Reinstatement** (after suspension):
   - Provider submits improvement plan
   - Superuser reviews and approves
   - Start with limited zone coverage
   - Gradual restoration over 30 days

## Quality score factors
- On-time arrival rate (30%)
- Photo proof compliance (25%)
- Customer satisfaction ratings (25%)
- No-show / cancellation rate (20%)
