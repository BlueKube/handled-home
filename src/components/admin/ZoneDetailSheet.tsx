import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useZoneDetail, type ZoneWithRegion } from "@/hooks/useZones";
import { ZoneFormSheet } from "./ZoneFormSheet";
import { ZoneCapacityPanel } from "./ZoneCapacityPanel";
import { ZoneProvidersPanel } from "./ZoneProvidersPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
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
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                  <TabsTrigger value="capacity" className="flex-1">Capacity</TabsTrigger>
                  <TabsTrigger value="providers" className="flex-1">Providers</TabsTrigger>
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

                <TabsContent value="providers" className="pt-4">
                  <ZoneProvidersPanel zoneId={zone.id} />
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
