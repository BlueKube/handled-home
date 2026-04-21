import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/creditPacks";
import { useAutopaySettings, useHasSavedPaymentMethod } from "@/hooks/useAutopaySettings";

const THRESHOLDS = [30, 50, 100];
const DEFAULT_PACK: CreditPackId = "homeowner";
const DEFAULT_THRESHOLD = 50;

export function AutopaySection() {
  const { settings, save, hasSubscription } = useAutopaySettings();
  const { data: hasPaymentMethod, isLoading: pmLoading } = useHasSavedPaymentMethod();

  const [local, setLocal] = useState({
    enabled: settings?.enabled ?? false,
    pack_id: (settings?.pack_id ?? DEFAULT_PACK) as CreditPackId,
    threshold: settings?.threshold ?? DEFAULT_THRESHOLD,
  });

  const persist = async (next: typeof local) => {
    setLocal(next);
    try {
      await save.mutateAsync(next);
    } catch {
      toast.error("Couldn't save autopay settings. Please try again.");
    }
  };

  if (!hasSubscription) return null;

  const disabled = !hasPaymentMethod || pmLoading;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Zap className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Auto-top-up</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll charge your saved card when your balance drops below the threshold.
              </p>
            </div>
          </div>
          <Switch
            checked={local.enabled && !disabled}
            disabled={disabled || save.isPending}
            onCheckedChange={(enabled) => persist({ ...local, enabled })}
            aria-label="Enable auto-top-up"
          />
        </div>

        {disabled && (
          <p className="text-xs text-muted-foreground">
            Add a payment method in Billing Methods to enable auto-top-up.
          </p>
        )}

        {local.enabled && !disabled && (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground" htmlFor="autopay-pack">
                Pack to buy
              </label>
              <Select
                value={local.pack_id}
                onValueChange={(v) => persist({ ...local, pack_id: v as CreditPackId })}
              >
                <SelectTrigger id="autopay-pack">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_PACKS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.credits} credits · {p.priceText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground" htmlFor="autopay-threshold">
                Trigger when balance drops below
              </label>
              <Select
                value={String(local.threshold)}
                onValueChange={(v) => persist({ ...local, threshold: Number(v) })}
              >
                <SelectTrigger id="autopay-threshold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THRESHOLDS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} credits
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {save.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving…
          </div>
        )}
      </CardContent>
    </Card>
  );
}
