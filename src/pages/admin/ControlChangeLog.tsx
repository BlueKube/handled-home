import { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { useRollbackPricingMutation } from "@/hooks/useZonePricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { RotateCcw, ChevronDown } from "lucide-react";

const ENTITY_TYPES = [
  { value: "", label: "All" },
  { value: "sku_pricing_base", label: "SKU Pricing Base" },
  { value: "sku_pricing_zone_overrides", label: "Zone Pricing Overrides" },
  { value: "provider_payout_base", label: "Payout Base" },
  { value: "provider_payout_zone_overrides", label: "Payout Zone Overrides" },
  { value: "provider_org_contracts", label: "Org Contracts" },
  { value: "payout_overtime_rules", label: "Overtime Rules" },
  { value: "admin_change_requests", label: "Change Requests" },
];

export default function ControlChangeLog() {
  const { isSuperuser } = useAdminMembership();
  const [entityType, setEntityType] = useState("");
  const { data: logs, isLoading } = useAuditLog(entityType || undefined, 200);
  const rollbackMut = useRollbackPricingMutation();

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;

  const isRollbackable = (action: string) =>
    ["set_zone_pricing_override", "set_sku_base_price", "set_provider_payout_zone_override", "set_provider_payout_base"].includes(action);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Change Log</h1>
        <p className="text-sm text-muted-foreground mt-1">All versioned config changes with rollback.</p>
      </div>

      <div className="flex items-end gap-3">
        <div className="w-64">
          <Label className="text-xs">Filter by entity type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>{ENTITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Audit Trail</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Time</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead>
                <TableHead>Role</TableHead><TableHead>Reason</TableHead><TableHead className="w-24">Details</TableHead>
                {isSuperuser && <TableHead className="w-20">Rollback</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <Collapsible key={log.id} asChild>
                    <>
                      <TableRow>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), "MMM d HH:mm")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{log.action}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{log.entity_type}{log.entity_id ? ` / ${log.entity_id.slice(0, 8)}…` : ""}</TableCell>
                        <TableCell className="text-xs">{log.actor_admin_role ?? "—"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{log.reason ?? "—"}</TableCell>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs"><ChevronDown className="h-3 w-3 mr-1" />Diff</Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        {isSuperuser && (
                          <TableCell>
                            {isRollbackable(log.action) && log.entity_id && (
                              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => rollbackMut.mutate({ override_id: log.entity_id!, reason: `Rollback of ${log.action}` })} disabled={rollbackMut.isPending}>
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={7}>
                            <div className="grid grid-cols-2 gap-4 py-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Before</p>
                                <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">{log.before ? JSON.stringify(log.before, null, 2) : "—"}</pre>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">After</p>
                                <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">{log.after ? JSON.stringify(log.after, null, 2) : "—"}</pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
                {(!logs || logs.length === 0) && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No audit log entries</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
