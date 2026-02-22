
-- Module 03: Zones, Coverage & Capacity schema additions

-- 1. Add state column to regions
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'CA';

-- 2. Add columns to zones
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS buffer_percent INT NOT NULL DEFAULT 0;
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS default_service_window TEXT NULL;
ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 3. Auto-update updated_at on zones
CREATE TRIGGER update_zones_updated_at
BEFORE UPDATE ON public.zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create zone_provider_assignments table
CREATE TABLE public.zone_provider_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL,
  assignment_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (zone_id, provider_user_id, assignment_type)
);

-- 5. Enable RLS on zone_provider_assignments
ALTER TABLE public.zone_provider_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Admin can manage all assignments
CREATE POLICY "Admins can manage zone provider assignments"
ON public.zone_provider_assignments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Providers can read their own assignments
CREATE POLICY "Providers can view own assignments"
ON public.zone_provider_assignments
FOR SELECT
USING (provider_user_id = auth.uid());
