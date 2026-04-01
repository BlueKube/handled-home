import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import type { ModelAssumptions } from "@/lib/simulation/model";

interface SliderConfig {
  key: keyof ModelAssumptions;
  label: string;
  min: number;
  max: number;
  step: number;
  format: "dollar" | "pct" | "int";
  /** Multiply display value by this to get ModelAssumptions value (e.g., 100 for cents) */
  toModel?: number;
}

const ZONE_SLIDERS: SliderConfig[] = [
  { key: "homes_in_zone", label: "Homes in Zone", min: 2000, max: 10000, step: 500, format: "int" },
  { key: "home_ownership_rate", label: "Home Ownership Rate", min: 0.4, max: 0.9, step: 0.05, format: "pct" },
  { key: "income_qualifying_rate", label: "Income Qualifying", min: 0.2, max: 0.7, step: 0.05, format: "pct" },
];

const PRICING_SLIDERS: SliderConfig[] = [
  { key: "essential_price_cents", label: "Essential Price", min: 69, max: 199, step: 5, format: "dollar", toModel: 100 },
  { key: "plus_price_cents", label: "Plus Price", min: 99, max: 249, step: 5, format: "dollar", toModel: 100 },
  { key: "premium_price_cents", label: "Premium Price", min: 179, max: 399, step: 5, format: "dollar", toModel: 100 },
  { key: "plan_mix_essential", label: "Essential Mix", min: 0.1, max: 0.6, step: 0.05, format: "pct" },
  { key: "plan_mix_plus", label: "Plus Mix", min: 0.2, max: 0.6, step: 0.05, format: "pct" },
];

const PROVIDER_SLIDERS: SliderConfig[] = [
  { key: "providers_at_launch", label: "Providers at Launch", min: 1, max: 8, step: 1, format: "int" },
  { key: "provider_payout_per_job_cents", label: "Payout / Job", min: 25, max: 75, step: 5, format: "dollar", toModel: 100 },
  { key: "provider_stops_per_day", label: "Stops / Day", min: 4, max: 10, step: 1, format: "int" },
];

const BYOC_SLIDERS: SliderConfig[] = [
  { key: "byoc_customers_per_provider", label: "Customers / Provider", min: 5, max: 30, step: 1, format: "int" },
  { key: "byoc_invite_send_rate", label: "Invite Send Rate", min: 0.2, max: 0.9, step: 0.05, format: "pct" },
  { key: "byoc_activation_rate", label: "Activation Rate", min: 0.1, max: 0.6, step: 0.05, format: "pct" },
  { key: "byoc_bonus_per_week_cents", label: "Bonus / Week", min: 5, max: 25, step: 1, format: "dollar", toModel: 100 },
  { key: "byoc_bonus_duration_weeks", label: "Bonus Duration", min: 4, max: 24, step: 4, format: "int" },
];

const RETENTION_SLIDERS: SliderConfig[] = [
  { key: "month_1_churn_rate", label: "Month 1 Churn", min: 0.05, max: 0.3, step: 0.01, format: "pct" },
  { key: "steady_state_monthly_churn", label: "Steady Churn", min: 0.02, max: 0.1, step: 0.005, format: "pct" },
  { key: "second_service_attach_90d", label: "Attach Rate (90d)", min: 0.05, max: 0.5, step: 0.05, format: "pct" },
];

const OVERHEAD_SLIDERS: SliderConfig[] = [
  { key: "monthly_ops_overhead_cents", label: "Ops Overhead / mo", min: 500, max: 5000, step: 250, format: "dollar", toModel: 100 },
  { key: "monthly_tech_overhead_cents", label: "Tech Overhead / mo", min: 200, max: 1500, step: 100, format: "dollar", toModel: 100 },
];

const GROUPS = [
  { title: "Zone Configuration", sliders: ZONE_SLIDERS },
  { title: "Subscription Pricing", sliders: PRICING_SLIDERS },
  { title: "Provider Economics", sliders: PROVIDER_SLIDERS },
  { title: "BYOC Growth", sliders: BYOC_SLIDERS },
  { title: "Retention & Churn", sliders: RETENTION_SLIDERS },
  { title: "Overhead Costs", sliders: OVERHEAD_SLIDERS },
];

function formatValue(value: number, format: SliderConfig["format"]): string {
  switch (format) {
    case "dollar": return `$${value.toLocaleString()}`;
    case "pct": return `${(value * 100).toFixed(0)}%`;
    case "int": return value.toLocaleString();
  }
}

function getDisplayValue(modelValue: number, config: SliderConfig): number {
  return config.toModel ? modelValue / config.toModel : modelValue;
}

interface SimulatorControlsProps {
  assumptions: ModelAssumptions;
  onChange: (key: keyof ModelAssumptions, value: number) => void;
}

export default function SimulatorControls({ assumptions, onChange }: SimulatorControlsProps) {
  return (
    <div className="space-y-3">
      {GROUPS.map((group) => (
        <Card key={group.title} className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            {group.title}
          </p>
          <div className="space-y-4">
            {group.sliders.map((config) => {
              const displayValue = getDisplayValue(
                assumptions[config.key] as number,
                config
              );
              return (
                <div key={config.key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-muted-foreground">{config.label}</label>
                    <span className="text-sm font-semibold text-primary">
                      {formatValue(displayValue, config.format)}
                    </span>
                  </div>
                  <Slider
                    value={[displayValue]}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    onValueChange={([v]) => {
                      const modelValue = config.toModel ? v * config.toModel : v;
                      onChange(config.key, modelValue);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
