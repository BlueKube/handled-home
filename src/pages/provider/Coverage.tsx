import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QueryErrorCard } from "@/components/QueryErrorCard";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { useProviderAvailability } from "@/hooks/useProviderAvailability";
import { toast } from "sonner";
import { format, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MapPin, Wrench, CheckCircle, XCircle, Clock, Camera,
  CalendarIcon, CalendarOff, Plus, Trash2, AlertTriangle, ChevronLeft,
} from "lucide-react";

interface CoverageRow {
  id: string;
  coverage_type: string | null;
  request_status: string;
  max_travel_miles: number | null;
  zones: { name: string } | null;
}

interface CapabilityRow {
  id: string;
  capability_key: string;
  is_enabled: boolean;
  sku_id: string | null;
  service_skus: {
    name: string;
    category: string;
    duration_minutes: number | null;
    required_photos: number | null;
  } | null;
}

function blockTypeLabel(t: string) {
  switch (t) {
    case "DAY_OFF": return "Day Off";
    case "VACATION": return "Vacation";
    case "LIMITED_CAPACITY": return "Limited";
    default: return t;
  }
}

function blockTypeVariant(t: string): "default" | "secondary" | "outline" {
  switch (t) {
    case "VACATION": return "default";
    case "DAY_OFF": return "secondary";
    default: return "outline";
  }
}

function blockTypeDescription(t: string) {
  switch (t) {
    case "DAY_OFF": return "Blocks auto-assignment for the day";
    case "VACATION": return "Blocks auto-assignment for the entire period";
    case "LIMITED_CAPACITY": return "Informational only — visible to admin, does not block assignment";
    default: return "";
  }
}

function AvailabilitySection() {
  const { blocks, shortNoticeBlocks, isLoading, isError, refetch, createBlock, cancelBlock } = useProviderAvailability();
  const [showForm, setShowForm] = useState(false);
  const [blockType, setBlockType] = useState("DAY_OFF");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [note, setNote] = useState("");

  const handleCreate = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    createBlock.mutate(
      {
        block_type: blockType,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Time off scheduled");
          setShowForm(false);
          setStartDate(undefined);
          setEndDate(undefined);
          setNote("");
        },
        onError: () => toast.error("Failed to create availability block"),
      }
    );
  };

  if (isLoading) return <Skeleton className="h-32 rounded-xl" />;
  if (isError) return <QueryErrorCard message="Failed to load availability." onRetry={() => refetch()} />;

  const today = new Date();
  const upcomingBlocks = blocks.filter((b) => new Date(b.end_date) >= today);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
            Time Off & Availability
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lead-time warnings */}
        {shortNoticeBlocks.length > 0 && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-warning">Short notice</p>
              <p className="text-xs text-muted-foreground">
                {shortNoticeBlocks.length} block{shortNoticeBlocks.length !== 1 ? "s" : ""} starting within 48 hours.
                Backup coverage will be used for affected customers.
              </p>
            </div>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="p-3 border border-border rounded-lg space-y-3 bg-muted/30">
            <Select value={blockType} onValueChange={setBlockType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY_OFF">Day Off</SelectItem>
                <SelectItem value="VACATION">Vacation</SelectItem>
                <SelectItem value="LIMITED_CAPACITY">Limited Capacity</SelectItem>
              </SelectContent>
            </Select>
            {blockType === "LIMITED_CAPACITY" && (
              <p className="text-xs text-muted-foreground italic">
                ℹ️ Limited Capacity is informational — it won't block job assignments. Use Day Off or Vacation to prevent scheduling.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left text-xs", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {startDate ? format(startDate, "MMM d") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setStartDate(d);
                      if (!endDate || (d && endDate < d)) setEndDate(d);
                    }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left text-xs", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {endDate ? format(endDate, "MMM d") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(d) => d < (startDate ?? new Date(new Date().setHours(0, 0, 0, 0)))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Textarea
              placeholder="Optional note (e.g., family vacation)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-sm"
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={createBlock.isPending || !startDate || !endDate}>
                {createBlock.isPending ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>

            {startDate && endDate && (
              <p className="text-xs text-muted-foreground">
                Backup coverage will be used for affected customers during this period.
              </p>
            )}
          </div>
        )}

        {/* Existing blocks */}
        {upcomingBlocks.length === 0 && !showForm ? (
          <div className="text-center py-6">
            <CalendarOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming time off</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap "Add" to schedule days off or vacation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBlocks.map((b) => {
              const days = differenceInCalendarDays(new Date(b.end_date), new Date(b.start_date)) + 1;
              return (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <CalendarOff className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {format(new Date(b.start_date), "MMM d")}
                        {b.start_date !== b.end_date && ` – ${format(new Date(b.end_date), "MMM d")}`}
                      </p>
                      <Badge variant={blockTypeVariant(b.block_type)} className="text-xs">
                        {blockTypeLabel(b.block_type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {days} day{days !== 1 ? "s" : ""}
                      {b.note && ` · ${b.note}`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-11 shrink-0"
                    onClick={() => {
                      cancelBlock.mutate(b.id, {
                        onSuccess: () => toast.success("Time off canceled"),
                        onError: () => toast.error("Failed to cancel"),
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CoverageZones() {
  const { org } = useProviderOrg();
  const { coverage, loading, isError, refetch } = useProviderCoverage(org?.id);

  if (loading) return <Skeleton className="h-32 rounded-xl" />;
  if (isError) return <QueryErrorCard message="Failed to load coverage zones." onRetry={() => refetch()} />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Coverage Zones
          </CardTitle>
          <Badge variant="outline" className="text-xs">{coverage.length} zone{coverage.length !== 1 ? "s" : ""}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {coverage.length === 0 ? (
          <div className="text-center py-6">
            <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No coverage zones assigned</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Coverage zones are assigned during onboarding</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(coverage as CoverageRow[]).map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.zones?.name ?? "Zone"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize">
                      {(c.coverage_type ?? "primary").toLowerCase()}
                    </Badge>
                    <Badge variant={c.request_status === "APPROVED" ? "default" : "secondary"} className="text-xs">
                      {c.request_status}
                    </Badge>
                  </div>
                </div>
                {c.max_travel_miles && (
                  <span className="text-xs text-muted-foreground">{c.max_travel_miles} mi</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkuCapabilities() {
  const { org } = useProviderOrg();
  const { capabilities, loading, toggleCapability, isError, refetch } = useProviderCapabilities(org?.id);

  if (loading) return <Skeleton className="h-48 rounded-xl" />;
  if (isError) return <QueryErrorCard message="Failed to load capabilities." onRetry={() => refetch()} />;

  const grouped: Record<string, CapabilityRow[]> = {};
  (capabilities as CapabilityRow[]).forEach((cap) => {
    const cat = cap.service_skus?.category ?? cap.capability_key ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(cap);
  });
  const categories = Object.keys(grouped).sort();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Service Capabilities
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {(capabilities as CapabilityRow[]).filter((c) => c.is_enabled).length}/{capabilities.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {capabilities.length === 0 ? (
          <div className="text-center py-6">
            <Wrench className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No service capabilities configured</p>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h3>
                <div className="space-y-2">
                  {grouped[cat].map((cap) => {
                    const sku = cap.service_skus;
                    return (
                      <div key={cap.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                        <Switch
                          checked={cap.is_enabled}
                          onCheckedChange={(checked) => {
                            if (!org) return;
                            toggleCapability.mutate(
                              { orgId: org.id, skuId: cap.sku_id ?? "", skuName: sku?.name ?? "", category: cat, enabled: checked },
                              {
                                onSuccess: () => toast.success(`${sku?.name ?? "Service"} ${checked ? "enabled" : "disabled"}`),
                                onError: () => toast.error("Failed to update capability"),
                              }
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{sku?.name ?? cap.capability_key}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {sku?.duration_minutes && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />{sku.duration_minutes} min
                              </span>
                            )}
                            {sku?.required_photos != null && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Camera className="h-3 w-3" />{sku.required_photos} photos
                              </span>
                            )}
                          </div>
                        </div>
                        {cap.is_enabled ? (
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProviderCoverage() {
  const navigate = useNavigate();
  const { loading, isError, refetch } = useProviderOrg();

  if (loading) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4">
        <h1 className="text-h2">Coverage & Capacity</h1>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-in p-4 pb-24 space-y-4">
        <h1 className="text-h2">Coverage & Capacity</h1>
        <QueryErrorCard message="Failed to load organization data." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/settings")} aria-label="Back to settings">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Coverage & Capacity</h1>
          <p className="text-caption mt-0.5">Your zones, availability, and service capabilities</p>
        </div>
      </div>
      <AvailabilitySection />
      <CoverageZones />
      <SkuCapabilities />
    </div>
  );
}
