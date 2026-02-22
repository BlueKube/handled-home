import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useJobActions(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["job_detail", jobId] });
    queryClient.invalidateQueries({ queryKey: ["provider_jobs"] });
  };

  const startJob = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error("No job ID");
      const { data, error } = await supabase.rpc("start_job", { p_job_id: jobId });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  // S4: Write checklist events after update
  const updateChecklistItem = useMutation({
    mutationFn: async (params: { itemId: string; status: string; reason_code?: string; note?: string }) => {
      const { itemId, status, reason_code, note } = params;
      const { error } = await supabase
        .from("job_checklist_items")
        .update({ status, reason_code: reason_code ?? null, note: note ?? null })
        .eq("id", itemId);
      if (error) throw error;

      // Write checklist event
      if (jobId && user) {
        const eventType = status === "DONE" ? "CHECKLIST_ITEM_DONE" : "CHECKLIST_ITEM_NOT_DONE";
        await supabase.from("job_events").insert({
          job_id: jobId,
          actor_user_id: user.id,
          actor_role: "provider",
          event_type: eventType,
          metadata: { item_id: itemId, status, reason_code },
        });
      }
    },
    onSuccess: invalidate,
  });

  const uploadPhoto = useMutation({
    mutationFn: async (params: { file: File; slotKey?: string; skuId?: string }) => {
      if (!jobId || !user) throw new Error("Missing context");

      // Compress image
      const compressed = await compressImage(params.file, 1200);

      const photoId = crypto.randomUUID();
      const storagePath = `${jobId}/${photoId}.jpg`;

      // Insert record first as PENDING
      const { data: photoRecord, error: insertErr } = await supabase
        .from("job_photos")
        .insert({
          job_id: jobId,
          sku_id: params.skuId ?? null,
          slot_key: params.slotKey ?? null,
          storage_path: storagePath,
          upload_status: "PENDING",
          captured_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from("job-photos")
        .upload(storagePath, compressed, { contentType: "image/jpeg", upsert: true });

      if (uploadErr) {
        await supabase.from("job_photos").update({ upload_status: "FAILED" }).eq("id", photoRecord.id);
        throw uploadErr;
      }

      // Mark as uploaded
      await supabase.from("job_photos").update({ upload_status: "UPLOADED" }).eq("id", photoRecord.id);

      // Write event
      await supabase.from("job_events").insert({
        job_id: jobId,
        actor_user_id: user.id,
        actor_role: "provider",
        event_type: "PHOTO_UPLOADED",
        metadata: { photo_id: photoRecord.id, slot_key: params.slotKey },
      });

      return photoRecord;
    },
    onSuccess: invalidate,
  });

  const retryUpload = useMutation({
    mutationFn: async (params: { photoId: string; file: File }) => {
      const { data: photo, error: fetchErr } = await supabase
        .from("job_photos")
        .select("*")
        .eq("id", params.photoId)
        .single();
      if (fetchErr || !photo) throw fetchErr ?? new Error("Photo not found");

      const compressed = await compressImage(params.file, 1200);
      const { error: uploadErr } = await supabase.storage
        .from("job-photos")
        .upload(photo.storage_path, compressed, { contentType: "image/jpeg", upsert: true });

      if (uploadErr) throw uploadErr;
      await supabase.from("job_photos").update({ upload_status: "UPLOADED" }).eq("id", params.photoId);
    },
    onSuccess: invalidate,
  });

  const reportIssue = useMutation({
    mutationFn: async (params: { issue_type: string; severity?: string; description?: string }) => {
      if (!jobId) throw new Error("No job ID");
      const { data, error } = await supabase.rpc("report_job_issue", {
        p_job_id: jobId,
        p_issue_type: params.issue_type,
        p_severity: params.severity ?? "MED",
        p_description: params.description ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const completeJob = useMutation({
    mutationFn: async (providerSummary?: string) => {
      if (!jobId) throw new Error("No job ID");
      const { data, error } = await supabase.rpc("complete_job", {
        p_job_id: jobId,
        p_provider_summary: providerSummary ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  // S5: Use spec event type names with source suffix
  const recordArrival = useMutation({
    mutationFn: async (source: "auto" | "manual" = "manual") => {
      if (!jobId || !user) throw new Error("Missing context");
      const { error } = await supabase
        .from("jobs")
        .update({ arrived_at: new Date().toISOString(), arrived_source: source })
        .eq("id", jobId);
      if (error) throw error;
      await supabase.from("job_events").insert({
        job_id: jobId, actor_user_id: user.id, actor_role: "provider",
        event_type: source === "auto" ? "ARRIVED_AUTO" : "ARRIVED_MANUAL",
        metadata: { source },
      });
    },
    onSuccess: invalidate,
  });

  const recordDeparture = useMutation({
    mutationFn: async (source: "auto" | "manual" = "manual") => {
      if (!jobId || !user) throw new Error("Missing context");
      const { error } = await supabase
        .from("jobs")
        .update({ departed_at: new Date().toISOString(), departed_source: source })
        .eq("id", jobId);
      if (error) throw error;
      await supabase.from("job_events").insert({
        job_id: jobId, actor_user_id: user.id, actor_role: "provider",
        event_type: source === "auto" ? "DEPARTED_AUTO" : "DEPARTED_MANUAL",
        metadata: { source },
      });
    },
    onSuccess: invalidate,
  });

  return { startJob, updateChecklistItem, uploadPhoto, retryUpload, reportIssue, completeJob, recordArrival, recordDeparture };
}

// Canvas-based image compression
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
