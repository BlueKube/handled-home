import { StatCard } from "@/components/StatCard";
import { Briefcase, Clock } from "lucide-react";

export default function ProviderDashboard() {
  return (
    <div className="p-4 max-w-4xl">
      <h1 className="text-h2 mb-1">Provider Dashboard</h1>
      <p className="text-caption mb-6">Your jobs for today.</p>

      <div className="grid gap-3 grid-cols-2">
        <StatCard
          icon={Briefcase}
          label="Today's Jobs"
          value={0}
        />
        <StatCard
          icon={Clock}
          label="Est. Time"
          value="0 min"
        />
      </div>
    </div>
  );
}
