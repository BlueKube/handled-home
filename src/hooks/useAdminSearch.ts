import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: "customer" | "provider" | "job" | "subscription";
  id: string;
  label: string;
  detail: string;
  href: string;
}

export function useAdminSearch(query: string) {
  return useQuery({
    queryKey: ["admin-search", query],
    enabled: query.length >= 2,
    queryFn: async (): Promise<SearchResult[]> => {
      const results: SearchResult[] = [];
      const q = query.trim();

      // UUID pattern — search by ID directly
      const isUuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){0,4}/i.test(q);

      const promises: Array<Promise<void> | PromiseLike<void>> = [];

      // Search jobs by ID prefix
      if (isUuid) {
        promises.push(
          supabase
            .from("jobs")
            .select("id, status, scheduled_date, zone_id")
            .ilike("id", `${q}%`)
            .limit(5)
            .then(({ data }) => {
              (data ?? []).forEach((j: any) => {
                results.push({
                  type: "job",
                  id: j.id,
                  label: `Job ${j.id.slice(0, 8)}`,
                  detail: `${j.status} · ${j.scheduled_date || "unscheduled"}`,
                  href: `/admin/jobs/${j.id}`,
                });
              });
            })
        );

        // Search subscriptions by ID
        promises.push(
          supabase
            .from("subscriptions")
            .select("id, status, plan_id")
            .ilike("id", `${q}%`)
            .limit(5)
            .then(({ data }) => {
              (data ?? []).forEach((s: any) => {
                results.push({
                  type: "subscription",
                  id: s.id,
                  label: `Sub ${s.id.slice(0, 8)}`,
                  detail: s.status,
                  href: `/admin/subscriptions`,
                });
              });
            })
        );
      }

      // Search profiles by email/name
      promises.push(
        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(8)
          .then(({ data }) => {
            (data ?? []).forEach((p: any) => {
              results.push({
                type: "customer",
                id: p.id,
                label: p.full_name || p.email || "Unknown",
                detail: [p.email, p.phone].filter(Boolean).join(" · "),
                href: `/admin/billing/customers/${p.id}`,
              });
            });
          })
      );

      // Search provider orgs by name
      promises.push(
        supabase
          .from("provider_orgs")
          .select("id, business_name, contact_email")
          .ilike("business_name", `%${q}%`)
          .limit(5)
          .then(({ data }) => {
            (data ?? []).forEach((o: any) => {
              results.push({
                type: "provider",
                id: o.id,
                label: o.business_name || "Provider",
                detail: o.contact_email || "",
                href: `/admin/providers/${o.id}`,
              });
            });
          })
      );

      await Promise.all(promises);

      return results;
    },
    staleTime: 10_000,
  });
}
