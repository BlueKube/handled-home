import { useState, useMemo } from "react";
import {
  usePayoutBase, usePayoutZoneOverrides,
  useSetPayoutBaseMutation, useSetPayoutZoneOverrideMutation,
} from "@/hooks/useProviderPayoutAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { cents } from "./shared";

interface PayoutsTabProps {
  skus: Array<{ id: string; name: string }>;
  zones: Array<{ id: string; name: string }>;
  isSuperuser: boolean;
}

export function PayoutsTab({ skus, zones, isSuperuser }: PayoutsTabProps) {
  const { data: basePrices } = usePayoutBase();
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const { data: overrides } = usePayoutZoneOverrides(selectedZoneId || undefined);

  const setBaseMut = useSetPayoutBaseMutation();
  const setOverrideMut = useSetPayoutZoneOverrideMutation();

  const [editSkuId, setEditSkuId] = useState<string | null>(null);
  const [editPayout, setEditPayout] = useState("");
  const [editReason, setEditReason] = useState("");

  const [editOvSkuId, setEditOvSkuId] = useState<string | null>(null);
  const [editOvMultiplier, setEditOvMultiplier] = useState("");
  const [editOvPrice, setEditOvPrice] = useState("");
  const [editOvReason, setEditOvReason] = useState("");

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

  return (
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
  );
}
