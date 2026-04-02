import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, MapPin, Bell, Loader2, Users, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HelpTip } from "@/components/ui/help-tip";
import { Lead, Referral, CustomerLead } from "@/components/admin/leads/types";
import { LeadsTab } from "@/components/admin/leads/LeadsTab";
import { ReferralsTab } from "@/components/admin/leads/ReferralsTab";
import { CustomerLeadsTab } from "@/components/admin/leads/CustomerLeadsTab";

export default function AdminProviderLeads() {
  const queryClient = useQueryClient();

  const leads = useQuery({
    queryKey: ["admin-provider-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("provider_leads") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const referrals = useQuery({
    queryKey: ["admin-provider-referrals"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("provider_referrals") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Referral[];
    },
  });

  const customerLeads = useQuery({
    queryKey: ["admin-customer-leads"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("customer_leads") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CustomerLead[];
    },
  });

  const updateCustomerLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("customer_leads") as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-leads"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("provider_leads") as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-provider-leads"] });
      queryClient.invalidateQueries({ queryKey: ["provider-leads-funnel"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const updateReferralStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from("provider_referrals") as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-provider-referrals"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const statusCounts = (leads.data ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-h2">
          Provider Leads{" "}
          <HelpTip text="Leads collected from the provider browse page, referrals, and manual entry. Track interest and convert to applications." />
        </h1>
        <p className="text-sm text-muted-foreground">
          {leads.data?.length ?? 0} leads • {referrals.data?.length ?? 0} referrals
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["new", "contacted", "applied", "declined", "notified"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{statusCounts[s] ?? 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Leads
          </TabsTrigger>
          <TabsTrigger value="zips" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> By ZIP
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Referrals
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1.5">
            <UserCircle className="h-3.5 w-3.5" /> Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <LeadsTab
            leads={leads.data ?? []}
            isLoading={leads.isLoading}
            isError={leads.isError}
            onUpdateStatus={(id, status) => updateLeadStatus.mutate({ id, status })}
          />
        </TabsContent>

        <TabsContent value="zips">
          <ZipAggregationTab leads={leads.data ?? []} isLoading={leads.isLoading} queryClient={queryClient} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsTab
            referrals={referrals.data ?? []}
            isLoading={referrals.isLoading}
            isError={referrals.isError}
            onUpdateStatus={(id, status) => updateReferralStatus.mutate({ id, status })}
          />
        </TabsContent>

        <TabsContent value="customers">
          <CustomerLeadsTab
            leads={customerLeads.data ?? []}
            isLoading={customerLeads.isLoading}
            isError={customerLeads.isError}
            onUpdateStatus={(id, status) => updateCustomerLeadStatus.mutate({ id, status })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ZipAggregationTab({ leads, isLoading, queryClient }: { leads: Lead[]; isLoading: boolean; queryClient: ReturnType<typeof useQueryClient> }) {
  const [selectedZone, setSelectedZone] = useState("");
  const [notifying, setNotifying] = useState(false);

  const zones = useQuery({
    queryKey: ["admin-zones-for-notify"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id, name, zip_codes, status")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const zipData = useMemo(() => {
    const map = new Map<string, { count: number; categories: Set<string> }>();
    for (const lead of leads) {
      const entry = map.get(lead.zip_code) ?? { count: 0, categories: new Set<string>() };
      entry.count++;
      for (const c of lead.categories ?? []) entry.categories.add(c);
      map.set(lead.zip_code, entry);
    }
    return Array.from(map.entries())
      .map(([zip, data]) => ({ zip, count: data.count, categories: Array.from(data.categories) }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  const handleNotify = async () => {
    if (!selectedZone) return;
    setNotifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-zone-leads", {
        body: { zone_id: selectedZone },
      });
      if (error) throw error;
      const result = data as { notified_count: number; message: string };
      toast.success(result.message || `Notified ${result.notified_count} leads`);
      queryClient.invalidateQueries({ queryKey: ["admin-provider-leads"] });
      queryClient.invalidateQueries({ queryKey: ["provider-leads-funnel"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to notify leads");
    } finally {
      setNotifying(false);
    }
  };

  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Notify Zone Leads</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Mark all new leads in a zone's ZIP codes as "notified". Use when a zone transitions to launch.
          </p>
          <div className="flex gap-2">
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select zone..." />
              </SelectTrigger>
              <SelectContent>
                {(zones.data ?? []).map((z: any) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name} ({(z.zip_codes ?? []).length} ZIPs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleNotify} disabled={!selectedZone || notifying}>
              {notifying ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Bell className="h-4 w-4 mr-1.5" />}
              {notifying ? "Notifying..." : "Notify"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ZIP aggregation table */}
      {zipData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No ZIP data yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">ZIP Code</th>
                  <th className="text-left p-3 font-medium">Leads</th>
                  <th className="text-left p-3 font-medium">Categories Interested</th>
                </tr>
              </thead>
              <tbody>
                {zipData.map((row) => (
                  <tr key={row.zip} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{row.zip}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{row.count}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {row.categories.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
