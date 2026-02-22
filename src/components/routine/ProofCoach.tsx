import { useState } from "react";
import { ChevronDown, ChevronUp, Camera, CheckCircle2, Eye } from "lucide-react";

export function ProofCoach() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">How proof works</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <Camera className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Before & After Photos</p>
              <p className="text-xs text-muted-foreground">
                Your provider takes photos before starting and after completing each service.
                You'll see these in your visit history.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Completion Checklist</p>
              <p className="text-xs text-muted-foreground">
                Each service has a quality checklist. Your provider marks each step as complete.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Your Review</p>
              <p className="text-xs text-muted-foreground">
                After each visit, you can review the proof and rate the service.
                Issues are flagged automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
