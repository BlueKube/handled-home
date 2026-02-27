import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Brain, ChevronDown } from "lucide-react";
import { useDecisionTraces, type DecisionTrace } from "@/hooks/useDecisionTraces";
import { useState } from "react";

interface DecisionTraceCardProps {
  entityType: string;
  entityId: string | undefined;
}

function TraceRow({ trace }: { trace: DecisionTrace }) {
  const [open, setOpen] = useState(false);
  const candidateCount = Array.isArray(trace.candidates) ? trace.candidates.length : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full text-left">
        <div className="flex items-center gap-3 py-2 px-3 rounded hover:bg-muted/50 transition-colors">
          <Brain className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{trace.decision_type.replace(/_/g, " ")}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(trace.created_at), "MMM d, HH:mm:ss")}
              {candidateCount > 0 && ` · ${candidateCount} candidate${candidateCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          {trace.outcome?.status && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {trace.outcome.status}
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-7 mr-3 mb-3 space-y-3 text-xs">
          {/* Outcome */}
          {trace.outcome && Object.keys(trace.outcome).length > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Outcome</p>
              <pre className="bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(trace.outcome, null, 2)}
              </pre>
            </div>
          )}

          {/* Scoring */}
          {trace.scoring && Object.keys(trace.scoring).length > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Scoring</p>
              <pre className="bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(trace.scoring, null, 2)}
              </pre>
            </div>
          )}

          {/* Candidates */}
          {candidateCount > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Candidates ({candidateCount})
              </p>
              <pre className="bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
                {JSON.stringify(trace.candidates, null, 2)}
              </pre>
            </div>
          )}

          {/* Inputs */}
          {trace.inputs && Object.keys(trace.inputs).length > 0 && (
            <div>
              <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Inputs</p>
              <pre className="bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap max-h-32">
                {JSON.stringify(trace.inputs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DecisionTraceCard({ entityType, entityId }: DecisionTraceCardProps) {
  const { data: traces, isLoading } = useDecisionTraces(entityType, entityId);

  if (isLoading) {
    return (
      <Card className="p-4 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
      </Card>
    );
  }

  if (!traces?.length) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Decision Traces</h3>
          <Badge variant="outline" className="ml-auto text-xs">{traces.length}</Badge>
        </div>
      </div>
      <div className="divide-y">
        {traces.map((trace) => (
          <TraceRow key={trace.id} trace={trace} />
        ))}
      </div>
    </Card>
  );
}
