// Client-side image downscale + JPEG re-encode.
//
// The backend caps the WHOLE multipart upload at ~1MB, so raw photos (2–5MB)
// must be shrunk before upload or nginx rejects the body (413 / connection
// reset) before the request ever reaches the app. This resizes the longest
// edge to `maxDim` and re-encodes as JPEG at `quality`, which brings typical
// photos well under a few hundred KB. Falls back to the original file for
// non-images or on any failure.
export function compressImage(file, { maxDim = 1000, quality = 0.8 } = {}) {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/")) {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const longest = Math.max(width, height);
      if (longest > maxDim) {
        const scale = maxDim / longest;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          // Keep the original if compression didn't actually help.
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
