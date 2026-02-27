import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FeedbackOutcome } from "@/hooks/useQuickFeedback";

const POSITIVE_TAGS = ["On time", "Great quality", "Looks amazing"];

interface QuickFeedbackCardProps {
  existingFeedback: { outcome: string; tags: string[] } | null;
  onSubmit: (outcome: FeedbackOutcome, tags?: string[]) => void;
  onIssue: () => void;
  isSubmitting: boolean;
}

export function QuickFeedbackCard({
  existingFeedback,
  onSubmit,
  onIssue,
  isSubmitting,
}: QuickFeedbackCardProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);

  if (existingFeedback) {
    const isGood = existingFeedback.outcome === "GOOD";
    return (
      <Card className={cn(
        "p-4 space-y-2 border",
        isGood ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
      )}>
        <div className="flex items-center gap-2">
          {isGood ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          <p className="text-sm font-medium">
            {isGood ? "You said: All good!" : "Issue reported — we're on it"}
          </p>
        </div>
        {existingFeedback.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {existingFeedback.tags.map((t) => (
              <span key={t} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}
      </Card>
    );
  }

  const handleGood = () => {
    if (showTags) {
      onSubmit("GOOD", selectedTags);
    } else {
      setShowTags(true);
    }
  };

  const handleIssue = () => {
    onSubmit("ISSUE");
    onIssue();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold">How did today's visit go?</h3>

      {!showTags ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-success/30 hover:bg-success/10 hover:text-success"
            onClick={handleGood}
            disabled={isSubmitting}
          >
            <ThumbsUp className="h-4 w-4" />
            All good
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-warning/30 hover:bg-warning/10 hover:text-warning"
            onClick={handleIssue}
            disabled={isSubmitting}
          >
            <AlertTriangle className="h-4 w-4" />
            Something wasn't right
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Anything stand out? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {POSITIVE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 border-border hover:bg-secondary"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => onSubmit("GOOD", selectedTags)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Done"}
          </Button>
        </div>
      )}
    </Card>
  );
}
