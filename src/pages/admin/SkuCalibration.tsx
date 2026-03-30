import { useState, useMemo } from "react";
import { useSkus, useUpdateSku, type ServiceSku } from "@/hooks/useSkus";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, Check, AlertTriangle, Scale } from "lucide-react";

interface CalibrationValues {
  duration_small?: number;
  duration_medium?: number;
  duration_large?: number;
  duration_xl?: number;
  handle_cost?: number;
  price_hint_cents?: number;
}

type CalibrationState = Record<string, CalibrationValues>;

function getDelta(current: number, proposed: number | undefined): number | null {
  if (proposed === undefined || proposed === 0) return null;
  return ((proposed - current) / current) * 100;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const abs = Math.abs(delta);
  if (abs < 5) return <Badge variant="secondary" className="text-[10px] font-mono">{delta > 0 ? "+" : ""}{delta.toFixed(0)}%</Badge>;
  if (abs < 20) return <Badge className="text-[10px] font-mono bg-amber-500/10 text-amber-500 border-amber-500/20">{delta > 0 ? "+" : ""}{delta.toFixed(0)}%</Badge>;
  return <Badge className="text-[10px] font-mono bg-destructive/10 text-destructive border-destructive/20">{delta > 0 ? "+" : ""}{delta.toFixed(0)}%</Badge>;
}

function CalibrationInput({ value, onChange, placeholder }: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <Input
      type="number"
      min={0}
      className="h-7 w-20 text-xs font-mono"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
    />
  );
}

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

    const avgDuration = [cal.duration_small, cal.duration_medium, cal.duration_large, cal.duration_xl]
      .filter((v): v is number => v !== undefined && v > 0);

    const updates: Record<string, unknown> = {};
    if (avgDuration.length > 0) {
      updates.duration_minutes = Math.round(avgDuration.reduce((a, b) => a + b, 0) / avgDuration.length);
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
    URL.revokeObjectURL(url);
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
            {skus.map((sku) => {
              const cal = calibration[sku.id] || {};
              const durationDelta = getDelta(sku.duration_minutes, cal.duration_medium);
              const priceDelta = sku.price_hint_cents ? getDelta(sku.price_hint_cents, cal.price_hint_cents) : null;
              const hasValues = Object.values(cal).some((v) => v !== undefined && v > 0);

              return (
                <TableRow key={sku.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium">{sku.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sku.category}</p>
                      </div>
                      {durationDelta !== null && Math.abs(durationDelta) >= 20 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {sku.duration_minutes}
                    {durationDelta !== null && (
                      <div className="mt-0.5"><DeltaBadge delta={durationDelta} /></div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <CalibrationInput
                      value={cal.duration_small}
                      onChange={(v) => setCal(sku.id, "duration_small", v)}
                      placeholder={String(Math.round(sku.duration_minutes * 0.7))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <CalibrationInput
                      value={cal.duration_medium}
                      onChange={(v) => setCal(sku.id, "duration_medium", v)}
                      placeholder={String(sku.duration_minutes)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <CalibrationInput
                      value={cal.duration_large}
                      onChange={(v) => setCal(sku.id, "duration_large", v)}
                      placeholder={String(Math.round(sku.duration_minutes * 1.4))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <CalibrationInput
                      value={cal.duration_xl}
                      onChange={(v) => setCal(sku.id, "duration_xl", v)}
                      placeholder={String(Math.round(sku.duration_minutes * 1.8))}
                    />
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {sku.price_hint_cents ? `$${(sku.price_hint_cents / 100).toFixed(0)}` : "—"}
                    {priceDelta !== null && (
                      <div className="mt-0.5"><DeltaBadge delta={priceDelta} /></div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <CalibrationInput
                      value={cal.price_hint_cents}
                      onChange={(v) => setCal(sku.id, "price_hint_cents", v)}
                      placeholder={sku.price_hint_cents ? String(sku.price_hint_cents) : "0"}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <CalibrationInput
                      value={cal.handle_cost}
                      onChange={(v) => setCal(sku.id, "handle_cost", v)}
                      placeholder="1"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      disabled={!hasValues || updateSku.isPending}
                      onClick={() => applyCalibration(sku)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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
