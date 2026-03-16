import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";

function DiffBlock({ label, data }: { label: string; data: any }) {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{label}</p>
      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap max-h-32">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function AdminAudit() {
  const [entityType, setEntityType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-audit-log", entityType],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityType && entityType !== "all") {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="animate-fade-in p-6 space-y-4">
      <div>
        <h1 className="text-h2 mb-1">Audit Logs</h1>
        <p className="text-caption">Complete admin action trail with before/after state</p>
      </div>

      <Select value={entityType} onValueChange={setEntityType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="subscription">Subscription</SelectItem>
          <SelectItem value="job_issue">Job Issue</SelectItem>
          <SelectItem value="zone">Zone</SelectItem>
          <SelectItem value="provider_org">Provider Org</SelectItem>
          <SelectItem value="market_state">Market State</SelectItem>
          <SelectItem value="growth_config">Growth Config</SelectItem>
          <SelectItem value="pricing">Pricing</SelectItem>
          <SelectItem value="payout">Payout</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded" />)}
        </div>
      ) : !logs?.length ? (
        <p className="text-muted-foreground text-center py-12">No audit logs found.</p>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => {
                const hasDiff = log.before || log.after;
                const isExpanded = expandedId === log.id;
                return (
                  <Collapsible key={log.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : log.id)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className={hasDiff ? "cursor-pointer hover:bg-muted/50" : ""}>
                          <TableCell className="w-8 px-2">
                            {hasDiff && <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(log.created_at), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{log.action}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                            {log.entity_id && (
                              <span className="text-muted-foreground ml-1 font-mono">{log.entity_id.slice(0, 8)}…</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                            {log.reason || "—"}
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      {hasDiff && (
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div className="px-6 py-3 bg-muted/20 border-t space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <DiffBlock label="Before" data={log.before} />
                                  <DiffBlock label="After" data={log.after} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      )}
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
