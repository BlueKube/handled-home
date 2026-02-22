import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const REASONS = ["customer_request", "capacity_rebalance", "weather_event", "route_optimization", "other"];

interface CapacityInfo {
  day_of_week: string;
  max_homes: number;
  buffer_percent: number;
  assigned_count: number;
}

interface ServiceDayOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  currentDay: string;
  onOverride: (data: { assignmentId: string; newDay: string; newWindow: string; reason: string; notes?: string }) => void;
  isPending: boolean;
  capacities?: CapacityInfo[]; // M5: capacity data for warning
}

export function ServiceDayOverrideModal({
  open,
  onOpenChange,
  assignmentId,
  currentDay,
  onOverride,
  isPending,
  capacities,
}: ServiceDayOverrideModalProps) {
  const [newDay, setNewDay] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const canSubmit = newDay && reason && confirmText === "OVERRIDE";

  // M5: Check if selected day exceeds capacity
  const selectedCap = capacities?.find((c) => c.day_of_week === newDay);
  const isOverCapacity = selectedCap
    ? selectedCap.assigned_count >= (selectedCap.max_homes + Math.floor(selectedCap.max_homes * selectedCap.buffer_percent / 100))
    : false;

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

          {/* M5: Capacity warning */}
          {newDay && isOverCapacity && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This day is at capacity ({selectedCap!.assigned_count}/{selectedCap!.max_homes + Math.floor(selectedCap!.max_homes * selectedCap!.buffer_percent / 100)}).
                Override will exceed the limit.
              </AlertDescription>
            </Alert>
          )}

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
