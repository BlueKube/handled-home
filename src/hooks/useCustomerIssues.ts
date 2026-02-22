import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerIssueRow {
  id: string;
  job_id: string;
  reason: string;
  note: string;
  status: string;
  photo_storage_path: string | null;
  photo_upload_status: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomerIssues(statusFilter?: string) {
  const { user } = useAuth();

  const query = useQuery<CustomerIssueRow[]>({
    queryKey: ["customer_issues", user?.id, statusFilter],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      let q = supabase
        .from("customer_issues")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter) {
        q = q.eq("status", statusFilter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CustomerIssueRow[];
    },
  });

  return query;
}

export function useSubmitCustomerIssue() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      jobId: string;
      reason: string;
      note: string;
      photo?: File;
    }) => {
      if (!user) throw new Error("Not authenticated");

      let photoPath: string | null = null;
      let photoStatus: string | null = null;

      // Upload photo if provided
      if (params.photo) {
        const compressed = await compressImage(params.photo, 1200);
        const photoId = crypto.randomUUID();
        photoPath = `issues/${params.jobId}/${photoId}.jpg`;
        photoStatus = "PENDING";

        const { error: uploadErr } = await supabase.storage
          .from("job-photos")
          .upload(photoPath, compressed, { contentType: "image/jpeg", upsert: true });

        if (uploadErr) {
          photoStatus = "FAILED";
        } else {
          photoStatus = "UPLOADED";
        }
      }

      const { data, error } = await supabase
        .from("customer_issues")
        .insert({
          job_id: params.jobId,
          customer_id: user.id,
          reason: params.reason,
          note: params.note,
          photo_storage_path: photoPath,
          photo_upload_status: photoStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_issues"] });
      qc.invalidateQueries({ queryKey: ["customer_visit_detail"] });
    },
  });
}

// Canvas-based image compression (same pattern as useJobActions)
async function compressImage(file: File, maxDim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
