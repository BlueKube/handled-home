
-- Sprint 3D Phase B2: Property Service Predictions

CREATE TABLE public.property_service_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES public.service_skus(id) ON DELETE CASCADE,
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  reason TEXT NOT NULL,
  timing_hint TEXT NOT NULL DEFAULT 'now' CHECK (timing_hint IN ('now', 'next_month', 'next_season')),
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  model_version TEXT NOT NULL DEFAULT 'v1',
  UNIQUE (property_id, sku_id)
);

ALTER TABLE public.property_service_predictions ENABLE ROW LEVEL SECURITY;

-- Customers can read predictions for their own properties
CREATE POLICY "Customers read own property predictions"
  ON public.property_service_predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_service_predictions.property_id
        AND p.user_id = auth.uid()
    )
  );

-- Admins can read/write all
CREATE POLICY "Admins manage all predictions"
  ON public.property_service_predictions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role for edge function writes
CREATE POLICY "Service role manages predictions"
  ON public.property_service_predictions FOR ALL
  USING (auth.role() = 'service_role');

-- Index for lookup by property (main query path)
CREATE INDEX idx_property_predictions_property ON public.property_service_predictions (property_id, expires_at);
