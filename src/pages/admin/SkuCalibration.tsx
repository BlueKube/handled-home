import { useState, useMemo } from "react";
import { useSkus, useUpdateSku, type ServiceSku } from "@/hooks/useSkus";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, Scale } from "lucide-react";
import { CalibrationRow, getDelta, type CalibrationValues } from "@/components/admin/CalibrationRow";

type CalibrationState = Record<string, CalibrationValues>;

export default function SkuCalibration() {
  const { data: skus, isLoading } = useSkus({ status: "active" });
  const updateSku = useUpdateSku();
  const { toast } = useToast();
  const [calibration, setCalibration] = useState<CalibrationState>({});

  const setCal = (skuId: string, field: keyof CalibrationValues, value: number | undefined) => {
    setCalibration((prev) => ({
      ...prev,
      [skuId]: { ...prev[skuId], [field]: value },
    }));
  };

  const hasCalibration = useMemo(() => {
    return Object.values(calibration).some((v) =>
      Object.values(v).some((val) => val !== undefined && val !== 0)
    );
  }, [calibration]);

  const applyCalibration = async (sku: ServiceSku) => {
    const cal = calibration[sku.id];
    if (!cal) return;

    const durationSamples = [cal.duration_small, cal.duration_medium, cal.duration_large, cal.duration_xl]
      .filter((v): v is number => v !== undefined && v > 0);

    const updates: Record<string, unknown> = {};
    if (durationSamples.length > 0) {
      updates.duration_minutes = Math.round(durationSamples.reduce((a, b) => a + b, 0) / durationSamples.length);
    }
    if (cal.price_hint_cents !== undefined && cal.price_hint_cents > 0) {
      updates.price_hint_cents = cal.price_hint_cents;
    }

    if (Object.keys(updates).length === 0) {
      toast({ title: "Nothing to apply", description: "Enter provider-reported values first." });
      return;
    }

    try {
      await updateSku.mutateAsync({ id: sku.id, updates: updates as any });
      toast({ title: "Calibration applied", description: `${sku.name} updated with provider values.` });
      setCalibration((prev) => {
        const next = { ...prev };
        delete next[sku.id];
        return next;
      });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const exportReport = () => {
    if (!skus) return;
    const report = skus.map((sku) => {
      const cal = calibration[sku.id] || {};
      return {
        name: sku.name,
        category: sku.category,
        current: {
          duration_minutes: sku.duration_minutes,
          price_hint_cents: sku.price_hint_cents,
        },
        provider_reported: {
          duration_small: cal.duration_small ?? null,
          duration_medium: cal.duration_medium ?? null,
          duration_large: cal.duration_large ?? null,
          duration_xl: cal.duration_xl ?? null,
          handle_cost: cal.handle_cost ?? null,
          price_hint_cents: cal.price_hint_cents ?? null,
        },
        deltas: {
          duration: cal.duration_medium ? getDelta(sku.duration_minutes, cal.duration_medium) : null,
          price: cal.price_hint_cents && sku.price_hint_cents ? getDelta(sku.price_hint_cents, cal.price_hint_cents) : null,
        },
      };
    });

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sku-calibration-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
  };

  if (isLoading || !skus) {
    return (
      <div className="animate-fade-in p-6 space-y-6">
        <h1 className="text-h2">SKU Calibration</h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h2 mb-0.5">SKU Calibration</h1>
          <p className="text-caption">
            Compare seed values against provider-reported data. Deltas &gt;20% are flagged.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportReport}
          disabled={!hasCalibration}
          className="shrink-0"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export Report
        </Button>
      </div>

      <Card className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">SKU</TableHead>
              <TableHead className="text-center">Current Duration</TableHead>
              <TableHead className="text-center" colSpan={4}>Provider Duration by Size</TableHead>
              <TableHead className="text-center">Current Price</TableHead>
              <TableHead className="text-center">Provider Price</TableHead>
              <TableHead className="text-center">Handle Cost</TableHead>
              <TableHead className="text-center w-[80px]">Actions</TableHead>
            </TableRow>
            <TableRow>
              <TableHead />
              <TableHead className="text-center text-[10px]">min</TableHead>
              <TableHead className="text-center text-[10px]">Small</TableHead>
              <TableHead className="text-center text-[10px]">Medium</TableHead>
              <TableHead className="text-center text-[10px]">Large</TableHead>
              <TableHead className="text-center text-[10px]">XL</TableHead>
              <TableHead className="text-center text-[10px]">cents</TableHead>
              <TableHead className="text-center text-[10px]">cents</TableHead>
              <TableHead className="text-center text-[10px]">handles</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus.length === 0 && (
              <TableRow>
                <td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                  <Scale className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No active SKUs to calibrate. Activate SKUs in the catalog first.
                </td>
              </TableRow>
            )}
            {skus.map((sku) => (
              <CalibrationRow
                key={sku.id}
                sku={sku}
                cal={calibration[sku.id] || {}}
                setCal={setCal}
                onApply={applyCalibration}
                isPending={updateSku.isPending}
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Calibration Guide</p>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Property sizes:</span> Small = &lt;1,500 sqft / &lt;0.15 acre · Medium = 1,500–2,500 sqft / 0.15–0.25 acre · Large = 2,500–4,000 sqft / 0.25–0.5 acre · XL = 4,000+ sqft / 0.5+ acre
          </p>
          <p>
            <span className="font-medium text-foreground">Delta colors:</span>{" "}
            <Badge variant="secondary" className="text-[10px]">&lt;5%</Badge>{" "}
            <Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">5–20%</Badge>{" "}
            <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">&gt;20%</Badge>
          </p>
          <p>
            <span className="font-medium text-foreground">Apply:</span> Updates the SKU&apos;s base duration (averaged across filled size tiers) and price. Handle costs are stored for reference only — update in the SKU Level editor.
          </p>
        </div>
      </Card>
    </div>
  );
}
