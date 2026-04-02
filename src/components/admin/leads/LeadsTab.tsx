import { useState } from "react";
import { Filter, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Lead, STATUS_COLORS, LEAD_STATUS_OPTIONS } from "./types";

export function LeadsTab({ leads, isLoading, isError, onUpdateStatus }: {
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
                  <th className="text-left p-3 font-medium">Phone</th>
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
                    <td className="p-3 text-xs text-muted-foreground">{lead.phone || "—"}</td>
                    <td className="p-3">{lead.zip_code}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(lead.categories ?? []).map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                        {(lead.categories ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
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
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                      {lead.notified_at && (
                        <span className="block text-[10px] text-violet-500">
                          Notified {new Date(lead.notified_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
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
