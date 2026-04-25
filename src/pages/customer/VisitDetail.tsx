import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useCustomerVisitDetail } from "@/hooks/useCustomerVisitDetail";
import { getVisitMode } from "@/lib/visitMode";
import { VisitDetailPreview } from "./VisitDetailPreview";
import { VisitDetailLive } from "./VisitDetailLive";
import { VisitDetailComplete } from "./VisitDetailComplete";

export default function CustomerVisitDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useCustomerVisitDetail(jobId);

  if (isLoading) {
    return (
      <div className="p-4 pb-24">
        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-in p-4 pb-24">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2 mb-4"
          onClick={() => navigate("/customer/visits")}
        >
          <ChevronLeft className="h-4 w-4" />
          Visits
        </Button>
        <QueryErrorCard
          message="Failed to load visit details."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data || !jobId) {
    return (
      <div className="p-4 pb-24 text-center">
        <p className="text-sm text-muted-foreground">Visit not found.</p>
        <Button variant="link" onClick={() => navigate("/customer/visits")}>
          ← Back to visits
        </Button>
      </div>
    );
  }

  const mode = getVisitMode(data.job);

  if (mode === "preview") return <VisitDetailPreview jobId={jobId} data={data} />;
  if (mode === "live") return <VisitDetailLive data={data} />;
  return <VisitDetailComplete jobId={jobId} data={data} />;
}
