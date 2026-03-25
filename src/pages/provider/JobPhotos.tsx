import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ChevronLeft, Camera, Upload, RotateCcw, Plus, CheckCircle2,
  XCircle, Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRef, useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ProviderJobPhotos() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(true);

  // Generate signed URLs for uploaded photos
  useEffect(() => {
    if (!data?.photos) {
      setLoadingUrls(false);
      return;
    }
    const uploaded = data.photos.filter((p) => p.upload_status === "UPLOADED");
    if (uploaded.length === 0) {
      setLoadingUrls(false);
      return;
    }

    const fetchSignedUrls = async () => {
      setLoadingUrls(true);
      const urls: Record<string, string> = {};
      await Promise.all(
        uploaded.map(async (p) => {
          const { data: urlData } = await supabase.storage
            .from("job-photos")
            .createSignedUrl(p.storage_path, 3600);
          if (urlData?.signedUrl) urls[p.id] = urlData.signedUrl;
        })
      );
      setSignedUrls(urls);
      setLoadingUrls(false);
    };
    fetchSignedUrls();
  }, [data?.photos]);

  // Group required photos by SKU
  const skuPhotoGroups = useMemo(() => {
    if (!data) return [];
    const { photos, skus } = data;
    const requiredPhotos = photos.filter((p) => p.slot_key);
    const skuMap = new Map(skus.map((s) => [s.sku_id, s]));
    const groups = new Map<string, { name: string; proofMin: number | null; photos: typeof requiredPhotos }>();

    for (const photo of requiredPhotos) {
      const key = photo.sku_id ?? "__general__";
      if (!groups.has(key)) {
        const sku = photo.sku_id ? skuMap.get(photo.sku_id) : null;
        groups.set(key, {
          name: sku?.sku_name_snapshot ?? "General",
          proofMin: sku?.scheduled_level_proof_photo_min ?? null,
          photos: [],
        });
      }
      groups.get(key)!.photos.push(photo);
    }
    return Array.from(groups.values());
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-32" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const { photos, job, property } = data;
  const isReadOnly = !["IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE"].includes(job.status);
  const requiredPhotos = photos.filter((p) => p.slot_key);
  const extraPhotos = photos.filter((p) => !p.slot_key);
  const uploadedRequired = requiredPhotos.filter((p) => p.upload_status === "UPLOADED").length;
  const pendingCount = photos.filter((p) => p.upload_status === "PENDING").length;
  const progress = requiredPhotos.length > 0 ? Math.round((uploadedRequired / requiredPhotos.length) * 100) : 100;
  const allRequiredUploaded = uploadedRequired === requiredPhotos.length && requiredPhotos.length > 0;
  const showStickyBar = !isReadOnly;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await actions.uploadPhoto.mutateAsync({ file });
      toast({ title: "Photo uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRetry = async (photoId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await actions.retryUpload.mutateAsync({ photoId, file });
        toast({ title: "Photo re-uploaded" });
      } catch (err: any) {
        toast({ title: "Retry failed", description: err.message, variant: "destructive" });
      }
    };
    input.click();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "UPLOADED": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "FAILED": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning animate-pulse" />;
    }
  };

  const PhotoCard = ({ photo, label }: { photo: any; label: string }) => (
    <Card key={photo.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {statusIcon(photo.upload_status)}
          <div className="min-w-0">
            <p className="text-sm font-medium capitalize truncate">{label}</p>
            <p className="text-xs text-muted-foreground">{photo.upload_status.toLowerCase()}</p>
          </div>
        </div>
        {photo.upload_status === "FAILED" && !isReadOnly && (
          <Button size="default" variant="outline" className="h-11" onClick={() => handleRetry(photo.id)}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
      {/* Photo thumbnail */}
      {signedUrls[photo.id] ? (
        <img
          src={signedUrls[photo.id]}
          alt={label}
          className="w-full h-40 object-cover rounded-xl"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
            if (import.meta.env.DEV) console.warn('[ProviderJobPhotos] Failed to load photo:', photo.storage_path);
          }}
        />
      ) : photo.upload_status === "UPLOADED" && loadingUrls ? (
        <Skeleton className="w-full h-40 rounded-xl" />
      ) : photo.upload_status === "PENDING" && !isReadOnly ? (
        <div className="w-full h-40 rounded-xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
          <Camera className="h-6 w-6 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Awaiting upload</span>
        </div>
      ) : null}
    </Card>
  );

  return (
    <>
      <div className={`animate-fade-in p-4 space-y-4 ${showStickyBar ? "pb-48" : "pb-24"}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/provider/jobs/${jobId}`)}
            aria-label="Back to job detail"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-h3">Photos</h1>
            <p className="text-caption truncate">
              {property ? `${property.street_address}, ${property.city}` : `${uploadedRequired}/${requiredPhotos.length} required uploaded`}
            </p>
          </div>
          {isReadOnly && <StatusBadge status={job.status.toLowerCase()} />}
        </div>

        {/* Progress */}
        {requiredPhotos.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {uploadedRequired}/{requiredPhotos.length} required uploaded
              </span>
              {allRequiredUploaded && (
                <span className="text-xs text-success font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> All done
                </span>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* All uploaded celebration */}
        {allRequiredUploaded && (
          <Card className="p-4 bg-success/5 border-success/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">All required photos uploaded</p>
                <p className="text-xs text-muted-foreground">Head back to job detail to complete the job.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Pending uploads warning */}
        {pendingCount > 0 && (
          <Card className="p-3 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-2 text-sm text-warning font-medium">
              <Upload className="h-4 w-4" />
              {pendingCount} upload{pendingCount !== 1 ? "s" : ""} pending
            </div>
          </Card>
        )}

        {/* Empty state — no photos required */}
        {requiredPhotos.length === 0 && extraPhotos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Camera className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold text-foreground">No photos required</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              This job doesn't require photo proof. You can still add extra photos below.
            </p>
          </div>
        )}

        {/* Required photos grouped by SKU */}
        {skuPhotoGroups.map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <h2 className="text-sm font-semibold text-foreground">{group.name}</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {group.photos.filter((p) => p.upload_status === "UPLOADED").length}/{group.photos.length} photos
              </span>
            </div>
            {group.photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                label={photo.slot_key?.replace(/_/g, " ") ?? "Required"}
              />
            ))}
          </div>
        ))}

        {/* Extra photos */}
        {extraPhotos.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold px-1">Additional Photos</h2>
            {extraPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} label="Extra photo" />
            ))}
          </div>
        )}

        {/* Add extra photo button */}
        {!isReadOnly && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              variant="outline"
              size="lg"
              className="w-full h-11"
              onClick={() => fileRef.current?.click()}
              disabled={actions.uploadPhoto.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Extra Photo
            </Button>
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      {showStickyBar && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 pb-safe space-y-2">
          <Button
            className="w-full"
            size="lg"
            variant={allRequiredUploaded ? "accent" : "default"}
            onClick={() => navigate(`/provider/jobs/${jobId}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Job Detail
          </Button>
        </div>
      )}
    </>
  );
}
