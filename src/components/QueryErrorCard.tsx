import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface QueryErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * 2A Cleanup: Reusable error state card for failed queries.
 * Shows an error message and optional retry button.
 */
export function QueryErrorCard({ message = "Something went wrong loading data.", onRetry }: QueryErrorCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}
