import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const STATUS_OPTIONS = ["all", "new", "contacted", "applied", "declined", "notified"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  notified: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
};

export default function AdminProviderLeads() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zipFilter, setZipFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

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

  const updateStatus = useMutation({
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

  const filtered = (leads.data ?? []).filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (zipFilter && !lead.zip_code.includes(zipFilter)) return false;
    if (categoryFilter && !lead.categories.some((c) => c.toLowerCase().includes(categoryFilter.toLowerCase()))) return false;
    return true;
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
          {leads.data?.length ?? 0} total leads
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["new", "contacted", "applied", "declined", "notified"] as const).map((s) => (
          <Card
            key={s}
            className={`cursor-pointer transition-all ${statusFilter === s ? "ring-1 ring-primary" : ""}`}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
          >
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold">{statusCounts[s] ?? 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Filter by ZIP..."
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value)}
          className="w-32"
        />
        <Input
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {/* Table */}
      {leads.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : leads.isError ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">Failed to load leads.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No leads yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Provider leads will appear here when collected from the browse page.
            </p>
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
                          <Badge key={c} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                        {lead.categories.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Select
                        value={lead.status}
                        onValueChange={(s) => updateStatus.mutate({ id: lead.id, status: s })}
                      >
                        <SelectTrigger className="h-7 w-28">
                          <Badge className={`text-xs ${STATUS_COLORS[lead.status] ?? ""}`}>
                            {lead.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {lead.status === "new" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => updateStatus.mutate({ id: lead.id, status: "contacted" })}
                        >
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
