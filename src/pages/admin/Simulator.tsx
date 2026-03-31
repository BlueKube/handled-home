import { useState, useMemo } from "react";
import { assumptions as defaultAssumptions, type ModelAssumptions } from "@/lib/simulation/model";
import { simulate } from "@/lib/simulation/simulate";
import SimulatorControls from "@/components/admin/simulator/SimulatorControls";
import SimulatorMetricCards from "@/components/admin/simulator/SimulatorMetricCards";
import { Activity } from "lucide-react";

export default function Simulator() {
  const [currentAssumptions, setCurrentAssumptions] = useState<ModelAssumptions>({
    ...defaultAssumptions,
  });

  const handleChange = (key: keyof ModelAssumptions, value: number) => {
    setCurrentAssumptions((prev) => ({ ...prev, [key]: value }));
  };

  const result = useMemo(() => simulate(currentAssumptions), [currentAssumptions]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Market Simulator</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust assumptions and see 12-month projections instantly.
        </p>
      </div>

      <SimulatorMetricCards result={result} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          <SimulatorControls
            assumptions={currentAssumptions}
            onChange={handleChange}
          />
        </div>
        <div className="lg:col-span-3">
          {/* Charts and projection table will be added in B3 */}
          <div className="text-center text-muted-foreground py-20 border border-dashed rounded-lg">
            Charts and monthly projection table (B3)
          </div>
        </div>
      </div>
    </div>
  );
}
