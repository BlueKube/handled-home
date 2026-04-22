// Canvas-based image compression shared between job uploads (useJobActions)
// and snap uploads (useSubmitSnap). Renders the source image into an offscreen
// canvas scaled to maxDim on the longer axis, then encodes as JPEG at quality.
export async function compressImage(
  file: File,
  maxDim: number,
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(objectUrl);
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return reject(new Error("No canvas context"));
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            return blob ? resolve(blob) : reject(new Error("Compression failed"));
          },
          "image/jpeg",
          quality,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    img.onerror = (err) => {
      cleanup();
      reject(err);
    };
    img.src = objectUrl;
  });
}
