import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitRatingCardProps {
  existingRating: { rating: number; comment: string | null } | null;
  onSubmit: (rating: number, comment?: string) => void;
  isSubmitting: boolean;
}

export function VisitRatingCard({ existingRating, onSubmit, isSubmitting }: VisitRatingCardProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(existingRating?.rating ?? 0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [showComment, setShowComment] = useState(!!existingRating?.comment);

  const isEditing = !existingRating;
  const displayRating = hovered || selected;

  const handleStarClick = (star: number) => {
    if (!isEditing) return;
    setSelected(star);
    if (!showComment) setShowComment(true);
  };

  const handleSubmit = () => {
    if (selected === 0) return;
    onSubmit(selected, comment.trim() || undefined);
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {existingRating ? "Your Rating" : "How was this visit?"}
      </h3>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isEditing}
            className={cn(
              "p-0.5 transition-transform",
              isEditing && "hover:scale-110 cursor-pointer",
              !isEditing && "cursor-default"
            )}
            onMouseEnter={() => isEditing && setHovered(star)}
            onMouseLeave={() => isEditing && setHovered(0)}
            onClick={() => handleStarClick(star)}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                star <= displayRating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {displayRating === 1 && "Poor"}
            {displayRating === 2 && "Fair"}
            {displayRating === 3 && "Good"}
            {displayRating === 4 && "Great"}
            {displayRating === 5 && "Excellent"}
          </span>
        )}
      </div>

      {showComment && isEditing && (
        <div className="space-y-2">
          <Textarea
            placeholder="Anything you'd like to share? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting…" : "Submit Rating"}
          </Button>
        </div>
      )}

      {existingRating?.comment && (
        <p className="text-sm text-muted-foreground italic">"{existingRating.comment}"</p>
      )}
    </Card>
  );
}
