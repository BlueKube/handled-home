import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

const ISSUE_TYPES = [
  { value: "COULD_NOT_ACCESS", label: "Could not access property" },
  { value: "SAFETY_CONCERN", label: "Safety concern" },
  { value: "MISSING_SUPPLIES", label: "Missing supplies" },
  { value: "EXCESSIVE_SCOPE", label: "Excessive scope" },
  { value: "CUSTOMER_REQUESTED_CHANGE", label: "Customer requested change" },
  { value: "WEATHER_RELATED", label: "Weather related" },
  { value: "OTHER", label: "Other" },
];

const SEVERITIES = [
  { value: "LOW", label: "Low" },
  { value: "MED", label: "Medium" },
  { value: "HIGH", label: "High" },
];

interface ReportIssueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: { issue_type: string; severity: string; description?: string }) => Promise<void>;
  isPending?: boolean;
}

export function ReportIssueSheet({ open, onOpenChange, onSubmit, isPending }: ReportIssueSheetProps) {
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState("MED");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!issueType) return;
    await onSubmit({
      issue_type: issueType,
      severity,
      description: description.trim() || undefined,
    });
    setIssueType("");
    setSeverity("MED");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Report an Issue
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Issue Type</label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Severity</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!issueType || isPending}
          >
            Submit Issue
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
