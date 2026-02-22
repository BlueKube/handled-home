import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export function useZoneLookup(zipCode: string) {
  const [debouncedZip, setDebouncedZip] = useState("");

  useEffect(() => {
    if (!isValidZip(zipCode)) {
      setDebouncedZip("");
      return;
    }
    const timer = setTimeout(() => setDebouncedZip(zipCode), 300);
    return () => clearTimeout(timer);
  }, [zipCode]);

  const query = useQuery({
    queryKey: ["zoneLookup", debouncedZip],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("name")
        .contains("zip_codes", [debouncedZip])
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isValidZip(debouncedZip),
  });

  const isCheckable = isValidZip(zipCode);

  return {
    zoneName: query.data?.name ?? null,
    isLoading: isCheckable && (debouncedZip !== zipCode || query.isLoading),
    isNotCovered: isCheckable && !query.isLoading && debouncedZip === zipCode && !query.data,
    isCovered: isCheckable && !query.isLoading && debouncedZip === zipCode && !!query.data,
  };
}
