"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Trash2, ChevronUp, ChevronDown, ImageOff } from "lucide-react";
import {
  uploadGalleryImages,
  deleteGalleryImage,
  reorderGalleryImages,
  updateGalleryImageCaption,
} from "../actions";

type GalleryImage = { id: string; imageUrl: string; caption: string | null };

export default function GalleryClient({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local order mirrors the server order optimistically so the up/down
  // reorder buttons feel instant; router.refresh() after each mutation
  // brings fresh `images` props, which this re-syncs into local state
  // (the React-recommended "adjust state during render" pattern, since
  // doing this in an effect would cause an extra render pass).
  const [prevImages, setPrevImages] = useState(images);
  const [order, setOrder] = useState(images);
  if (images !== prevImages) {
    setPrevImages(images);
    setOrder(images);
  }

  function handleFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);
    startTransition(async () => {
      try {
        const result = await uploadGalleryImages(formData);
        if (!result.ok) {
          setError(result.error);
        } else {
          router.refresh();
        }
      } catch {
        setError("Could not upload — check your connection and try again.");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this photo from the gallery?")) return;
    setOrder((o) => o.filter((img) => img.id !== id));
    startTransition(async () => {
      try {
        await deleteGalleryImage(id);
        router.refresh();
      } catch {
        setError("Could not delete photo.");
        router.refresh();
      }
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    startTransition(async () => {
      try {
        await reorderGalleryImages(next.map((img) => img.id));
        router.refresh();
      } catch {
        setError("Could not save new order.");
        router.refresh();
      }
    });
  }

  function handleCaptionBlur(id: string, value: string) {
    startTransition(async () => {
      await updateGalleryImageCaption(id, value.trim());
    });
  }

  return (
    <div>
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded bg-amber px-4 py-2 text-sm font-semibold text-amber-deep hover:brightness-95">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload photos"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFilesChosen}
          disabled={pending}
          className="hidden"
        />
      </label>
      <p className="mt-1.5 text-xs text-steel">JPEG, PNG, WebP, or GIF — up to 20MB per photo.</p>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {order.map((img, index) => (
          <div
            key={img.id}
            className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
          >
            <div className="relative aspect-square">
              <Image
                src={img.imageUrl}
                alt={img.caption ?? "Gallery photo"}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="flex items-center justify-between gap-1 border-t border-line bg-paper px-2 py-1.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0 || pending}
                className="rounded p-1 text-steel hover:text-navy disabled:opacity-30"
                title="Move earlier"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1 || pending}
                className="rounded p-1 text-steel hover:text-navy disabled:opacity-30"
                title="Move later"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <input
                defaultValue={img.caption ?? ""}
                onBlur={(e) => handleCaptionBlur(img.id, e.target.value)}
                placeholder="Caption (optional)"
                className="min-w-0 flex-1 rounded border border-line bg-white px-1.5 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={pending}
                className="rounded p-1 text-steel hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {order.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-12 text-steel">
            <ImageOff className="h-6 w-6" />
            <p className="text-sm">No photos yet — upload some to populate the public gallery.</p>
          </div>
        )}
      </div>
    </div>
  );
}
