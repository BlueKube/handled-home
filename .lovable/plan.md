

# Sprint 3A: SKU Levels (Variants) System — Implementation Plan

## Pre-requisite Fix
Fix the edge function build error in `create-connect-account-link/index.ts` — change `npm:@supabase/supabase-js@2.57.2` to the `https://esm.sh/` import pattern used by other edge functions.

---

## Phase 1: Schema & Data Layer

### Migration 1: `sku_levels` table
```sql
CREATE TABLE public.sku_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  level_number INT NOT NULL DEFAULT 1,
  label TEXT NOT NULL,                    -- e.g. "Maintenance", "Standard", "Deep"
  short_description TEXT,
  inclusions TEXT[] NOT NULL DEFAULT '{}',
  exclusions TEXT[] NOT NULL DEFAULT '{}',
  planned_minutes INT NOT NULL DEFAULT 30,
  proof_photo_min INT NOT NULL DEFAULT 1,
  proof_checklist_template JSONB DEFAULT '[]',
  handles_cost INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_start_cycle DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sku_id, level_number)
);
ALTER TABLE public.sku_levels ENABLE ROW LEVEL SECURITY;
-- Public read, admin write
CREATE POLICY "Anyone can read sku_levels" ON public.sku_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage sku_levels" ON public.sku_levels FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

### Migration 2: `sku_guidance_questions` table
```sql
CREATE TABLE public.sku_guidance_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  question_order INT NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  options JSONB NOT NULL DEFAULT '[]',    -- [{label, value, level_bump?, minutes_bump?}]
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sku_id, question_order)
);
ALTER TABLE public.sku_guidance_questions ENABLE ROW LEVEL SECURITY;
-- Same RLS pattern
```

### Migration 3: `courtesy_upgrades` table + `level_recommendations` table
```sql
CREATE TABLE public.level_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  provider_org_id UUID NOT NULL,
  scheduled_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  recommended_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  reason_code TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.courtesy_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  property_id UUID NOT NULL,
  sku_id UUID NOT NULL REFERENCES public.service_skus(id),
  scheduled_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  performed_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  reason_code TEXT NOT NULL,
  provider_org_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: providers can insert own, admins can read all, customers can read own property
```

### Migration 4: Add `level_id` FK columns
- `routine_items.level_id` (nullable, references `sku_levels.id`)
- `job_skus.level_id` (nullable, references `sku_levels.id`)
- `job_skus.scheduled_level_id` + `job_skus.performed_level_id` (for courtesy upgrade tracking)

---

## Phase 2: Hooks & Data Access

1. **`useSkuLevels(skuId)`** — fetch levels for a SKU, ordered by `level_number`
2. **`useCreateLevel` / `useUpdateLevel` / `useDeleteLevel`** — admin CRUD mutations
3. **`useGuidanceQuestions(skuId)`** — fetch questions for a SKU
4. **`useLevelRecommendation`** — provider mutation to record recommendation at job completion
5. **`useCourtesyUpgrade`** — provider mutation with guardrail check (1 per property/SKU/6mo)

---

## Phase 3: Admin UI

1. **Level editor inside SKU form** — new collapsible "Levels" section in `SkuFormSheet` listing levels with inline add/edit/reorder/delete
2. **Guidance questions editor** — new collapsible section in `SkuFormSheet` for configuring 0–3 questions per SKU
3. **SKU detail sheet** — show levels summary with scope, time, handles cost

---

## Phase 4: Customer UI

1. **Level selector in SKU detail** — compare levels side-by-side, show handle delta
2. **Level selector in add-to-routine flow** — default level pre-selected, change updates handles
3. **Routine item cards** — show level label + handles cost
4. **Receipt / visit detail** — show scheduled vs performed level, recommendation notice, one-tap "Update going forward"

---

## Phase 5: Provider UI

1. **Job detail header** — show level label, planned minutes, scope bullets
2. **Completion flow** — level sufficiency prompt ("Was the scheduled level sufficient?"), recommendation form with reason codes, courtesy upgrade option with guardrails

---

## Phase 6: Analytics (lightweight v1)

1. Add recommendation and courtesy upgrade counts to admin ops dashboard
2. Basic mismatch table: SKU × zone × recommendation rate

---

## Implementation Order

We will implement in phases 1→2→3→4→5→6, each buildable and testable independently. Phase 1 (schema) and Phase 2 (hooks) will be done together in the first batch. Phase 3 (admin UI) next so ops can populate levels. Then customer and provider UI.

### Technical Details
- Existing `service_skus` fields (`duration_minutes`, `inclusions`, `exclusions`, `handle_cost`, `required_photos`, `checklist`) become **defaults / fallbacks** when no levels exist — backward compatible
- When levels exist for a SKU, the level's values override the SKU-level defaults
- `routine_items.level_id` is nullable — existing routines without levels continue to work

