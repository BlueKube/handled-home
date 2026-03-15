import { CalendarDays, CheckCircle, Sparkles } from "lucide-react";

interface CycleStatsRowProps {
  upcomingCount: number;
  completedCount: number;
  handlesUsed: number | null;
  handlesPerCycle: number | null;
}

function StatPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border p-3 text-center">
      <Icon className="h-4 w-4 text-accent mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function CycleStatsRow({ upcomingCount, completedCount, handlesUsed, handlesPerCycle }: CycleStatsRowProps) {
  const handlesValue =
    handlesUsed != null && handlesPerCycle != null
      ? `${handlesUsed}/${handlesPerCycle}`
      : "—";

  return (
    <div className="grid grid-cols-3 gap-3 animate-fade-in" role="group" aria-label="Cycle statistics">
      <StatPill icon={CalendarDays} label="Upcoming" value={upcomingCount} />
      <StatPill icon={CheckCircle} label="Completed" value={completedCount} />
      <StatPill icon={Sparkles} label="Handles" value={handlesValue} />
    </div>
  );
}
