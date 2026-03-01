
-- Sprint 3A: SKU Levels (Variants) System — All tables

-- 1. sku_levels
CREATE TABLE public.sku_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  level_number INT NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  short_description TEXT,
  inclusions TEXT[] NOT NULL DEFAULT '{}',
  exclusions TEXT[] NOT NULL DEFAULT '{}',
  planned_minutes INT NOT NULL DEFAULT 30,
  proof_photo_min INT NOT NULL DEFAULT 1,
  proof_checklist_template JSONB DEFAULT '[]',
  handles_cost INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_start_cycle DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sku_id, level_number)
);
ALTER TABLE public.sku_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sku_levels" ON public.sku_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage sku_levels" ON public.sku_levels FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_sku_levels_sku_id ON public.sku_levels(sku_id);

-- 2. sku_guidance_questions
CREATE TABLE public.sku_guidance_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  question_order INT NOT NULL DEFAULT 1,
  question_text TEXT NOT NULL,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  options JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sku_id, question_order)
);
ALTER TABLE public.sku_guidance_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sku_guidance_questions" ON public.sku_guidance_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage sku_guidance_questions" ON public.sku_guidance_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_sku_guidance_questions_sku_id ON public.sku_guidance_questions(sku_id);

-- 3. level_recommendations
CREATE TABLE public.level_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id),
  scheduled_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  recommended_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  reason_code TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.level_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can insert own level_recommendations" ON public.level_recommendations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_members pm WHERE pm.provider_org_id = level_recommendations.provider_org_id AND pm.user_id = auth.uid() AND pm.status = 'ACTIVE')
  );
CREATE POLICY "Providers can read own level_recommendations" ON public.level_recommendations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.provider_members pm WHERE pm.provider_org_id = level_recommendations.provider_org_id AND pm.user_id = auth.uid() AND pm.status = 'ACTIVE')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage level_recommendations" ON public.level_recommendations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_level_recommendations_job_id ON public.level_recommendations(job_id);

-- 4. courtesy_upgrades
CREATE TABLE public.courtesy_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  sku_id UUID NOT NULL REFERENCES public.service_skus(id),
  scheduled_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  performed_level_id UUID NOT NULL REFERENCES public.sku_levels(id),
  reason_code TEXT NOT NULL,
  provider_org_id UUID NOT NULL REFERENCES public.provider_orgs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courtesy_upgrades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can insert own courtesy_upgrades" ON public.courtesy_upgrades
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.provider_members pm WHERE pm.provider_org_id = courtesy_upgrades.provider_org_id AND pm.user_id = auth.uid() AND pm.status = 'ACTIVE')
  );
CREATE POLICY "Customers can read own property courtesy_upgrades" ON public.courtesy_upgrades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = courtesy_upgrades.property_id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.provider_members pm WHERE pm.provider_org_id = courtesy_upgrades.provider_org_id AND pm.user_id = auth.uid() AND pm.status = 'ACTIVE')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins can manage courtesy_upgrades" ON public.courtesy_upgrades FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_courtesy_upgrades_property_sku ON public.courtesy_upgrades(property_id, sku_id);

-- 5. Add level_id to routine_items
ALTER TABLE public.routine_items ADD COLUMN level_id UUID REFERENCES public.sku_levels(id);

-- 6. Add level columns to job_skus
ALTER TABLE public.job_skus ADD COLUMN scheduled_level_id UUID REFERENCES public.sku_levels(id);
ALTER TABLE public.job_skus ADD COLUMN performed_level_id UUID REFERENCES public.sku_levels(id);
