import { useNavigate } from "react-router-dom";
import { useCustomerIssues } from "@/hooks/useCustomerIssues";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  missed_something: "Missed something",
  damage_concern: "Damage concern",
  not_satisfied: "Not satisfied",
  other: "Other",
};

/** Derive display status from the linked support_ticket when available */
function deriveDisplayStatus(issue: { status: string; ticket_status?: string | null }) {
  const ts = issue.ticket_status;
  if (ts === "resolved") return "resolved";
  if (ts === "ai_reviewing") return "under_review";
  if (ts === "in_review" || ts === "awaiting_provider") return "under_review";
  // Fall back to the customer_issues own status
  if (issue.status === "resolved") return "resolved";
  if (issue.status === "under_review") return "under_review";
  return "submitted";
}

export default function CustomerIssues() {
  const { data: issues, isLoading } = useCustomerIssues();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-h2 mb-4">My Issues</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-h2 mb-4">My Issues</h1>

      {(!issues || issues.length === 0) ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No issues reported</p>
          <p className="text-xs text-muted-foreground mt-1">Any concerns you report will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <Card
              key={issue.id}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => navigate(`/customer/visits/${issue.job_id}`)}
            >
              <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{REASON_LABELS[issue.reason] ?? issue.reason}</span>
                  <StatusBadge
                    status={deriveDisplayStatus(issue)}
                    className="text-[10px] h-5"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">{issue.note}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(issue.created_at), "MMM d, yyyy")}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
