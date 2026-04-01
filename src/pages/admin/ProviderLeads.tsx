import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Filter, Users, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HelpTip } from "@/components/ui/help-tip";

type Lead = {
  id: string;
  email: string;
  zip_code: string;
  categories: string[];
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type Referral = {
  id: string;
  referrer_email: string;
  referred_name: string;
  referred_contact: string;
  referred_category: string;
  zip_code: string;
  status: string;
  created_at: string;
};

const LEAD_STATUS_OPTIONS = ["all", "new", "contacted", "applied", "declined", "notified"] as const;
const REFERRAL_STATUS_OPTIONS = ["all", "new", "contacted", "applied", "declined"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  notified: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
};

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
          <ZipAggregationTab leads={leads.data ?? []} isLoading={leads.isLoading} />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsTab
            referrals={referrals.data ?? []}
            isLoading={referrals.isLoading}
            isError={referrals.isError}
            onUpdateStatus={(id, status) => updateReferralStatus.mutate({ id, status })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeadsTab({ leads, isLoading, isError, onUpdateStatus }: {
  leads: Lead[];
  isLoading: boolean;
  isError: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zipFilter, setZipFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (zipFilter && !lead.zip_code.includes(zipFilter)) return false;
    if (categoryFilter && !(lead.categories ?? []).some((c) => c.toLowerCase().includes(categoryFilter.toLowerCase()))) return false;
    return true;
  });

  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  if (isError) return <Card><CardContent className="py-8 text-center"><p className="text-sm text-destructive">Failed to load leads.</p></CardContent></Card>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Filter by ZIP..." value={zipFilter} onChange={(e) => setZipFilter(e.target.value)} className="w-32" />
        <Input placeholder="Filter by category..." value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No leads yet</p>
            <p className="text-xs text-muted-foreground mt-1">Provider leads will appear here when collected from the browse page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">ZIP</th>
                  <th className="text-left p-3 font-medium">Categories</th>
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{lead.email}</td>
                    <td className="p-3">{lead.zip_code}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.categories.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                        {lead.categories.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">{lead.source}</Badge>
                    </td>
                    <td className="p-3">
                      <Select value={lead.status} onValueChange={(s) => onUpdateStatus(lead.id, s)}>
                        <SelectTrigger className="h-7 w-28">
                          <Badge className={`text-xs ${STATUS_COLORS[lead.status] ?? ""}`}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      {lead.status === "new" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onUpdateStatus(lead.id, "contacted")}>
                          Mark Contacted
                        </Button>
                      )}
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

function ZipAggregationTab({ leads, isLoading }: { leads: Lead[]; isLoading: boolean }) {
  const zipData = useMemo(() => {
    const map = new Map<string, { count: number; categories: Set<string> }>();
    for (const lead of leads) {
      const entry = map.get(lead.zip_code) ?? { count: 0, categories: new Set<string>() };
      entry.count++;
      for (const c of lead.categories) entry.categories.add(c);
      map.set(lead.zip_code, entry);
    }
    return Array.from(map.entries())
      .map(([zip, data]) => ({ zip, count: data.count, categories: Array.from(data.categories) }))
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;

  if (zipData.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No ZIP data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
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
  );
}

function ReferralsTab({ referrals, isLoading, isError, onUpdateStatus }: {
  referrals: Referral[];
  isLoading: boolean;
  isError: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  if (isError) return <Card className="mt-4"><CardContent className="py-8 text-center"><p className="text-sm text-destructive">Failed to load referrals.</p></CardContent></Card>;

  if (referrals.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No referrals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Provider-to-provider referrals from the "Know someone?" form will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Referred By</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Contact</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">ZIP</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((ref) => (
              <tr key={ref.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 text-xs">{ref.referrer_email}</td>
                <td className="p-3 font-medium">{ref.referred_name}</td>
                <td className="p-3 text-xs">{ref.referred_contact}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs capitalize">
                    {ref.referred_category.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="p-3">{ref.zip_code}</td>
                <td className="p-3">
                  <Select value={ref.status} onValueChange={(s) => onUpdateStatus(ref.id, s)}>
                    <SelectTrigger className="h-7 w-28">
                      <Badge className={`text-xs ${STATUS_COLORS[ref.status] ?? ""}`}>{ref.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
