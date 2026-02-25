import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation thresholds
const MIN_FILE_SIZE_BYTES = 50_000; // 50KB minimum
const MAX_FILE_SIZE_BYTES = 20_000_000; // 20MB maximum
// Dimension checks reserved for future perceptual hashing implementation

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(
        JSON.stringify({ status: "error", message: "job_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get job info
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, provider_org_id")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) {
      return new Response(
        JSON.stringify({ status: "error", message: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get photos for this job
    const { data: photos, error: photoErr } = await supabase
      .from("job_photos")
      .select("id, storage_path, upload_status")
      .eq("job_id", job_id)
      .eq("upload_status", "uploaded");

    if (photoErr) throw photoErr;

    const results: Array<{ photo_id: string; status: string; checks: Record<string, string>; failures: string[] }> = [];
    const seenHashes: string[] = [];

    for (const photo of photos ?? []) {
      const checks: Record<string, string> = {};
      const failures: string[] = [];

      try {
        // Download file metadata from storage
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("job-photos")
          .download(photo.storage_path);

        if (dlErr || !fileData) {
          checks.file_access = "fail";
          failures.push("Could not access photo file");
        } else {
          const fileSize = fileData.size;

          // File size check
          if (fileSize < MIN_FILE_SIZE_BYTES) {
            checks.file_size = "fail";
            failures.push(`File too small (${Math.round(fileSize / 1024)}KB < ${MIN_FILE_SIZE_BYTES / 1000}KB minimum)`);
          } else if (fileSize > MAX_FILE_SIZE_BYTES) {
            checks.file_size = "fail";
            failures.push(`File too large (${Math.round(fileSize / 1_000_000)}MB > ${MAX_FILE_SIZE_BYTES / 1_000_000}MB maximum)`);
          } else {
            checks.file_size = "pass";
          }

          // Simple duplicate detection via file size hash
          // (Real implementation would use perceptual hashing)
          const sizeHash = `${fileSize}`;
          if (seenHashes.includes(sizeHash)) {
            checks.duplicate_hash = "fail";
            failures.push("Possible duplicate photo detected (same file size as another photo in this job)");
          } else {
            checks.duplicate_hash = "pass";
            seenHashes.push(sizeHash);
          }

          // For images, we can check basic properties from the blob type
          if (fileData.type && fileData.type.startsWith("image/")) {
            checks.format = "pass";
          } else {
            checks.format = "fail";
            failures.push("File is not a recognized image format");
          }
        }
      } catch (err) {
        checks.processing = "fail";
        failures.push(`Validation error: ${String(err)}`);
      }

      const validationStatus = failures.length === 0 ? "passed" : "failed";

      // Store result
      await supabase.from("photo_validation_results").insert({
        job_photo_id: photo.id,
        job_id,
        provider_org_id: job.provider_org_id,
        validation_status: validationStatus,
        checks,
        failure_reasons: failures.length > 0 ? failures : null,
      });

      results.push({ photo_id: photo.id, status: validationStatus, checks, failures });
    }

    // If any failed, notify provider
    const failedCount = results.filter((r) => r.status === "failed").length;
    if (failedCount > 0 && job.provider_org_id) {
      const { data: providerUser } = await supabase
        .from("provider_members")
        .select("user_id")
        .eq("provider_org_id", job.provider_org_id)
        .eq("status", "ACTIVE")
        .limit(1)
        .maybeSingle();

      if (providerUser) {
        await supabase.rpc("emit_notification", {
          p_user_id: providerUser.user_id,
          p_type: "photo_quality_fail",
          p_title: "Photo Quality Issue",
          p_body: `${failedCount} photo(s) didn't pass quality checks. Please retake before completing the job.`,
          p_data: { job_id, deep_link: `/provider/jobs/${job_id}/photos` },
        });
      }
    }

    return new Response(
      JSON.stringify({
        status: "completed",
        job_id,
        total_photos: (photos ?? []).length,
        passed: results.filter((r) => r.status === "passed").length,
        failed: failedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("validate-photo-quality error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
