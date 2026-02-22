import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useZoneDetail, type ZoneWithRegion } from "@/hooks/useZones";
import { useZoneServiceWeekConfig, useUpsertZoneServiceWeekConfig } from "@/hooks/useZoneServiceWeekConfig";
import { ZoneFormSheet } from "./ZoneFormSheet";
import { ZoneCapacityPanel } from "./ZoneCapacityPanel";
import { ZoneProvidersPanel } from "./ZoneProvidersPanel";
import { ZoneOpsConfigPanel } from "./ZoneOpsConfigPanel";
import { ZoneSeasonalPanel } from "./ZoneSeasonalPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Archive, Pencil } from "lucide-react";
import { useUpdateZone } from "@/hooks/useZones";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ZoneDetailSheetProps {
  zoneId: string | null;
  onClose: () => void;
}

export function ZoneDetailSheet({ zoneId, onClose }: ZoneDetailSheetProps) {
  const { data: zone, isLoading } = useZoneDetail(zoneId);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const updateZone = useUpdateZone();

  const handleArchive = async () => {
    if (!zone) return;
    try {
      await updateZone.mutateAsync({ id: zone.id, status: "archived" });
      toast.success("Zone archived");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
    setArchiveOpen(false);
  };

  const dayLabel = zone?.default_service_day
    ? zone.default_service_day.charAt(0).toUpperCase() + zone.default_service_day.slice(1, 3)
    : "";
  const windowLabel = zone?.default_service_window ? ` • ${zone.default_service_window.toUpperCase()}` : "";

  return (
    <>
      <Sheet open={!!zoneId} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:mx-auto">
          {isLoading || !zone ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader className="flex flex-row items-center justify-between">
                <div>
                  <SheetTitle className="text-left">{zone.name}</SheetTitle>
                  <p className="text-caption">{zone.regions?.name} • {dayLabel}{windowLabel} • {zone.zip_codes.length} zips</p>
                </div>
                <StatusBadge status={zone.status} />
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                  <TabsTrigger value="capacity" className="flex-1 text-xs">Capacity</TabsTrigger>
                  <TabsTrigger value="ops" className="flex-1 text-xs">Ops</TabsTrigger>
                  <TabsTrigger value="service-week" className="flex-1 text-xs">Week</TabsTrigger>
                  <TabsTrigger value="providers" className="flex-1 text-xs">Providers</TabsTrigger>
                  <TabsTrigger value="seasonal" className="flex-1 text-xs">Seasonal</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Region:</span> {zone.regions?.name}</p>
                    <p><span className="text-muted-foreground">Day:</span> {zone.default_service_day}{windowLabel}</p>
                    <p><span className="text-muted-foreground">Zips:</span> {zone.zip_codes.join(", ")}</p>
                    <p><span className="text-muted-foreground">Max homes/day:</span> {zone.max_stops_per_day}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    {zone.status !== "archived" && (
                      <Button variant="outline" className="flex-1 text-destructive" onClick={() => setArchiveOpen(true)}>
                        <Archive className="h-4 w-4 mr-1" /> Archive
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="capacity" className="pt-4">
                  <ZoneCapacityPanel zone={zone} />
                </TabsContent>

                <TabsContent value="ops" className="pt-4">
                  <ZoneOpsConfigPanel zoneId={zone.id} />
                </TabsContent>

                <TabsContent value="service-week" className="pt-4">
                  <ZoneServiceWeekPanel zoneId={zone.id} />
                </TabsContent>

                <TabsContent value="providers" className="pt-4">
                  <ZoneProvidersPanel zoneId={zone.id} />
                </TabsContent>

                <TabsContent value="seasonal" className="pt-4">
                  <ZoneSeasonalPanel zoneId={zone.id} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {zone && <ZoneFormSheet open={editOpen} onOpenChange={setEditOpen} zone={zone} />}

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{zone?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived zones won't match customer coverage lookups. Data is preserved for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ZoneServiceWeekPanel({ zoneId }: { zoneId: string }) {
  const { data: config, isLoading } = useZoneServiceWeekConfig(zoneId);
  const upsert = useUpsertZoneServiceWeekConfig();
  const [anchorDay, setAnchorDay] = useState(1);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (config) {
      setAnchorDay(config.anchor_day);
      setIsActive(config.is_active);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({ zone_id: zoneId, anchor_day: anchorDay, is_active: isActive });
      toast.success("Service week config saved");
    } catch {
      toast.error("Could not save config");
    }
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Define the weekly operational anchor for this zone. Service weeks run 7 days from the anchor day.
      </p>

      <div className="space-y-2">
        <Label>Anchor Day</Label>
        <Select value={String(anchorDay)} onValueChange={(v) => setAnchorDay(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DAY_LABELS.map((label, i) => (
              <SelectItem key={i} value={String(i)}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <Button size="sm" className="w-full" onClick={handleSave} disabled={upsert.isPending}>
        {upsert.isPending ? "Saving…" : config ? "Update Config" : "Create Config"}
      </Button>
    </div>
  );
}
