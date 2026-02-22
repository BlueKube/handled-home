CREATE POLICY "Customers can read own issue photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'job-photos'
    AND EXISTS (
      SELECT 1 FROM public.customer_issues ci
      WHERE ci.photo_storage_path = name
        AND ci.customer_id = auth.uid()
    )
  );