---
title: Missing Proof Handling
allowed_roles: [dispatcher, ops, superuser]
checklist: Identify missing proof, notify provider, escalate if unresolved, apply payout hold
---

# Missing Proof Handling

## Purpose
Ensure every completed job has photo proof before payout is released.

## Steps

1. **Identify missing proof** → Open [Dispatcher Queues](/admin/ops/dispatch) → "Missing Proof" tab
2. **Check time since completion**:
   - < 1 hour: No action needed, provider may still be uploading
   - 1–2 hours: Send push notification reminder to provider
   - 2–4 hours: Send second reminder + SMS if available
   - 4+ hours: Escalate to ops
3. **Review job details** → Click job to open [Job Detail](/admin/jobs)
   - Verify the job was actually completed (check arrived_at, departed_at)
   - Check if photos were uploaded but failed validation
4. **If provider unresponsive after 4 hours**:
   - Place payout on hold for that job
   - Add internal note: "Proof pending — payout held"
   - Create support ticket if customer disputes quality
5. **If proof arrives late** (next day):
   - Review photo quality
   - If acceptable → release hold
   - If poor quality → flag for re-service

## Payout impact
- Jobs without proof within 24 hours → automatic payout hold
- Provider quality score reduced by 5 points per missing proof incident
