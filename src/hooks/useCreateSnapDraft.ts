import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/lib/imageCompression";

export type SnapArea = "bath" | "kitchen" | "yard" | "exterior" | "other";

export type SnapDraftInput = {
  file: File;
  description?: string;
  area?: SnapArea | null;
};

export type SnapDraft = {
  snapId: string;
  subscriptionId: string;
  propertyId: string;
  photoPath: string;
};

// Phase 1 of the 3-step Snap flow (4.3):
// upload photo + insert a `status='submitted'` snap_requests row. No credits
// are held yet — useFinalizeSnap does that after classification.
export function useCreateSnapDraft() {
  const { user } = useAuth();

  return useMutation<SnapDraft, Error, SnapDraftInput>({
    mutationFn: async ({ file, description, area }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: subscription, error: subErr } = await supabase
        .from("subscriptions")
        .select("id, property_id")
        .eq("customer_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subErr) throw subErr;
      if (!subscription) throw new Error("No active subscription");
      if (!subscription.property_id) throw new Error("Subscription has no property");

      const snapId = crypto.randomUUID();
      const photoId = crypto.randomUUID();
      const path = `${user.id}/${snapId}/${photoId}.jpg`;

      const compressed = await compressImage(file, 1200);
      const { error: uploadErr } = await supabase.storage
        .from("snap-photos")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
      if (uploadErr) throw uploadErr;

      // Types gap: snap_requests not yet in src/integrations/supabase/types.ts
      // (sandbox lacks SUPABASE_ACCESS_TOKEN). See batch spec OVERRIDE.
      const { error: insertErr } = await (supabase.from("snap_requests") as any)
        .insert({
          id: snapId,
          customer_id: user.id,
          property_id: subscription.property_id,
          subscription_id: subscription.id,
          photo_paths: [path],
          description: description ?? null,
          area: area ?? null,
          status: "submitted",
          credits_held: 0,
        });

      if (insertErr) {
        await supabase.storage.from("snap-photos").remove([path]).catch(() => {});
        throw insertErr;
      }

      return {
        snapId,
        subscriptionId: subscription.id,
        propertyId: subscription.property_id,
        photoPath: path,
      };
    },
  });
}

// Cleanup for drafts that never got finalized — customer closed the sheet
// mid-flow. Fire-and-forget; errors are logged but don't surface.
//
// Race guard (Lane 4 M1, Batch 4.3): the row DELETE already filters on
// credits_held=0 so a finalized row survives, but the storage DELETE has no
// equivalent condition. Read the DB state first and short-circuit entirely
// when credits_held > 0 — this protects the photo of a finalized snap if
// the user closes the sheet in the microsecond window between spend_handles
// succeeding and React flipping `finalized`.
export async function cleanupSnapDraft(draft: SnapDraft): Promise<void> {
  try {
    const { data, error } = await (supabase.from("snap_requests") as any)
      .select("credits_held")
      .eq("id", draft.snapId)
      .maybeSingle();
    if (error) {
      console.warn("cleanupSnapDraft state read failed:", error);
      return;
    }
    if (!data || (data as { credits_held: number }).credits_held > 0) {
      // Row was finalized or already gone — leave both the row and the photo.
      return;
    }
  } catch (err) {
    console.warn("cleanupSnapDraft state read threw:", err);
    return;
  }

  try {
    await (supabase.from("snap_requests") as any)
      .delete()
      .eq("id", draft.snapId)
      .eq("credits_held", 0);
  } catch (err) {
    console.warn("cleanupSnapDraft row delete failed:", err);
  }
  try {
    await supabase.storage.from("snap-photos").remove([draft.photoPath]);
  } catch (err) {
    console.warn("cleanupSnapDraft photo remove failed:", err);
  }
}
