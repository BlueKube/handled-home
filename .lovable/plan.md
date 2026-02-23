

# Seed Data Gap Fixes — Offered Assignment, Share Cards, Photo Fallback

## What this fixes

Three concrete gaps identified in the existing seed migration, plus a documentation improvement.

---

## 1. Second property + offered assignment with offers (C-11, C-12)

The current seed only has a `confirmed` assignment. Testing offer acceptance (C-11) and rejection (C-12) requires an `offered` assignment with `service_day_offers` rows.

**Migration adds:**
- A second property for the test user: `456 Elm Street, Austin, TX 78702` (still in Austin Central zone)
- A `service_day_assignments` row with `status = 'offered'` and `reserved_until = now() + interval '2 hours'` (short TTL per ChatGPT's suggestion — forces expiry handling validation)
- 3 `service_day_offers` rows:
  - Rank 1: primary, tuesday, `any`
  - Rank 2: alternative, thursday, `any`
  - Rank 3: alternative, friday, `any`

All use deterministic UUIDs with `ON CONFLICT (id) DO NOTHING`.

## 2. Seed 3 share_cards for G-02, G-04, G-05

**Migration adds:**
- Active card: `share_code = 'SEEDSHARE1'`, linked to existing completed job, `expires_at = now() + 30 days`, `is_revoked = false` — for G-02
- Expired card: `share_code = 'SEEDEXPIRED'`, `expires_at = now() - 1 day`, `is_revoked = false` — for G-04
- Revoked card: `share_code = 'SEEDREVOKED'`, `is_revoked = true`, `revoked_at = now()` — for G-05

All share_codes are uppercase alphanumeric (URL-safe). The `share_code` column has a `UNIQUE` constraint so `ON CONFLICT (share_code) DO NOTHING` is used.

Market state for mowing is already `OPEN` in the existing seed, so the active share card scenario won't accidentally hit waitlist gating.

## 3. Photo fallback in UI (4 files)

Add `onError` handlers to all `<img>` tags that render job photos. On error, swap to the bundled `/placeholder.svg` (already exists in `public/`). Also log `console.warn` in development so broken storage paths remain visible to developers.

**Files updated:**
- `src/components/customer/PhotoGallery.tsx` — both `PhotoThumbnail` and full-screen viewer `<img>` tags
- `src/pages/admin/JobDetail.tsx` — photo thumbnails
- `src/pages/provider/JobPhotos.tsx` — uploaded photo thumbnails

## 4. Add "Re-tested?" column + commit baseline to results doc

- Add `Re-tested?` column (values: `—`, `YES`, `NO`) to all 4 scenario tables
- Add `Commit SHA` field in the Test Environment header section
- All existing results get `Re-tested? = NO` to clearly mark them as pre-seed

---

## Technical Details

### Migration SQL structure

```text
-- Second property
INSERT INTO properties (id, user_id, street_address, city, state, zip_code)
VALUES ('edfedf3d-0000-0000-0000-000000000002', test_user, '456 Elm Street', 'Austin', 'TX', '78702')
ON CONFLICT (id) DO NOTHING;

-- Offered assignment (short TTL)
INSERT INTO service_day_assignments (id, customer_id, property_id, zone_id, day_of_week, service_window, status, reserved_until)
VALUES ('f1000000-...0012', test_user, second_property, austin_central, 'tuesday', 'any', 'offered', now() + interval '2 hours')
ON CONFLICT (id) DO NOTHING;

-- 3 offers (primary + 2 alternatives)
INSERT INTO service_day_offers (id, assignment_id, offered_day_of_week, offered_window, offer_type, rank) VALUES
  ('f1000000-...0013', 'f1000000-...0012', 'tuesday', 'any', 'primary', 1),
  ('f1000000-...0014', 'f1000000-...0012', 'thursday', 'any', 'alternative', 2),
  ('f1000000-...0015', 'f1000000-...0012', 'friday', 'any', 'alternative', 3)
ON CONFLICT (id) DO NOTHING;

-- 3 share cards
INSERT INTO share_cards (id, job_id, customer_id, zone_id, category, share_code, expires_at, is_revoked, ...)
VALUES
  ('f1000000-...0060', completed_job, test_user, austin_central, 'mowing', 'SEEDSHARE1', now()+30d, false),
  ('f1000000-...0061', completed_job, test_user, austin_central, 'mowing', 'SEEDEXPIRED', now()-1d, false),
  ('f1000000-...0062', completed_job, test_user, austin_central, 'mowing', 'SEEDREVOKED', now()+30d, true)
ON CONFLICT (share_code) DO NOTHING;
```

### Conflict targets verified

| Table | Conflict target | Method |
|-------|----------------|--------|
| `properties` | `id` (PK) | `ON CONFLICT (id) DO NOTHING` |
| `service_day_assignments` | `id` (PK) | `ON CONFLICT (id) DO NOTHING` |
| `service_day_offers` | `id` (PK) | `ON CONFLICT (id) DO NOTHING` |
| `share_cards` | `share_code` (UNIQUE) | `ON CONFLICT (share_code) DO NOTHING` |

### Files created/modified

| File | Action |
|------|--------|
| New migration SQL | Second property, offered assignment + 3 offers, 3 share cards |
| `src/components/customer/PhotoGallery.tsx` | Add `onError` fallback to `/placeholder.svg` + `console.warn` |
| `src/pages/admin/JobDetail.tsx` | Add `onError` fallback to photo `<img>` |
| `src/pages/provider/JobPhotos.tsx` | Add `onError` fallback to photo `<img>` |
| `docs/Scenario-Test-Results.md` | Add `Re-tested?` column + commit SHA field |

