import { Users, DollarSign, MapPin, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-h2 mb-1">Admin Console</h1>
      <p className="text-caption mb-6">Operations overview.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Customers" value="0" />
        <StatCard icon={DollarSign} label="MRR" value="$0" />
        <StatCard icon={MapPin} label="Active Zones" value="0" />
        <StatCard icon={TrendingUp} label="Utilization" value="0%" />
      </div>
    </div>
  );
}
