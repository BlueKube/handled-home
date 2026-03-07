import { useEffect, useRef } from "react";
import { useByocActivation, type ByocInviteDetails } from "@/hooks/useByocActivation";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCategoryLabel } from "@/lib/serviceCategories";
import type { Json } from "@/integrations/supabase/types";

export interface ByocContext {
  /** Provider name (persisted to metadata) */
  providerName: string;
  /** Provider org ID */
  providerId: string;
  /** SKU/service name */
  serviceName: string;
  /** Category key (e.g. "mowing") */
  categoryKey: string;
  /** Zone ID from invite */
  zoneId: string;
  /** Category label (e.g. "Lawn Care") */
  categoryLabel: string;
  /** Whether this is a BYOC flow */
  isByocFlow: true;
}

interface UseByocOnboardingContextResult {
  invite: ReturnType<typeof useByocActivation>["invite"];
  activate: ReturnType<typeof useByocActivation>["activate"];
  byocContext: ByocContext | null;
  isLoading: boolean;
}

/**
 * Wraps useByocActivation and persists provider metadata to
 * customer_onboarding_progress.metadata so screens survive refresh.
 */
export function useByocOnboardingContext(token: string | undefined): UseByocOnboardingContextResult {
  const { user } = useAuth();
  const { invite, activate } = useByocActivation(token);
  const { progress } = useOnboardingProgress();
  const persisted = useRef(false);

  const inviteData = invite.data;
  const metadata = progress?.metadata as Record<string, unknown> | null;

  // Persist provider context to onboarding metadata on first load
  useEffect(() => {
    if (persisted.current || !inviteData || !progress) return;

    const alreadyPersisted = metadata?.byoc_provider_id === inviteData.provider_org?.id;
    if (alreadyPersisted) {
      persisted.current = true;
      return;
    }

    // Persist to metadata via upsert
    const newMetadata: Record<string, unknown> = {
      ...(metadata ?? {}),
      byoc_token: token,
      byoc_provider_id: inviteData.provider_org?.id ?? "",
      byoc_provider_name: inviteData.provider_org?.name ?? "",
      byoc_provider_logo_url: inviteData.provider_org?.logo_url ?? null,
      byoc_service_name: inviteData.sku?.name ?? getCategoryLabel(inviteData.category_key),
      byoc_category_key: inviteData.category_key,
      byoc_zone_id: inviteData.zone_id,
      byoc_sku_id: inviteData.sku_id,
      byoc_default_cadence: inviteData.default_cadence,
      byoc_level_id: inviteData.default_level_id,
    };

    persisted.current = true;

    // Write metadata directly without advancing onboarding steps
    if (progress?.id) {
      void supabase
        .from("customer_onboarding_progress")
        .update({ metadata: newMetadata as unknown as Json })
        .eq("id", progress.id)
        .then(({ error }) => { if (error) persisted.current = false; });
    } else if (user) {
      void supabase
        .from("customer_onboarding_progress")
        .insert([{ user_id: user.id, current_step: "property", metadata: newMetadata as unknown as Json }])
        .then(({ error }) => { if (error) persisted.current = false; });
    }
  }, [inviteData, progress, metadata, token, user]);

  // Build context from metadata (preferred) or live invite
  const byocContext = buildContext(metadata, inviteData);

  return {
    invite,
    activate,
    byocContext,
    isLoading: invite.isLoading,
  };
}

function buildContext(
  metadata: Record<string, unknown> | null,
  inviteData: ByocInviteDetails | null | undefined
): ByocContext | null {
  // Prefer persisted metadata
  if (metadata?.byoc_provider_id) {
    const categoryKey = (metadata.byoc_category_key as string) ?? "";
    return {
      providerName: (metadata.byoc_provider_name as string) ?? "Your Provider",
      providerId: (metadata.byoc_provider_id as string) ?? "",
      serviceName: (metadata.byoc_service_name as string) ?? getCategoryLabel(categoryKey),
      categoryKey,
      zoneId: (metadata.byoc_zone_id as string) ?? "",
      categoryLabel: getCategoryLabel(categoryKey),
      isByocFlow: true,
    };
  }

  // Fall back to live invite data
  if (inviteData) {
    return {
      providerName: inviteData.provider_org?.name ?? "Your Provider",
      providerId: inviteData.provider_org?.id ?? "",
      serviceName: inviteData.sku?.name ?? getCategoryLabel(inviteData.category_key),
      categoryKey: inviteData.category_key,
      zoneId: inviteData.zone_id,
      categoryLabel: getCategoryLabel(inviteData.category_key),
      isByocFlow: true,
    };
  }

  return null;
}
