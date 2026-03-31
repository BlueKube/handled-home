import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assumptions as defaultAssumptions, seasonalPresets, type ModelAssumptions } from "@/lib/simulation/model";
import { Save, FolderOpen, Trash2 } from "lucide-react";

const STORAGE_KEY = "hh-simulator-scenarios";

interface SavedScenario {
  name: string;
  assumptions: ModelAssumptions;
  savedAt: string;
}

function loadScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScenarios(scenarios: SavedScenario[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // localStorage may be full or unavailable (private browsing)
  }
}

const OPTIMISTIC: Partial<ModelAssumptions> = {
  essential_price_cents: 12900,
  plus_price_cents: 17900,
  premium_price_cents: 27900,
  provider_payout_per_job_cents: 4500,
  byoc_activation_rate: 0.35,
  month_1_churn_rate: 0.08,
  steady_state_monthly_churn: 0.025,
  second_service_attach_90d: 0.35,
};

const CONSERVATIVE: Partial<ModelAssumptions> = {
  essential_price_cents: 8900,
  plus_price_cents: 14900,
  premium_price_cents: 22900,
  provider_payout_per_job_cents: 6500,
  byoc_activation_rate: 0.18,
  month_1_churn_rate: 0.18,
  steady_state_monthly_churn: 0.05,
  second_service_attach_90d: 0.18,
};

interface SimulatorPresetsProps {
  assumptions: ModelAssumptions;
  onLoad: (assumptions: ModelAssumptions) => void;
}

export default function SimulatorPresets({ assumptions, onLoad }: SimulatorPresetsProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);
  const [saveName, setSaveName] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  const applyPreset = (overrides: Partial<ModelAssumptions>) => {
    onLoad({ ...defaultAssumptions, ...overrides });
  };

  const applySeasonal = (market: string) => {
    const preset = seasonalPresets[market];
    if (preset) {
      onLoad({ ...assumptions, ...preset });
    }
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    const scenario: SavedScenario = {
      name: saveName.trim(),
      assumptions: { ...assumptions },
      savedAt: new Date().toISOString(),
    };
    const updated = [...scenarios.filter((s) => s.name !== scenario.name), scenario];
    setScenarios(updated);
    saveScenarios(updated);
    setSaveName("");
  };

  const handleDelete = (name: string) => {
    const updated = scenarios.filter((s) => s.name !== name);
    setScenarios(updated);
    saveScenarios(updated);
  };

  return (
    <div className="space-y-3">
      {/* Scenario Presets */}
      <Card className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Quick Scenarios
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset({})}>
            Baseline
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset(OPTIMISTIC)}>
            Optimistic
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset(CONSERVATIVE)}>
            Conservative
          </Button>
        </div>
      </Card>

      {/* Seasonal Profiles */}
      <Card className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Market Profile
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(seasonalPresets).map((market) => (
            <Button
              key={market}
              variant="outline"
              size="sm"
              className="text-xs capitalize"
              onClick={() => applySeasonal(market)}
            >
              {market}
            </Button>
          ))}
        </div>
      </Card>

      {/* Save / Load */}
      <Card className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Save & Load
        </p>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Scenario name"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!saveName.trim()}>
            <Save className="h-3.5 w-3.5" />
          </Button>
        </div>

        {scenarios.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs w-full justify-start"
            onClick={() => setShowSaved(!showSaved)}
          >
            <FolderOpen className="h-3.5 w-3.5 mr-1" />
            {scenarios.length} saved scenario{scenarios.length !== 1 ? "s" : ""}
          </Button>
        )}

        {showSaved && scenarios.map((s) => (
          <div key={s.name} className="flex items-center justify-between py-1.5 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex-1 justify-start"
              onClick={() => onLoad(s.assumptions)}
            >
              {s.name}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleDelete(s.name)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
