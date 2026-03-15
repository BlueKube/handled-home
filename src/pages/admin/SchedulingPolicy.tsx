import { useState } from "react";
import { useSchedulingPolicy } from "@/hooks/useSchedulingPolicy";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { AuditReasonModal } from "@/components/admin/scheduling/AuditReasonModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  Eye,
  Bell,
  DollarSign,
  Info,
  Pencil,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

interface PendingChange {
  key: string;
  value: any;
  label: string;
}

const WINDOW_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

const ETA_DISPLAY_OPTIONS = [
  { value: "day_plus_range", label: "Day + ETA Range" },
  { value: "day_only", label: "Day Only" },
  { value: "exact_time", label: "Exact Time" },
];

const PRICING_MODE_OPTIONS = [
  { value: "scarcity", label: "Scarcity-Based" },
  { value: "flat", label: "Flat Rate" },
  { value: "disabled", label: "Disabled" },
];

export default function SchedulingPolicySettings() {
  const { values, isLoading, updatePolicy } = useSchedulingPolicy();
  const { isSuperuser, isOps } = useAdminMembership();
  const canEdit = isSuperuser || isOps;

  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  const handleSave = (reason: string) => {
    if (!pendingChange) return;
    updatePolicy.mutate(
      {
        key: pendingChange.key,
        value: pendingChange.value,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${pendingChange.label}`);
          setPendingChange(null);
        },
        onError: (err: any) => {
          toast.error(err.message ?? "Failed to save");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-h2 flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Scheduling Policy
          </h1>
          <p className="text-caption">
            Platform-wide scheduling dials that affect appointment windows, ETA
            display, notifications, and pricing behavior.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-h2 flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Scheduling Policy
          </h1>
          <p className="text-caption">
            Platform-wide scheduling dials that affect appointment windows, ETA
            display, notifications, and pricing behavior.
          </p>
          {!canEdit && (
            <Badge variant="secondary" className="mt-2">
              Read-only — only Ops or Superuser can edit
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1: Appointment Window */}
          <PolicyCard
            icon={Clock}
            title="Appointment Window"
            description="Length of the time window shown to customers for presence-required services."
            affects="Customer-facing appointment slots, home-required service scheduling"
            takesEffect="Next scheduling cycle (immediate for new bookings)"
            whyExists="Wider windows give route optimization more flexibility. Narrower windows improve customer experience but constrain routing."
          >
            <Select
              value={String(values.appointment_window_minutes)}
              onValueChange={(v) =>
                setPendingChange({
                  key: "scheduling.appointment_window_minutes",
                  value: Number(v),
                  label: "Appointment Window",
                })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Current: <strong>{values.appointment_window_minutes} minutes</strong>
            </p>
          </PolicyCard>

          {/* Card 2: ETA Range Display */}
          <PolicyCard
            icon={Eye}
            title="Customer Promise Display"
            description="How ETA / scheduling information is displayed to customers."
            affects="Customer app visit cards, email notifications, SMS confirmations"
            takesEffect="Immediately for all future visit displays"
            whyExists="'Day + ETA range' balances transparency with operational flexibility. 'Exact time' is only feasible with mature route optimization."
          >
            <Select
              value={values.eta_range_display}
              onValueChange={(v) =>
                setPendingChange({
                  key: "scheduling.eta_range_display",
                  value: v,
                  label: "Customer Promise Display",
                })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETA_DISPLAY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Current:{" "}
              <strong>
                {ETA_DISPLAY_OPTIONS.find(
                  (o) => o.value === values.eta_range_display
                )?.label ?? values.eta_range_display}
              </strong>
            </p>
          </PolicyCard>

          {/* Card 3: Arrival Notification */}
          <PolicyCard
            icon={Bell}
            title="Arrival Notification"
            description="How many minutes before arrival the customer gets a push/SMS notification."
            affects="Push notifications, SMS alerts for presence-required appointments"
            takesEffect="Next dispatched visit"
            whyExists="Gives customers time to prepare for the provider's arrival without alerting too early or too late."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={5}
                max={60}
                step={5}
                value={values.arrival_notification_minutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 5 && val <= 60) {
                    setPendingChange({
                      key: "scheduling.arrival_notification_minutes",
                      value: val,
                      label: "Arrival Notification",
                    });
                  }
                }}
                disabled={!canEdit}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current: <strong>{values.arrival_notification_minutes} min</strong>{" "}
              before provider arrives
            </p>
          </PolicyCard>

          {/* Card 4: Preference Pricing Mode */}
          <PolicyCard
            icon={DollarSign}
            title="Preference Pricing Mode"
            description="How paid time preferences (e.g. 'morning only') are priced."
            affects="Handle cost calculation for time-of-day preferences, customer checkout pricing"
            takesEffect="Next billing cycle for new preference selections"
            whyExists="Scarcity pricing reflects real route cost of constraints. Flat pricing is simpler but may underprice high-demand slots."
          >
            <Select
              value={values.preference_pricing_mode}
              onValueChange={(v) =>
                setPendingChange({
                  key: "scheduling.preference_pricing_mode",
                  value: v,
                  label: "Preference Pricing Mode",
                })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Current:{" "}
              <strong>
                {PRICING_MODE_OPTIONS.find(
                  (o) => o.value === values.preference_pricing_mode
                )?.label ?? values.preference_pricing_mode}
              </strong>
            </p>
          </PolicyCard>
        </div>

        {/* Audit Reason Modal */}
        <AuditReasonModal
          open={!!pendingChange}
          onOpenChange={(open) => {
            if (!open) setPendingChange(null);
          }}
          onConfirm={handleSave}
          isPending={updatePolicy.isPending}
          changeLabel={pendingChange?.label ?? ""}
        />
      </div>
    </TooltipProvider>
  );
}

/* ─── Reusable Policy Card ─── */

interface PolicyCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  affects: string;
  takesEffect: string;
  whyExists: string;
  children: React.ReactNode;
}

function PolicyCard({
  icon: Icon,
  title,
  description,
  affects,
  takesEffect,
  whyExists,
  children,
}: PolicyCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs">
              <p className="font-medium mb-1">Why this exists</p>
              <p>{whyExists}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {children}
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium">Affects:</span> {affects}
          </p>
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium">Takes effect:</span> {takesEffect}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
