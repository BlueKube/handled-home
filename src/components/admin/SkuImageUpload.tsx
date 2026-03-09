import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getServiceImage } from "@/lib/serviceImages";

interface SkuImageUploadProps {
  skuId: string | null;
  skuName: string;
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
}

export function SkuImageUpload({ skuId, skuName, imageUrl, onImageUrlChange }: SkuImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Show the current effective image (DB url, bundled fallback, or nothing)
  const previewSrc = imageUrl ?? (skuId ? getServiceImage(skuId, skuName) : null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("sku-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("sku-images")
        .getPublicUrl(path);

      onImageUrlChange(urlData.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onImageUrlChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleRemove = useCallback(async () => {
    if (imageUrl) {
      // Extract storage path from public URL
      const parts = imageUrl.split("/sku-images/");
      if (parts[1]) {
        await supabase.storage.from("sku-images").remove([parts[1]]);
      }
    }
    onImageUrlChange(null);
  }, [imageUrl, onImageUrlChange]);

  return (
    <div>
      <Label>Service Image</Label>
      <div
        className={`mt-1.5 relative rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {previewSrc ? (
          <div className="relative group">
            <img
              src={previewSrc}
              alt={skuName || "Service image"}
              className="w-full h-36 object-cover"
              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-1" />}
                Replace
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
            {!imageUrl && previewSrc && (
              <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                Default
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="w-full h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs">Drop image or click to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = "";
        }}
      />
      <p className="text-caption mt-1">Recommended: 800x450px, JPG or PNG, under 5 MB.</p>
    </div>
  );
}
