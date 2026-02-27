import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const REVIEW_TAGS = [
  "Thorough work",
  "On time",
  "Looks amazing",
  "Careful with property",
  "Missed spots",
  "Late arrival",
  "Rushed job",
  "Left debris",
];

interface PrivateReviewCardProps {
  existingReview: {
    rating: number;
    tags: string[];
    comment_public_candidate: string | null;
  } | null;
  onSubmit: (data: {
    rating: number;
    tags?: string[];
    commentPublic?: string;
    commentPrivate?: string;
  }) => void;
  isSubmitting: boolean;
}

export function PrivateReviewCard({
  existingReview,
  onSubmit,
  isSubmitting,
}: PrivateReviewCardProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(existingReview?.rating ?? 0);
  const [tags, setTags] = useState<string[]>(existingReview?.tags ?? []);
  const [commentPublic, setCommentPublic] = useState(existingReview?.comment_public_candidate ?? "");
  const [commentPrivate, setCommentPrivate] = useState("");
  const [step, setStep] = useState<"rating" | "details">(existingReview ? "details" : "rating");

  const isEditing = !existingReview;
  const displayRating = hovered || selected;

  const handleStarClick = (star: number) => {
    if (!isEditing) return;
    setSelected(star);
    setStep("details");
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 4)
    );
  };

  const handleSubmit = () => {
    if (selected === 0) return;
    onSubmit({
      rating: selected,
      tags: tags.length > 0 ? tags : undefined,
      commentPublic: commentPublic.trim() || undefined,
      commentPrivate: commentPrivate.trim() || undefined,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Privacy banner */}
      <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Private feedback</p>
          <p className="text-xs text-muted-foreground">
            Providers see only combined, delayed feedback and never which home it came from.
          </p>
        </div>
      </div>

      {/* Stars */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {existingReview ? "Your Rating" : "Rate this visit"}
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
      </div>

      {/* Details step */}
      {step === "details" && isEditing && (
        <div className="space-y-4">
          {/* Tags */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">What stood out? (optional, up to 4)</p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors",
                    tags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 border-border hover:bg-secondary"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Public-candidate comment */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Feedback for provider coaching (shared only in combined form)
            </p>
            <Textarea
              placeholder="e.g. Missed the edges near the driveway"
              value={commentPublic}
              onChange={(e) => setCommentPublic(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Private-only comment */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Confidential note to Handled Home (never shared with provider)
            </p>
            <Textarea
              placeholder="Only our team will see this"
              value={commentPrivate}
              onChange={(e) => setCommentPrivate(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting…" : "Submit Private Feedback"}
          </Button>
        </div>
      )}

      {existingReview && (
        <div className="space-y-2">
          {existingReview.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existingReview.tags.map((t) => (
                <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
          {existingReview.comment_public_candidate && (
            <p className="text-sm text-muted-foreground italic">
              "{existingReview.comment_public_candidate}"
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            ✓ Submitted privately — providers only see combined feedback
          </p>
        </div>
      )}
    </Card>
  );
}
