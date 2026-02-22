import { useState } from "react";
import { useRegions, useUpdateRegion, type Region } from "@/hooks/useRegions";
import { RegionFormDialog } from "./RegionFormDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Archive } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function RegionsTab() {
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRegion, setEditRegion] = useState<Region | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Region | null>(null);

  const { data: regions, isLoading } = useRegions(showArchived);
  const updateRegion = useUpdateRegion();

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await updateRegion.mutateAsync({ id: archiveTarget.id, status: "archived" });
      toast.success("Region archived");
    } catch (err: any) {
      toast.error(err.message);
    }
    setArchiveTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="show-archived" className="text-caption">Show archived</Label>
        </div>
        <Button size="sm" onClick={() => { setEditRegion(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Region
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : !regions?.length ? (
        <p className="text-muted-foreground text-center py-12">No regions yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {regions.map((r) => (
            <Card
              key={r.id}
              className="flex items-center justify-between px-4 py-3 press-feedback cursor-pointer"
              onClick={() => { setEditRegion(r); setDialogOpen(true); }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-caption">{(r as any).state || "CA"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={r.status} />
                {r.status !== "archived" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setArchiveTarget(r); }}
                  >
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <RegionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} region={editRegion} />

      <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{archiveTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived regions won't appear in zone selects. This can be undone by editing the region.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
