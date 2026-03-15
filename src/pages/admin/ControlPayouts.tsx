import { useState, useMemo } from "react";
import {
  usePayoutBase, usePayoutZoneOverrides, useOrgContracts, useOvertimeRules,
  useSetPayoutBaseMutation, useSetPayoutZoneOverrideMutation, useSetOrgContractMutation, useSetOvertimeRulesMutation,
} from "@/hooks/useProviderPayoutAdmin";
import { useSkus } from "@/hooks/useSkus";
import { useZones } from "@/hooks/useZones";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ControlPayouts() {
  const { isSuperuser } = useAdminMembership();
  const { data: skus, isLoading: skusLoading } = useSkus();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: basePrices, isLoading: baseLoading } = usePayoutBase();
  const { data: orgContracts } = useOrgContracts();

  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const { data: overrides } = usePayoutZoneOverrides(selectedZoneId || undefined);
  const { data: overtimeRules } = useOvertimeRules(selectedZoneId || undefined);

  const setBaseMut = useSetPayoutBaseMutation();
  const setOverrideMut = useSetPayoutZoneOverrideMutation();
  const setContractMut = useSetOrgContractMutation();
  const setOvertimeMut = useSetOvertimeRulesMutation();

  // Edit states - payout base
  const [editSkuId, setEditSkuId] = useState<string | null>(null);
  const [editPayout, setEditPayout] = useState("");
  const [editReason, setEditReason] = useState("");

  // Edit states - zone override
  const [editOvSkuId, setEditOvSkuId] = useState<string | null>(null);
  const [editOvMultiplier, setEditOvMultiplier] = useState("");
  const [editOvPrice, setEditOvPrice] = useState("");
  const [editOvReason, setEditOvReason] = useState("");

  // Overtime dialog
  const [otOpen, setOtOpen] = useState(false);
  const [otSkuId, setOtSkuId] = useState("");
  const [otExpected, setOtExpected] = useState("");
  const [otRate, setOtRate] = useState("");
  const [otStart, setOtStart] = useState("");
  const [otCap, setOtCap] = useState("");
  const [otReason, setOtReason] = useState("");

  // Contract dialog
  const [ctOpen, setCtOpen] = useState(false);
  const [ctOrgId, setCtOrgId] = useState("");
  const [ctType, setCtType] = useState("partner_flat");
  const [ctReason, setCtReason] = useState("");

  const latestBaseBysku = useMemo(() => {
    const map = new Map<string, NonNullable<typeof basePrices>[number]>();
    if (!basePrices) return map;
    for (const bp of basePrices) {
      if (!map.has(bp.sku_id)) map.set(bp.sku_id, bp);
    }
    return map;
  }, [basePrices]);

  const overrideBysku = useMemo(() => {
    const map = new Map<string, NonNullable<typeof overrides>[number]>();
    if (!overrides) return map;
    for (const ov of overrides) {
      if (!map.has(ov.sku_id)) map.set(ov.sku_id, ov);
    }
    return map;
  }, [overrides]);

  const latestOtBysku = useMemo(() => {
    const map = new Map<string, NonNullable<typeof overtimeRules>[number]>();
    if (!overtimeRules) return map;
    for (const r of overtimeRules) {
      if (!map.has(r.sku_id)) map.set(r.sku_id, r);
    }
    return map;
  }, [overtimeRules]);

  const isLoading = skusLoading || zonesLoading || baseLoading;
  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;

  const cents = (c: number | null | undefined) => c != null ? `$${(c / 100).toFixed(2)}` : "—";

  const effectivePayout = (skuId: string) => {
    const base = latestBaseBysku.get(skuId)?.base_payout_cents ?? 0;
    const ov = overrideBysku.get(skuId);
    if (ov?.override_payout_cents != null) return ov.override_payout_cents;
    if (ov?.payout_multiplier != null) return Math.round(base * ov.payout_multiplier);
    return base;
  };

  const handleSaveBase = () => {
    if (!editSkuId || !editPayout) return;
    if (!editReason.trim()) { toast.error("Reason is required"); return; }
    setBaseMut.mutate({ sku_id: editSkuId, base_payout_cents: Math.round(parseFloat(editPayout) * 100), reason: editReason.trim() }, { onSuccess: () => setEditSkuId(null) });
  };

  const handleSaveOverride = () => {
    if (!editOvSkuId || !selectedZoneId) return;
    if (!editOvReason.trim()) { toast.error("Reason is required"); return; }
    setOverrideMut.mutate({
      zone_id: selectedZoneId, sku_id: editOvSkuId,
      payout_multiplier: editOvMultiplier ? parseFloat(editOvMultiplier) : null,
      override_payout_cents: editOvPrice ? Math.round(parseFloat(editOvPrice) * 100) : null,
      reason: editOvReason.trim(),
    }, { onSuccess: () => setEditOvSkuId(null) });
  };

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

  const handleSaveContract = () => {
    if (!ctOrgId || !ctReason.trim()) { toast.error("Org and reason required"); return; }
    setContractMut.mutate({ provider_org_id: ctOrgId, contract_type: ctType, reason: ctReason.trim() }, { onSuccess: () => setCtOpen(false) });
  };

  const contractLabel = (t: string) => ({ partner_flat: "Partner Flat", partner_time_guarded: "Time-Guarded", contractor_time_based: "Time-Based" }[t] ?? t);

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Provider Payout Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Payout tables, contract types, overtime params. Superuser-only writes.</p>
        </div>
        {!isSuperuser && <Badge variant="secondary">Read-only</Badge>}
      </div>

      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts"><Banknote className="h-3.5 w-3.5 mr-1" />Payouts</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="h-3.5 w-3.5 mr-1" />Contracts</TabsTrigger>
          <TabsTrigger value="overtime"><Clock className="h-3.5 w-3.5 mr-1" />Overtime</TabsTrigger>
        </TabsList>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4" />Payout by SKU & Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-64">
                <Label className="text-xs">Zone (for overrides)</Label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger><SelectValue placeholder="Select zone…" /></SelectTrigger>
                  <SelectContent>{zones?.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Base Payout</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                      <TableHead className="text-right">Override</TableHead>
                      <TableHead className="text-right">Effective</TableHead>
                      <TableHead>Reason</TableHead>
                      {isSuperuser && <TableHead className="w-36">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skus?.map((sku) => {
                      const base = latestBaseBysku.get(sku.id);
                      const ov = selectedZoneId ? overrideBysku.get(sku.id) : undefined;
                      return (
                        <TableRow key={sku.id}>
                          <TableCell className="font-medium">{sku.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {editSkuId === sku.id ? <Input type="number" step="0.01" className="w-20 h-7 text-xs" value={editPayout} onChange={(e) => setEditPayout(e.target.value)} />
                              : cents(base?.base_payout_cents)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{ov?.payout_multiplier != null ? `×${ov.payout_multiplier}` : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{cents(ov?.override_payout_cents)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{cents(effectivePayout(sku.id))}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{ov?.reason ?? base?.reason ?? "—"}</TableCell>
                          {isSuperuser && (
                            <TableCell>
                              <div className="flex gap-1">
                                {editSkuId === sku.id ? (
                                  <>
                                    <Button size="sm" className="h-7 text-xs" onClick={handleSaveBase} disabled={setBaseMut.isPending}>Save</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditSkuId(null)}>×</Button>
                                  </>
                                ) : editOvSkuId === sku.id ? (
                                  <>
                                    <Button size="sm" className="h-7 text-xs" onClick={handleSaveOverride} disabled={setOverrideMut.isPending}>Save</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditOvSkuId(null)}>×</Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditSkuId(sku.id); setEditPayout(base ? (base.base_payout_cents / 100).toFixed(2) : "0"); setEditReason(""); }}>Base</Button>
                                    {selectedZoneId && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditOvSkuId(sku.id); setEditOvMultiplier(ov?.payout_multiplier?.toString() ?? ""); setEditOvPrice(ov?.override_payout_cents ? (ov.override_payout_cents / 100).toFixed(2) : ""); setEditOvReason(""); }}>Zone</Button>}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                    {(!skus || skus.length === 0) && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No SKUs found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>

              {(editSkuId || editOvSkuId) && (
                <div className="flex items-end gap-3 pt-2 border-t">
                  {editOvSkuId && (
                    <>
                      <div className="w-28"><Label className="text-xs">Multiplier</Label><Input type="number" step="0.01" value={editOvMultiplier} onChange={(e) => setEditOvMultiplier(e.target.value)} placeholder="e.g. 1.15" className="h-8" /></div>
                      <div className="w-28"><Label className="text-xs">Or Override $</Label><Input type="number" step="0.01" value={editOvPrice} onChange={(e) => setEditOvPrice(e.target.value)} placeholder="e.g. 30.00" className="h-8" /></div>
                    </>
                  )}
                  <div className="flex-1"><Label className="text-xs">Reason (required)</Label><Input value={editSkuId ? editReason : editOvReason} onChange={(e) => editSkuId ? setEditReason(e.target.value) : setEditOvReason(e.target.value)} placeholder="Why this change?" className="h-8" /></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Provider Org Contracts</CardTitle>
              {isSuperuser && (
                <Dialog open={ctOpen} onOpenChange={setCtOpen}>
                  <DialogTrigger asChild><Button size="sm">Assign Contract</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Set Contract Type</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Provider Org ID</Label><Input value={ctOrgId} onChange={(e) => setCtOrgId(e.target.value)} placeholder="UUID" /></div>
                      <div><Label>Contract Type</Label>
                        <Select value={ctType} onValueChange={setCtType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="partner_flat">Partner Flat</SelectItem>
                            <SelectItem value="partner_time_guarded">Time-Guarded</SelectItem>
                            <SelectItem value="contractor_time_based">Time-Based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Reason</Label><Textarea value={ctReason} onChange={(e) => setCtReason(e.target.value)} placeholder="Why?" /></div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                      <Button onClick={handleSaveContract} disabled={setContractMut.isPending}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Org ID</TableHead><TableHead>Contract Type</TableHead><TableHead>Since</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orgContracts?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.provider_org_id.slice(0, 8)}…</TableCell>
                        <TableCell><Badge variant="outline">{contractLabel(c.contract_type)}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(c.active_from), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.reason ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                    {(!orgContracts || orgContracts.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No contracts assigned</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime Tab */}
        <TabsContent value="overtime">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
