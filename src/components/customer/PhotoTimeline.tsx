import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Camera, ZoomIn, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { TimelinePhoto } from "@/hooks/usePropertyPhotoTimeline";

interface PhotoTimelineProps {
  photos: TimelinePhoto[];
}

export function PhotoTimeline({ photos }: PhotoTimelineProps) {
  const [selected, setSelected] = useState<TimelinePhoto | null>(null);

  // Group by visit date
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelinePhoto[]>();
    for (const p of photos) {
      const key = p.completedAt
        ? format(new Date(p.completedAt), "yyyy-MM-dd")
        : p.scheduledDate ?? "unknown";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries());
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Camera className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No photos yet</p>
        <p className="text-xs text-muted-foreground mt-1">Photos from completed visits will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {grouped.map(([dateKey, groupPhotos]) => {
          const displayDate = dateKey !== "unknown"
            ? format(new Date(dateKey), "EEEE, MMM d, yyyy")
            : "Unknown date";
          const skuName = groupPhotos[0]?.skuName;

          return (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {displayDate}
                </p>
                {skuName && (
                  <span className="text-xs text-muted-foreground">· {skuName}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {groupPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelected(photo)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                  >
                    {photo.signedUrl ? (
                      <img
                        src={photo.signedUrl}
                        alt={photo.slotKey ?? "Visit photo"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    {photo.slotKey && (
                      <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 px-1.5 py-0.5">
                        <p className="text-[10px] text-white truncate">{photo.slotKey.replace(/_/g, " ")}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-sm">
              {selected?.slotKey?.replace(/_/g, " ") ?? "Photo"}
              {selected?.completedAt && (
                <span className="text-muted-foreground font-normal ml-2">
                  {format(new Date(selected.completedAt), "MMM d, yyyy")}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          {selected?.signedUrl && (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={selected.signedUrl}
                alt={selected.slotKey ?? "Visit photo"}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
