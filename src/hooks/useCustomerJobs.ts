import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerJob {
  id: string;
  status: string;
  scheduled_date: string | null;
  started_at: string | null;
  arrived_at: string | null;
  departed_at: string | null;
  completed_at: string | null;
  provider_summary: string | null;
  property_id: string;
  zone_id: string;
  created_at: string;
  skus: { sku_id: string; sku_name_snapshot: string | null; duration_minutes_snapshot: number | null }[];
  photo_count: number;
  photos: { id: string; url: string }[];
}

export function useCustomerJobs(filter: "upcoming" | "completed" | "all" = "all", options?: { includePhotos?: boolean }) {
  const includePhotos = options?.includePhotos ?? false;
  const { user } = useAuth();

  return useQuery<CustomerJob[]>({
    queryKey: ["customer_jobs", user?.id, filter, includePhotos],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("jobs")
        .select("id, status, scheduled_date, started_at, arrived_at, departed_at, completed_at, provider_summary, property_id, zone_id, created_at")
        .eq("customer_id", user.id);

      if (filter === "upcoming") {
        query = query.in("status", ["NOT_STARTED", "IN_PROGRESS", "ISSUE_REPORTED"]);
      } else if (filter === "completed") {
        query = query.in("status", ["COMPLETED", "PARTIAL_COMPLETE"]);
      }

      query = query.order("scheduled_date", { ascending: false, nullsFirst: false });

      const { data: jobs, error } = await query.limit(100);
      if (error) throw error;
      if (!jobs || jobs.length === 0) return [];

      // Batch fetch SKUs for all jobs
      const jobIds = jobs.map((j) => j.id);
      const { data: skus, error: skuErr } = await supabase
        .from("job_skus")
        .select("job_id, sku_id, sku_name_snapshot, duration_minutes_snapshot")
        .in("job_id", jobIds);
      if (skuErr) throw skuErr;

      const skusByJob = new Map<string, typeof skus>();
      for (const s of skus ?? []) {
        const arr = skusByJob.get(s.job_id) ?? [];
        arr.push(s);
        skusByJob.set(s.job_id, arr);
      }

      // Batch fetch photos for all jobs (opt-in to avoid unnecessary queries)
      const photosByJob = new Map<string, { id: string; url: string }[]>();
      if (includePhotos) {
        const { data: photos, error: photoErr } = await supabase
          .from("job_photos")
          .select("id, job_id, storage_path")
          .in("job_id", jobIds);
        if (photoErr) throw photoErr;

        for (const p of photos ?? []) {
          if (!p.storage_path) continue;
          const { data: urlData } = await supabase.storage
            .from("job-photos")
            .createSignedUrl(p.storage_path, 3600);
          if (!urlData?.signedUrl) continue;
          const arr = photosByJob.get(p.job_id) ?? [];
          arr.push({ id: p.id, url: urlData.signedUrl });
          photosByJob.set(p.job_id, arr);
        }
      }

      return jobs.map((j) => {
        const jobPhotos = photosByJob.get(j.id) ?? [];
        return {
          ...j,
          skus: skusByJob.get(j.id) ?? [],
          photo_count: jobPhotos.length,
          photos: jobPhotos,
        };
      });
    },
  });
}
