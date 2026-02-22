import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobDetail {
  id: string;
  property_id: string;
  customer_id: string;
  zone_id: string;
  provider_org_id: string;
  status: string;
  scheduled_date: string | null;
  access_notes_snapshot: string | null;
  started_at: string | null;
  completed_at: string | null;
  arrived_at: string | null;
  departed_at: string | null;
  arrived_source: string | null;
  departed_source: string | null;
  provider_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobSku {
  id: string;
  job_id: string;
  sku_id: string;
  sku_name_snapshot: string | null;
  duration_minutes_snapshot: number | null;
}

export interface JobChecklistItem {
  id: string;
  job_id: string;
  sku_id: string | null;
  label: string;
  is_required: boolean;
  status: string;
  reason_code: string | null;
  note: string | null;
  updated_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  sku_id: string | null;
  slot_key: string | null;
  storage_path: string;
  upload_status: string;
  captured_at: string | null;
  created_at: string;
}

export interface JobIssue {
  id: string;
  job_id: string;
  issue_type: string;
  severity: string;
  description: string | null;
  created_by_user_id: string;
  created_by_role: string;
  status: string;
  resolved_at: string | null;
  resolved_by_admin_user_id: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface JobEvent {
  id: string;
  job_id: string;
  actor_user_id: string;
  actor_role: string;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FullJobDetail {
  job: JobDetail;
  skus: JobSku[];
  checklist: JobChecklistItem[];
  photos: JobPhoto[];
  issues: JobIssue[];
  events: JobEvent[];
  property: { street_address: string; city: string; zip_code: string; gate_code: string | null; pets: any; parking_instructions: string | null; access_instructions: string | null } | null;
}

export function useJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job_detail", jobId],
    queryFn: async (): Promise<FullJobDetail> => {
      if (!jobId) throw new Error("No job ID");

      const [jobRes, skusRes, checklistRes, photosRes, issuesRes, eventsRes] = await Promise.all([
        supabase.from("jobs").select("*, property:properties(street_address, city, zip_code, gate_code, pets, parking_instructions, access_instructions)").eq("id", jobId).single(),
        supabase.from("job_skus").select("*").eq("job_id", jobId),
        supabase.from("job_checklist_items").select("*").eq("job_id", jobId).order("created_at"),
        supabase.from("job_photos").select("*").eq("job_id", jobId).order("created_at"),
        supabase.from("job_issues").select("*").eq("job_id", jobId).order("created_at", { ascending: false }),
        supabase.from("job_events").select("*").eq("job_id", jobId).order("created_at", { ascending: false }),
      ]);

      if (jobRes.error) throw jobRes.error;

      const { property, ...jobData } = jobRes.data as any;

      return {
        job: jobData as JobDetail,
        skus: (skusRes.data ?? []) as JobSku[],
        checklist: (checklistRes.data ?? []) as JobChecklistItem[],
        photos: (photosRes.data ?? []) as JobPhoto[],
        issues: (issuesRes.data ?? []) as JobIssue[],
        events: (eventsRes.data ?? []) as JobEvent[],
        property: property ?? null,
      };
    },
    enabled: !!jobId,
  });
}
