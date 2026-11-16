// A small item thumbnail for document item tables. Renders the item's image,
// or a silhouette placeholder when there is no image (or it fails to load).
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/services/lib/env";

export default function ItemThumbnail({ image, name, className }) {
  const [broken, setBroken] = useState(false);
  const src = resolveMediaUrl(image);
  const show = Boolean(src) && !broken;

  if (show) {
    return (
      <img
        src={src}
        alt={name || "Item"}
        onError={() => setBroken(true)}
        className={cn(
          "h-10 w-10 shrink-0 rounded-md border border-border/60 object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground",
        className,
      )}
      aria-label={name ? `${name} (no image)` : "No image"}
    >
      <ImageIcon className="h-5 w-5" />
    </div>
  );
}
