import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VisitPhoto {
  id: string;
  slot_key: string | null;
  upload_status: string;
  captured_at: string | null;
  sku_id: string | null;
  signedUrl: string | null;
}

export interface ChecklistHighlight {
  id: string;
  label: string;
  status: string;
  reason_code: string | null;
  note: string | null;
  is_required: boolean;
}

export interface CustomerIssue {
  id: string;
  reason: string;
  note: string;
  status: string;
  photo_storage_path: string | null;
  photo_upload_status: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface VisitDetail {
  job: {
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
    provider_org_id: string;
  };
  skus: {
    sku_id: string;
    sku_name_snapshot: string | null;
    duration_minutes_snapshot: number | null;
    scheduled_level_id: string | null;
    performed_level_id: string | null;
    scheduled_level_label: string | null;
    performed_level_label: string | null;
  }[];
  photos: VisitPhoto[];
  checklistHighlights: ChecklistHighlight[];
  issue: CustomerIssue | null;
  timeOnSiteMinutes: number | null;
  courtesyUpgrade: { reason_code: string; performed_level_label: string; scheduled_level_label: string; performed_level_id: string; sku_id: string } | null;
  recommendation: { recommended_level_label: string; reason_code: string; recommended_level_id: string; sku_id: string } | null;
}

export function useCustomerVisitDetail(jobId: string | undefined) {
  const { user } = useAuth();

  return useQuery<VisitDetail | null>({
    queryKey: ["customer_visit_detail", jobId],
    enabled: !!user && !!jobId,
    queryFn: async () => {
      if (!user || !jobId) return null;

      // Parallel fetches
      const [jobRes, skuRes, photoRes, checklistRes, issueRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, status, scheduled_date, started_at, arrived_at, departed_at, completed_at, provider_summary, property_id, zone_id, provider_org_id")
          .eq("id", jobId)
          .eq("customer_id", user.id)
          .single(),
        supabase
          .from("job_skus")
          .select("sku_id, sku_name_snapshot, duration_minutes_snapshot, scheduled_level_id, performed_level_id")
          .eq("job_id", jobId),
        supabase
          .from("job_photos")
          .select("id, slot_key, upload_status, captured_at, sku_id, storage_path")
          .eq("job_id", jobId)
          .eq("upload_status", "UPLOADED"),
        supabase
          .from("job_checklist_items")
          .select("id, label, status, reason_code, note, is_required")
          .eq("job_id", jobId),
        supabase
          .from("customer_issues")
          .select("id, reason, note, status, photo_storage_path, photo_upload_status, resolution_note, resolved_at, created_at")
          .eq("job_id", jobId)
          .eq("customer_id", user.id)
          .maybeSingle(),
      ]);

      if (jobRes.error) throw jobRes.error;
      if (!jobRes.data) return null;

      // Generate signed URLs for photos (parallel for performance)
      const photos: VisitPhoto[] = await Promise.all(
        (photoRes.data ?? []).map(async (p) => {
          let signedUrl: string | null = null;
          if (p.storage_path) {
            const { data: urlData } = await supabase.storage
              .from("job-photos")
              .createSignedUrl(p.storage_path, 3600);
            signedUrl = urlData?.signedUrl ?? null;
          }
          return {
            id: p.id,
            slot_key: p.slot_key,
            upload_status: p.upload_status,
            captured_at: p.captured_at,
            sku_id: p.sku_id,
            signedUrl,
          };
        })
      );

      // Filter checklist to highlights: completed items + exceptions (not-done with reason)
      const allItems = checklistRes.data ?? [];
      const highlights = allItems.filter(
        (item) => item.status === "DONE" || (item.status === "NOT_DONE_WITH_REASON" && item.is_required)
      );

      // Compute time on site
      let timeOnSiteMinutes: number | null = null;
      if (jobRes.data.arrived_at && jobRes.data.departed_at) {
        const diff = new Date(jobRes.data.departed_at).getTime() - new Date(jobRes.data.arrived_at).getTime();
        timeOnSiteMinutes = Math.round(diff / 60000);
      }

      // Fetch level labels for job_skus
      const rawSkus = skuRes.data ?? [];
      const levelIds = [
        ...rawSkus.map((s: any) => s.scheduled_level_id).filter(Boolean),
        ...rawSkus.map((s: any) => s.performed_level_id).filter(Boolean),
      ];
      const levelMap = new Map<string, string>();
      if (levelIds.length > 0) {
        const { data: levelsData } = await supabase
          .from("sku_levels")
          .select("id, label")
          .in("id", levelIds);
        for (const l of levelsData ?? []) {
          levelMap.set(l.id, l.label);
        }
      }

      const skusWithLevels = rawSkus.map((s: any) => ({
        sku_id: s.sku_id,
        sku_name_snapshot: s.sku_name_snapshot,
        duration_minutes_snapshot: s.duration_minutes_snapshot,
        scheduled_level_id: s.scheduled_level_id ?? null,
        performed_level_id: s.performed_level_id ?? null,
        scheduled_level_label: s.scheduled_level_id ? (levelMap.get(s.scheduled_level_id) ?? null) : null,
        performed_level_label: s.performed_level_id ? (levelMap.get(s.performed_level_id) ?? null) : null,
      }));

      // Fetch courtesy upgrade for this job
      const { data: courtesyData } = await supabase
        .from("courtesy_upgrades")
        .select("reason_code, scheduled_level_id, performed_level_id, sku_id")
        .eq("job_id", jobId)
        .maybeSingle();

      const courtesyUpgrade = courtesyData ? {
        reason_code: courtesyData.reason_code,
        scheduled_level_label: levelMap.get(courtesyData.scheduled_level_id) ?? "Standard",
        performed_level_label: levelMap.get(courtesyData.performed_level_id) ?? "Upgraded",
        performed_level_id: courtesyData.performed_level_id,
        sku_id: courtesyData.sku_id,
      } : null;

      // Fetch recommendation for this job
      const { data: recData } = await supabase
        .from("level_recommendations")
        .select("recommended_level_id, reason_code")
        .eq("job_id", jobId)
        .maybeSingle();

      let recommendation: VisitDetail["recommendation"] = null;
      if (recData) {
        // Resolve sku_id from the recommended level
        const { data: recLevel } = await supabase
          .from("sku_levels")
          .select("sku_id")
          .eq("id", recData.recommended_level_id)
          .single();
        recommendation = {
          recommended_level_label: levelMap.get(recData.recommended_level_id) ?? "Recommended",
          reason_code: recData.reason_code,
          recommended_level_id: recData.recommended_level_id,
          sku_id: recLevel?.sku_id ?? "",
        };
      }

      return {
        job: jobRes.data,
        skus: skusWithLevels,
        photos,
        checklistHighlights: highlights as ChecklistHighlight[],
        issue: (issueRes.data as CustomerIssue) ?? null,
        timeOnSiteMinutes,
        courtesyUpgrade,
        recommendation,
      };
    },
  });
}
