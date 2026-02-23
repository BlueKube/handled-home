import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminAudit() {
  const [entityType, setEntityType] = useState<string>("all");

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
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-h2 mb-1">Audit Logs</h1>
        <p className="text-caption">Complete admin action trail</p>
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
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(new Date(log.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{log.action}</TableCell>
                  <TableCell className="text-xs">
                    <span className="bg-muted px-2 py-0.5 rounded">{log.entity_type}</span>
                    {log.entity_id && (
                      <span className="text-muted-foreground ml-1 font-mono">{log.entity_id.slice(0, 8)}…</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                    {log.reason || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
