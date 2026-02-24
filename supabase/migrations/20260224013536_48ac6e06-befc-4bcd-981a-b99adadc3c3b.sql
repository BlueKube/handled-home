
-- Add new columns to service_skus
ALTER TABLE public.service_skus
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Create sku-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sku-images', 'sku-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view sku images
CREATE POLICY "SKU images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sku-images');

-- Allow admins to manage sku images
CREATE POLICY "Admins can upload sku images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sku-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sku images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'sku-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sku images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'sku-images' AND public.has_role(auth.uid(), 'admin'));
