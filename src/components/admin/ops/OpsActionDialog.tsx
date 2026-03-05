import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRecordOpsAction } from "@/hooks/useOpsExceptions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exceptionId: string;
  exceptionType: string;
}

const ACTION_TYPES = [
  { value: "reorder_route", label: "Reorder Route" },
  { value: "move_day", label: "Move to Different Day" },
  { value: "swap_provider", label: "Swap Provider" },
  { value: "convert_profile", label: "Convert Scheduling Profile" },
  { value: "cancel_visit", label: "Cancel Visit" },
  { value: "issue_credit", label: "Issue Credit/Refund" },
  { value: "contact_customer", label: "Contact Customer" },
  { value: "contact_provider", label: "Contact Provider" },
  { value: "schedule_redo", label: "Schedule Redo Visit" },
  { value: "admin_note", label: "Add Note" },
];

const REASON_CODES = [
  { value: "customer_request", label: "Customer Request" },
  { value: "provider_issue", label: "Provider Issue" },
  { value: "weather", label: "Weather" },
  { value: "capacity", label: "Capacity Constraint" },
  { value: "quality", label: "Quality Concern" },
  { value: "ops_decision", label: "Ops Decision" },
  { value: "system_auto", label: "System Auto-action" },
  { value: "escalation", label: "Escalation" },
];

export function OpsActionDialog({ open, onOpenChange, exceptionId, exceptionType }: Props) {
  const [actionType, setActionType] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [isFreezeOverride, setIsFreezeOverride] = useState(false);
  const recordAction = useRecordOpsAction();

  const handleSubmit = async () => {
    if (!actionType || !reasonCode) {
      toast.error("Action type and reason are required");
      return;
    }
    try {
      await recordAction.mutateAsync({
        exceptionId,
        actionType,
        reasonCode,
        reasonNote: reasonNote || undefined,
        isFreezeOverride,
      });
      toast.success("Action recorded");
      onOpenChange(false);
      setActionType("");
      setReasonCode("");
      setReasonNote("");
      setIsFreezeOverride(false);
    } catch {
      toast.error("Failed to record action");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Ops Action</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Action Type</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select action…" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Reason Code</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select reason…" />
              </SelectTrigger>
              <SelectContent>
                {REASON_CODES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Note (optional)</Label>
            <Textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Additional context…"
              className="h-20 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isFreezeOverride} onCheckedChange={setIsFreezeOverride} />
            <Label className="text-xs">This is a freeze override (breaks scheduling freeze)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={recordAction.isPending}>
            {recordAction.isPending ? "Recording…" : "Record Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
