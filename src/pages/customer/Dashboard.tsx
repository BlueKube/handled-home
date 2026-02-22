import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/StatCard";

export default function CustomerDashboard() {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-h2 mb-1">Your home is handled.</h1>
      <p className="text-caption mb-6">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard icon={CalendarDays} label="Next Service Day" value="Tuesday" />
        <StatCard icon={CheckCircle2} label="Recent Visits" value="0" />
      </div>
    </div>
  );
}
