import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobActions } from "@/hooks/useJobActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Camera, Upload, RotateCcw, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ProviderJobPhotos() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useJobDetail(jobId);
  const actions = useJobActions(jobId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  const { photos, job, skus } = data;
  const isReadOnly = !["IN_PROGRESS", "ISSUE_REPORTED", "PARTIAL_COMPLETE"].includes(job.status);
  const requiredPhotos = photos.filter((p) => p.slot_key);
  const extraPhotos = photos.filter((p) => !p.slot_key);
  const pendingCount = photos.filter((p) => p.upload_status === "PENDING").length;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>, slotKey?: string, skuId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await actions.uploadPhoto.mutateAsync({ file, slotKey, skuId });
      toast({ title: "Photo uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRetry = async (photoId: string) => {
    // Trigger file picker for retry
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

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage.from("job-photos").getPublicUrl(storagePath);
    return data?.publicUrl;
  };

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/provider/jobs/${jobId}`)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-h3">Photos</h1>
          <p className="text-caption">
            {requiredPhotos.filter((p) => p.upload_status === "UPLOADED").length}/{requiredPhotos.length} required uploaded
          </p>
        </div>
      </div>

      {pendingCount > 0 && (
        <Card className="p-3 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 text-sm text-warning font-medium">
            <Upload className="h-4 w-4" />
            {pendingCount} upload{pendingCount !== 1 ? "s" : ""} pending
          </div>
        </Card>
      )}

      {/* Required photo slots */}
      {requiredPhotos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Required Photos</h2>
          {requiredPhotos.map((photo) => (
            <Card key={photo.id} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {statusIcon(photo.upload_status)}
                  <div>
                    <p className="text-sm font-medium capitalize">{photo.slot_key?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{photo.upload_status.toLowerCase()}</p>
                  </div>
                </div>
                {photo.upload_status === "FAILED" && !isReadOnly && (
                  <Button size="sm" variant="outline" onClick={() => handleRetry(photo.id)}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Extra photos */}
      {extraPhotos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Additional Photos</h2>
          {extraPhotos.map((photo) => (
            <Card key={photo.id} className="p-3">
              <div className="flex items-center gap-2">
                {statusIcon(photo.upload_status)}
                <p className="text-sm">Extra photo</p>
                <p className="text-xs text-muted-foreground">{photo.upload_status.toLowerCase()}</p>
                {photo.upload_status === "FAILED" && !isReadOnly && (
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => handleRetry(photo.id)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add extra photo */}
      {!isReadOnly && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelected(e)}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={actions.uploadPhoto.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Extra Photo
          </Button>
        </div>
      )}
    </div>
  );
}
