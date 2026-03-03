import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

interface AuditReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  changeLabel: string;
}

export function AuditReasonModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  changeLabel,
}: AuditReasonModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length < 3) return;
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Audit Reason Required</DialogTitle>
          <DialogDescription>
            You're updating <strong>{changeLabel}</strong>. Provide a brief
            reason so the change log explains why this was modified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="audit-reason">Reason for change</Label>
          <Textarea
            id="audit-reason"
            placeholder="e.g. Increasing window to 3 hours for winter coverage"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || reason.trim().length < 3}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
