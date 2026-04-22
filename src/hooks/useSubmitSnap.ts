import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/lib/imageCompression";

export type SnapArea = "bath" | "kitchen" | "yard" | "exterior" | "other";
export type SnapRouting = "next_visit" | "ad_hoc";

export type SnapSubmitInput = {
  file: File;
  description?: string;
  area?: SnapArea | null;
  routing: SnapRouting;
  creditsToHold: number;
};

export type SnapSubmitResult = {
  snapId: string;
  newBalance: number;
};

// Placeholder defaults until Batch 4.3 wires AI-estimated hold amounts.
export const SNAP_HOLD_DEFAULTS: Record<SnapRouting, number> = {
  next_visit: 120,
  ad_hoc: 200,
};

export function useSubmitSnap() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<SnapSubmitResult, Error, SnapSubmitInput>({
    mutationFn: async ({ file, description, area, routing, creditsToHold }) => {
      if (!user) throw new Error("Not authenticated");

      // Resolve the active subscription + property. Snap requires an active
      // subscription because credits are held against it.
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

      // Compress + upload. No DB row yet — if upload fails there's nothing to clean.
      const compressed = await compressImage(file, 1200);
      const { error: uploadErr } = await supabase.storage
        .from("snap-photos")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
      if (uploadErr) throw uploadErr;

      // Insert snap_requests row. Types for this table aren't regenerated yet
      // (sandbox lacks SUPABASE_ACCESS_TOKEN) so cast to `any` at the boundary.
      // Will be removed in the pre-4.3 types refresh.
      const { error: insertErr } = await (supabase.from("snap_requests") as any)
        .insert({
          id: snapId,
          customer_id: user.id,
          property_id: subscription.property_id,
          subscription_id: subscription.id,
          photo_paths: [path],
          description: description ?? null,
          area: area ?? null,
          routing,
          status: "submitted",
          credits_held: creditsToHold,
        });
      if (insertErr) {
        // Best-effort cleanup of the uploaded object.
        await supabase.storage.from("snap-photos").remove([path]);
        throw insertErr;
      }

      // Hold credits. spend_handles currently records reference_type='job' —
      // Batch 4.4 will add a snap-aware variant or backfill the label.
      const { data: spendResult, error: spendErr } = await supabase.rpc(
        "spend_handles",
        {
          p_subscription_id: subscription.id,
          p_customer_id: user.id,
          p_amount: creditsToHold,
          p_reference_id: snapId,
        },
      );
      if (spendErr) {
        await (supabase.from("snap_requests") as any).delete().eq("id", snapId);
        await supabase.storage.from("snap-photos").remove([path]);
        throw spendErr;
      }

      const result = spendResult as { success: boolean; error?: string; new_balance?: number };
      if (!result.success) {
        await (supabase.from("snap_requests") as any).delete().eq("id", snapId);
        await supabase.storage.from("snap-photos").remove([path]);
        if (result.error === "insufficient_handles") {
          throw new Error("Not enough credits to submit this snap.");
        }
        throw new Error(result.error ?? "Failed to hold credits");
      }

      return { snapId, newBalance: result.new_balance ?? 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["handle_transactions", user?.id] });
    },
  });
}
