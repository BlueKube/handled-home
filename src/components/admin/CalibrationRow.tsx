import { type ServiceSku } from "@/hooks/useSkus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check, AlertTriangle } from "lucide-react";

export interface CalibrationValues {
  duration_small?: number;
  duration_medium?: number;
  duration_large?: number;
  duration_xl?: number;
  handle_cost?: number;
  price_hint_cents?: number;
}

export function getDelta(current: number, proposed: number | undefined): number | null {
  if (proposed === undefined || proposed === 0) return null;
  if (current === 0) return null;
  return ((proposed - current) / current) * 100;
}

export function DeltaBadge({ delta }: { delta: number | null }) {
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

interface CalibrationRowProps {
  sku: ServiceSku;
  cal: CalibrationValues;
  setCal: (skuId: string, field: keyof CalibrationValues, value: number | undefined) => void;
  onApply: (sku: ServiceSku) => void;
  isPending: boolean;
}

export function CalibrationRow({ sku, cal, setCal, onApply, isPending }: CalibrationRowProps) {
  const durationDelta = getDelta(sku.duration_minutes, cal.duration_medium);
  const priceDelta = sku.price_hint_cents ? getDelta(sku.price_hint_cents, cal.price_hint_cents) : null;
  const hasValues = Object.values(cal).some((v) => v !== undefined && v > 0);

  return (
    <TableRow>
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
          disabled={!hasValues || isPending}
          onClick={() => onApply(sku)}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
