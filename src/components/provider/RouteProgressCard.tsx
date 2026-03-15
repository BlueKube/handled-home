import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useProviderJobs } from "@/hooks/useProviderJobs";
import { MapPin, ChevronRight } from "lucide-react";
import { useMemo } from "react";

type StopStatus = "completed" | "active" | "upcoming";

export function RouteProgressCard() {
  const navigate = useNavigate();
  const { data: todayJobs, isLoading } = useProviderJobs("today_all");

  const stops = useMemo(() => {
    if (!todayJobs || todayJobs.length === 0) return null;

    const segments: StopStatus[] = todayJobs.map((j) => {
      if (j.status === "COMPLETED") return "completed";
      if (["IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE"].includes(j.status)) return "active";
      return "upcoming";
    });

    const completed = segments.filter((s) => s === "completed").length;
    const total = segments.length;

    return { segments, completed, total };
  }, [todayJobs]);

  if (isLoading) {
    return <div className="h-16 rounded-2xl bg-muted animate-pulse" />;
  }

  if (!stops || stops.total === 0) return null;

  return (
    <Card
      className="p-3 cursor-pointer press-feedback"
      role="button"
      tabIndex={0}
      aria-label={`Route progress: ${stops.completed} of ${stops.total} stops complete. View all jobs.`}
      onClick={() => navigate("/provider/jobs")}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), navigate("/provider/jobs"))}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">
            {stops.completed}/{stops.total} stops
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex gap-1">
        {stops.segments.map((status, i) => (
          <div
            key={i}
            className={`h-2 flex-1 min-w-[4px] rounded-full transition-colors ${
              status === "completed"
                ? "bg-success"
                : status === "active"
                  ? "bg-warning"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
