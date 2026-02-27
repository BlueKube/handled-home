import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TimelinePhoto {
  id: string;
  jobId: string;
  scheduledDate: string | null;
  completedAt: string | null;
  slotKey: string | null;
  skuName: string | null;
  signedUrl: string | null;
}

export function usePropertyPhotoTimeline(propertyId: string | undefined) {
  const { user } = useAuth();

  return useQuery<TimelinePhoto[]>({
    queryKey: ["property_photo_timeline", propertyId],
    enabled: !!user && !!propertyId,
    queryFn: async () => {
      if (!user || !propertyId) return [];

      // Get completed jobs for this property
      const { data: jobs, error: jobErr } = await supabase
        .from("jobs")
        .select("id, scheduled_date, completed_at")
        .eq("property_id", propertyId)
        .eq("customer_id", user.id)
        .eq("status", "COMPLETED")
        .order("completed_at", { ascending: false })
        .limit(50);

      if (jobErr) throw jobErr;
      if (!jobs || jobs.length === 0) return [];

      const jobIds = jobs.map((j) => j.id);

      // Get photos and SKU names in parallel
      const [photoRes, skuRes] = await Promise.all([
        supabase
          .from("job_photos")
          .select("id, job_id, slot_key, storage_path")
          .in("job_id", jobIds)
          .eq("upload_status", "UPLOADED"),
        supabase
          .from("job_skus")
          .select("job_id, sku_name_snapshot")
          .in("job_id", jobIds),
      ]);

      if (photoRes.error) throw photoRes.error;
      if (!photoRes.data || photoRes.data.length === 0) return [];

      // Build job lookup
      const jobMap = new Map(jobs.map((j) => [j.id, j]));
      const skuMap = new Map<string, string>();
      for (const s of skuRes.data ?? []) {
        if (s.sku_name_snapshot && !skuMap.has(s.job_id)) {
          skuMap.set(s.job_id, s.sku_name_snapshot);
        }
      }

      // Generate signed URLs
      const timeline: TimelinePhoto[] = [];
      await Promise.all(
        photoRes.data.map(async (p) => {
          const { data: urlData } = await supabase.storage
            .from("job-photos")
            .createSignedUrl(p.storage_path, 3600);
          const job = jobMap.get(p.job_id);
          timeline.push({
            id: p.id,
            jobId: p.job_id,
            scheduledDate: job?.scheduled_date ?? null,
            completedAt: job?.completed_at ?? null,
            slotKey: p.slot_key,
            skuName: skuMap.get(p.job_id) ?? null,
            signedUrl: urlData?.signedUrl ?? null,
          });
        })
      );

      // Sort by completion date desc, then by slot_key
      timeline.sort((a, b) => {
        const dateA = a.completedAt ?? a.scheduledDate ?? "";
        const dateB = b.completedAt ?? b.scheduledDate ?? "";
        return dateB.localeCompare(dateA);
      });

      return timeline;
    },
  });
}
