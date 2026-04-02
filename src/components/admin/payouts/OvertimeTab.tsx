import { useState, useMemo } from "react";
import { useOvertimeRules, useSetOvertimeRulesMutation } from "@/hooks/useProviderPayoutAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { cents } from "./shared";

interface OvertimeTabProps {
  skus: Array<{ id: string; name: string }>;
  zones: Array<{ id: string; name: string }>;
  isSuperuser: boolean;
}

export function OvertimeTab({ skus, zones, isSuperuser }: OvertimeTabProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const { data: overtimeRules } = useOvertimeRules(selectedZoneId || undefined);
  const setOvertimeMut = useSetOvertimeRulesMutation();

  const [otOpen, setOtOpen] = useState(false);
  const [otSkuId, setOtSkuId] = useState("");
  const [otExpected, setOtExpected] = useState("");
  const [otRate, setOtRate] = useState("");
  const [otStart, setOtStart] = useState("");
  const [otCap, setOtCap] = useState("");
  const [otReason, setOtReason] = useState("");

  const latestOtBysku = useMemo(() => {
    const map = new Map<string, NonNullable<typeof overtimeRules>[number]>();
    if (!overtimeRules) return map;
    for (const r of overtimeRules) {
      if (!map.has(r.sku_id)) map.set(r.sku_id, r);
    }
    return map;
  }, [overtimeRules]);

  const handleSaveOvertime = () => {
    if (!selectedZoneId || !otSkuId) return;
    if (!otReason.trim()) { toast.error("Reason is required"); return; }
    setOvertimeMut.mutate({
      zone_id: selectedZoneId, sku_id: otSkuId,
      expected_minutes: parseInt(otExpected), overtime_rate_cents_per_min: parseInt(otRate),
      overtime_start_after_minutes: parseInt(otStart), overtime_cap_cents: Math.round(parseFloat(otCap) * 100),
      reason: otReason.trim(),
    }, { onSuccess: () => setOtOpen(false) });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Overtime Rules by Zone & SKU</CardTitle>
        {isSuperuser && selectedZoneId && (
          <Dialog open={otOpen} onOpenChange={setOtOpen}>
            <DialogTrigger asChild><Button size="sm">Add Rule</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Overtime Rule</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>SKU</Label>
                  <Select value={otSkuId} onValueChange={setOtSkuId}>
                    <SelectTrigger><SelectValue placeholder="Select SKU" /></SelectTrigger>
                    <SelectContent>{skus?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Expected mins</Label><Input type="number" value={otExpected} onChange={(e) => setOtExpected(e.target.value)} /></div>
                  <div><Label className="text-xs">OT starts after mins</Label><Input type="number" value={otStart} onChange={(e) => setOtStart(e.target.value)} /></div>
                  <div><Label className="text-xs">OT rate ¢/min</Label><Input type="number" value={otRate} onChange={(e) => setOtRate(e.target.value)} /></div>
                  <div><Label className="text-xs">OT cap $</Label><Input type="number" step="0.01" value={otCap} onChange={(e) => setOtCap(e.target.value)} /></div>
                </div>
                <div><Label>Reason</Label><Textarea value={otReason} onChange={(e) => setOtReason(e.target.value)} placeholder="Why?" /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleSaveOvertime} disabled={setOvertimeMut.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-64"><Label className="text-xs">Zone</Label>
          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
            <SelectTrigger><SelectValue placeholder="Select zone…" /></SelectTrigger>
            <SelectContent>{zones?.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {selectedZoneId ? (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>SKU</TableHead><TableHead className="text-right">Expected</TableHead><TableHead className="text-right">OT After</TableHead>
                <TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Cap</TableHead><TableHead>Reason</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {skus?.map((sku) => {
                  const r = latestOtBysku.get(sku.id);
                  if (!r) return null;
                  return (
                    <TableRow key={sku.id}>
                      <TableCell className="font-medium">{sku.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.expected_minutes}m</TableCell>
                      <TableCell className="text-right tabular-nums">{r.overtime_start_after_minutes}m</TableCell>
                      <TableCell className="text-right tabular-nums">{r.overtime_rate_cents_per_min}¢/m</TableCell>
                      <TableCell className="text-right tabular-nums">{cents(r.overtime_cap_cents)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.reason ?? "—"}</TableCell>
                    </TableRow>
                  );
                }).filter(Boolean)}
                {(!overtimeRules || overtimeRules.length === 0) && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No overtime rules for this zone</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        ) : <p className="text-sm text-muted-foreground">Select a zone to view overtime rules.</p>}
      </CardContent>
    </Card>
  );
}
