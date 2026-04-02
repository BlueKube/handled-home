import { useNavigate } from "react-router-dom";
import { useProperty } from "@/hooks/useProperty";
import { usePropertyPhotoTimeline } from "@/hooks/usePropertyPhotoTimeline";
import { PhotoTimeline } from "@/components/customer/PhotoTimeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export default function CustomerPhotoTimeline() {
  const navigate = useNavigate();
  const { property } = useProperty();
  const { data: photos, isLoading, isError } = usePropertyPhotoTimeline(property?.id);

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-h2">Photo Timeline</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive text-center py-8">Failed to load photos. Please try again.</p>
      ) : (
        <PhotoTimeline photos={photos ?? []} />
      )}
    </div>
  );
}
