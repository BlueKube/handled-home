import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useServiceDayActions() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["service-day-assignment"] });
    qc.invalidateQueries({ queryKey: ["service-day-offers"] });
    qc.invalidateQueries({ queryKey: ["service-day-expired"] });
  };

  const createOrRefreshOffer = useMutation({
    mutationFn: async (propertyId: string) => {
      const { data, error } = await supabase.rpc(
        "create_or_refresh_service_day_offer",
        { p_property_id: propertyId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.message),
  });

  const confirmServiceDay = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase.rpc(
        "confirm_service_day",
        { p_assignment_id: assignmentId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Service Day confirmed!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectServiceDay = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase.rpc(
        "reject_service_day_once",
        { p_assignment_id: assignmentId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
    onError: (err: any) => toast.error(err.message),
  });

  const selectAlternative = useMutation({
    mutationFn: async ({
      assignmentId,
      offerId,
    }: {
      assignmentId: string;
      offerId: string;
    }) => {
      const { data, error } = await supabase.rpc(
        "select_alternative_service_day",
        { p_assignment_id: assignmentId, p_offer_id: offerId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Service Day confirmed!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const savePreferences = useMutation({
    mutationFn: async ({
      propertyId,
      days,
      alignDaysPreference,
      mustBeHome,
      mustBeHomeWindow,
    }: {
      propertyId: string;
      days?: string[];
      alignDaysPreference?: boolean;
      mustBeHome?: boolean;
      mustBeHomeWindow?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload: Record<string, unknown> = {
        customer_id: user.id,
        property_id: propertyId,
      };
      if (days !== undefined) payload.preferred_days = days;
      if (alignDaysPreference !== undefined) payload.align_days_preference = alignDaysPreference;
      if (mustBeHome !== undefined) payload.must_be_home = mustBeHome;
      if (mustBeHomeWindow !== undefined) payload.must_be_home_window = mustBeHomeWindow;

      const { error } = await supabase
        .from("service_day_preferences")
        .upsert(payload as any, { onConflict: "customer_id,property_id" });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Preferences saved"),
    onError: (err: any) => toast.error(err.message),
  });

  return {
    createOrRefreshOffer,
    confirmServiceDay,
    rejectServiceDay,
    selectAlternative,
    savePreferences,
  };
}
