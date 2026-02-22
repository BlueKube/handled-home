import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Property = Tables<"properties">;

export interface PropertyFormData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  gate_code: string;
  access_instructions: string;
  parking_instructions: string;
  pets_input: string; // comma-separated string for UI
  notes: string;
}

function parsePetsInput(input: string): string[] {
  if (!input.trim()) return [];
  return input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function formatPetsForDisplay(pets: unknown): string {
  if (!pets) return "";
  if (Array.isArray(pets)) return (pets as string[]).join(", ");
  return "";
}

export function useProperty() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["property", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (formData: PropertyFormData) => {
      if (!user) throw new Error("Not authenticated");

      const payload = {
        street_address: formData.street_address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        gate_code: formData.gate_code.trim() || null,
        access_instructions: formData.access_instructions.trim() || null,
        parking_instructions: formData.parking_instructions.trim() || null,
        pets: parsePetsInput(formData.pets_input),
        notes: formData.notes.trim() || null,
      };

      const existingId = query.data?.id;

      if (existingId) {
        const { data, error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", existingId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("properties")
          .insert({ ...payload, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success("Home details saved");
      queryClient.invalidateQueries({ queryKey: ["property", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["hasProperty", user?.id] });
    },
    onError: (error) => {
      console.error("Property save error:", error);
      toast.error("Couldn't save. Check your connection and try again.");
    },
  });

  return {
    property: query.data as Property | null | undefined,
    isLoading: query.isLoading,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
