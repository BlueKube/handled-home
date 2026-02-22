import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const REASONS = ["customer_request", "capacity_rebalance", "weather_event", "route_optimization", "other"];

interface ServiceDayOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  currentDay: string;
  onOverride: (data: { assignmentId: string; newDay: string; newWindow: string; reason: string; notes?: string }) => void;
  isPending: boolean;
}

export function ServiceDayOverrideModal({
  open,
  onOpenChange,
  assignmentId,
  currentDay,
  onOverride,
  isPending,
}: ServiceDayOverrideModalProps) {
  const [newDay, setNewDay] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const canSubmit = newDay && reason && confirmText === "OVERRIDE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Service Day</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Current Day</Label>
            <p className="text-sm font-medium capitalize">{currentDay}</p>
          </div>

          <div className="space-y-2">
            <Label>New Day</Label>
            <Select value={newDay} onValueChange={setNewDay}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.filter((d) => d !== currentDay).map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context…" />
          </div>

          <div className="space-y-2">
            <Label>Type OVERRIDE to confirm</Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="OVERRIDE" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!canSubmit || isPending}
            onClick={() => onOverride({ assignmentId, newDay, newWindow: "any", reason, notes: notes || undefined })}
          >
            {isPending ? "Overriding…" : "Force Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
