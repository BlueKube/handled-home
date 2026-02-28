import { useState, useMemo } from "react";
import { useSkuPricingBase, useZonePricingOverrides, useSetBasePriceMutation, useSetZoneOverrideMutation, useBulkSetMultiplierMutation, useRollbackPricingMutation } from "@/hooks/useZonePricing";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Copy, RotateCcw, Layers } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ControlPricing() {
  const { isSuperuser } = useAdminMembership();
  const { data: skus, isLoading: skusLoading } = useSkus();
  const { data: zones, isLoading: zonesLoading } = useZones();
  const { data: basePrices, isLoading: baseLoading } = useSkuPricingBase();

  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const { data: overrides, isLoading: overridesLoading } = useZonePricingOverrides(selectedZoneId || undefined);

  const setBaseMut = useSetBasePriceMutation();
  const setOverrideMut = useSetZoneOverrideMutation();
  const bulkMut = useBulkSetMultiplierMutation();
  const rollbackMut = useRollbackPricingMutation();

  // Editing states
  const [editBaseSkuId, setEditBaseSkuId] = useState<string | null>(null);
  const [editBasePrice, setEditBasePrice] = useState("");
  const [editBaseReason, setEditBaseReason] = useState("");

  const [editOverrideSkuId, setEditOverrideSkuId] = useState<string | null>(null);
  const [editMultiplier, setEditMultiplier] = useState("");
  const [editOverridePrice, setEditOverridePrice] = useState("");
  const [editOverrideReason, setEditOverrideReason] = useState("");

  const [bulkMultiplier, setBulkMultiplier] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const [copyFromZoneId, setCopyFromZoneId] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const { data: copyOverrides } = useZonePricingOverrides(copyFromZoneId || undefined);

  // Build effective price table
  const latestBaseBysku = useMemo(() => {
    const map = new Map<string, typeof basePrices extends (infer T)[] ? T : never>();
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

  const isLoading = skusLoading || zonesLoading || baseLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const handleSaveBase = () => {
    if (!editBaseSkuId || !editBasePrice) return;
    if (!editBaseReason.trim()) { toast.error("Reason is required"); return; }
    setBaseMut.mutate({
      sku_id: editBaseSkuId,
      base_price_cents: Math.round(parseFloat(editBasePrice) * 100),
      reason: editBaseReason.trim(),
    }, {
      onSuccess: () => setEditBaseSkuId(null),
    });
  };

  const handleSaveOverride = () => {
    if (!editOverrideSkuId || !selectedZoneId) return;
    if (!editOverrideReason.trim()) { toast.error("Reason is required"); return; }
    setOverrideMut.mutate({
      zone_id: selectedZoneId,
      sku_id: editOverrideSkuId,
      price_multiplier: editMultiplier ? parseFloat(editMultiplier) : null,
      override_price_cents: editOverridePrice ? Math.round(parseFloat(editOverridePrice) * 100) : null,
      reason: editOverrideReason.trim(),
    }, {
      onSuccess: () => setEditOverrideSkuId(null),
    });
  };

  const handleBulkApply = () => {
    if (!selectedZoneId || !bulkMultiplier || !skus) return;
    if (!bulkReason.trim()) { toast.error("Reason is required"); return; }
    bulkMut.mutate({
      zone_id: selectedZoneId,
      sku_ids: skus.map((s) => s.id),
      price_multiplier: parseFloat(bulkMultiplier),
      reason: bulkReason.trim(),
    }, {
      onSuccess: () => setBulkOpen(false),
    });
  };

  const handleCopyFromZone = () => {
    if (!selectedZoneId || !copyOverrides) return;
    for (const ov of copyOverrides) {
      setOverrideMut.mutate({
        zone_id: selectedZoneId,
        sku_id: ov.sku_id,
        price_multiplier: ov.price_multiplier,
        override_price_cents: ov.override_price_cents,
        reason: `Copied from zone`,
      });
    }
    setCopyOpen(false);
  };

  const cents = (c: number | null | undefined) => c != null ? `$${(c / 100).toFixed(2)}` : "—";
  const effectivePrice = (skuId: string) => {
    const base = latestBaseBysku.get(skuId)?.base_price_cents ?? 0;
    const ov = overrideBysku.get(skuId);
    if (ov?.override_price_cents != null) return ov.override_price_cents;
    if (ov?.price_multiplier != null) return Math.round(base * ov.price_multiplier);
    return base;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pricing & Margin</h1>
          <p className="text-sm text-muted-foreground mt-1">Zone-adjusted customer pricing. Superuser-only writes.</p>
        </div>
        {!isSuperuser && <Badge variant="secondary">Read-only</Badge>}
      </div>

      {/* Zone selector + actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" /> Zone Pricing Overrides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="w-64">
              <Label className="text-xs">Zone</Label>
              <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                <SelectTrigger><SelectValue placeholder="Select zone…" /></SelectTrigger>
                <SelectContent>
                  {zones?.map((z) => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSuperuser && selectedZoneId && (
              <>
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Layers className="h-3.5 w-3.5 mr-1" />Bulk Multiplier</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Set Bulk Multiplier</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Multiplier (e.g. 1.15 for +15%)</Label>
                        <Input type="number" step="0.01" value={bulkMultiplier} onChange={(e) => setBulkMultiplier(e.target.value)} />
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Textarea value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} placeholder="Why this change?" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                      <Button onClick={handleBulkApply} disabled={bulkMut.isPending}>
                        {bulkMut.isPending ? "Applying…" : "Apply to All SKUs"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><Copy className="h-3.5 w-3.5 mr-1" />Copy From Zone</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Copy Pricing From Another Zone</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Label>Source Zone</Label>
                      <Select value={copyFromZoneId} onValueChange={setCopyFromZoneId}>
                        <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                        <SelectContent>
                          {zones?.filter((z) => z.id !== selectedZoneId).map((z) => (
                            <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {copyOverrides && <p className="text-xs text-muted-foreground">{copyOverrides.length} override(s) will be copied</p>}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                      <Button onClick={handleCopyFromZone} disabled={!copyOverrides?.length}>Copy</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          {/* Pricing table */}
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead className="text-right">Multiplier</TableHead>
                  <TableHead className="text-right">Override</TableHead>
                  <TableHead className="text-right">Effective</TableHead>
                  <TableHead>Last Changed</TableHead>
                  <TableHead>Reason</TableHead>
                  {isSuperuser && <TableHead className="w-40">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {skus?.map((sku) => {
                  const base = latestBaseBysku.get(sku.id);
                  const ov = selectedZoneId ? overrideBysku.get(sku.id) : undefined;
                  const eff = effectivePrice(sku.id);

                  return (
                    <TableRow key={sku.id}>
                      <TableCell className="font-medium">{sku.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {editBaseSkuId === sku.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number" step="0.01" className="w-20 h-7 text-xs"
                              value={editBasePrice} onChange={(e) => setEditBasePrice(e.target.value)}
                            />
                          </div>
                        ) : (
                          cents(base?.base_price_cents)
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ov?.price_multiplier != null ? `×${ov.price_multiplier}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cents(ov?.override_price_cents)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {cents(eff)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ov?.created_at ? format(new Date(ov.created_at), "MMM d, HH:mm") : base?.created_at ? format(new Date(base.created_at), "MMM d, HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {ov?.reason ?? base?.reason ?? "—"}
                      </TableCell>
                      {isSuperuser && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {editBaseSkuId === sku.id ? (
                              <>
                                <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSaveBase} disabled={setBaseMut.isPending}>Save</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditBaseSkuId(null)}>×</Button>
                              </>
                            ) : editOverrideSkuId === sku.id ? (
                              <>
                                <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSaveOverride} disabled={setOverrideMut.isPending}>Save</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditOverrideSkuId(null)}>×</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                                  setEditBaseSkuId(sku.id);
                                  setEditBasePrice(base ? (base.base_price_cents / 100).toFixed(2) : "0");
                                  setEditBaseReason("");
                                }}>
                                  Base
                                </Button>
                                {selectedZoneId && (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                                      setEditOverrideSkuId(sku.id);
                                      setEditMultiplier(ov?.price_multiplier?.toString() ?? "");
                                      setEditOverridePrice(ov?.override_price_cents ? (ov.override_price_cents / 100).toFixed(2) : "");
                                      setEditOverrideReason("");
                                    }}>
                                      Zone
                                    </Button>
                                    {ov && (
                                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => rollbackMut.mutate({ override_id: ov.id })}>
                                        <RotateCcw className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {(!skus || skus.length === 0) && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No SKUs found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Inline edit reason (shown below table when editing) */}
          {(editBaseSkuId || editOverrideSkuId) && (
            <div className="flex items-end gap-3 pt-2 border-t">
              {editOverrideSkuId && (
                <>
                  <div className="w-28">
                    <Label className="text-xs">Multiplier</Label>
                    <Input type="number" step="0.01" value={editMultiplier} onChange={(e) => setEditMultiplier(e.target.value)} placeholder="e.g. 1.15" className="h-8" />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Or Override $</Label>
                    <Input type="number" step="0.01" value={editOverridePrice} onChange={(e) => setEditOverridePrice(e.target.value)} placeholder="e.g. 45.00" className="h-8" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <Label className="text-xs">Reason (required)</Label>
                <Input
                  value={editBaseSkuId ? editBaseReason : editOverrideReason}
                  onChange={(e) => editBaseSkuId ? setEditBaseReason(e.target.value) : setEditOverrideReason(e.target.value)}
                  placeholder="Why this change?" className="h-8"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
