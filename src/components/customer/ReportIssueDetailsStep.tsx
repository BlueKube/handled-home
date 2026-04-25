import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react";

export interface DetailsStepCopy {
  label: string;
  blurb: string;
  placeholder: string;
  photoMode: "required" | "optional" | "hidden";
  privateToHandled?: boolean;
}

interface Props {
  copy: DetailsStepCopy;
  note: string;
  onNoteChange: (next: string) => void;
  photo: File | null;
  onPhotoChange: (next: File | null) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

/**
 * Per-category details step inside ReportIssueSheet. Extracted so the
 * parent Sheet stays under the 300-line decompose threshold (CLAUDE.md §13).
 */
export function ReportIssueDetailsStep({
  copy,
  note,
  onNoteChange,
  photo,
  onPhotoChange,
  onBack,
  onSubmit,
  submitting,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRequired = copy.photoMode === "required";
  const photoAllowed = copy.photoMode !== "hidden";

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground -ml-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to categories
      </button>

      <p className="text-sm text-muted-foreground">{copy.blurb}</p>

      {copy.privateToHandled && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-xs">
          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            Only the Handled team sees this — not your provider.
          </p>
        </div>
      )}

      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value.slice(0, 500))}
        placeholder={copy.placeholder}
        rows={4}
        aria-label={`${copy.label} description`}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{note.length}/500</span>
        {photoRequired && !photo && (
          <span className="text-destructive">Photo required</span>
        )}
      </div>

      {photoAllowed && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
          />
          {photo ? (
            <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm truncate flex-1">{photo.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPhotoChange(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              {photoRequired ? "Add photo (required)" : "Add photo (optional)"}
            </Button>
          )}
        </div>
      )}

      <Button
        className="w-full"
        disabled={
          !note.trim() || (photoRequired && !photo) || submitting
        }
        onClick={onSubmit}
      >
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </>
  );
}
