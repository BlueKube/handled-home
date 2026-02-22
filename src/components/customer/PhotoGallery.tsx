import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { VisitPhoto } from "@/hooks/useCustomerVisitDetail";

interface PhotoGalleryProps {
  photos: VisitPhoto[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<VisitPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">Finalizing your receipt…</p>
        <p className="text-xs text-muted-foreground mt-1">Photos will appear here shortly.</p>
      </div>
    );
  }

  const requiredPhotos = photos.filter((p) => p.slot_key);
  const optionalPhotos = photos.filter((p) => !p.slot_key);

  return (
    <>
      <div className="space-y-3">
        {requiredPhotos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Required Photos</p>
            <div className="grid grid-cols-2 gap-2">
              {requiredPhotos.map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onSelect={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          </div>
        )}

        {optionalPhotos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Additional Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {optionalPhotos.map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onSelect={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen viewer */}
      <Sheet open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-sm">
              {selectedPhoto?.slot_key ?? "Photo"}
            </SheetTitle>
          </SheetHeader>
          {selectedPhoto?.signedUrl && (
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img
                src={selectedPhoto.signedUrl}
                alt={selectedPhoto.slot_key ?? "Visit photo"}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function PhotoThumbnail({ photo, onSelect }: { photo: VisitPhoto; onSelect: () => void }) {
  if (!photo.signedUrl) return null;

  return (
    <button
      onClick={onSelect}
      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
    >
      <img
        src={photo.signedUrl}
        alt={photo.slot_key ?? "Visit photo"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
      {photo.slot_key && (
        <div className="absolute bottom-0 left-0 right-0 bg-foreground/60 px-1.5 py-0.5">
          <p className="text-[10px] text-white truncate">{photo.slot_key}</p>
        </div>
      )}
    </button>
  );
}
