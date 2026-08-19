"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem, uploadItemPhoto, removeItemPhoto } from "../../actions";
import Image from "next/image";
import { Upload, X } from "lucide-react";

type Item = {
  id: string;
  name: string;
  categoryId: string;
  description: string | null;
  dailyRate: number;
  bufferHours: number | null;
  active: boolean;
  photoUrl: string | null;
};

export default function EditItemForm({
  item,
  categories,
}: {
  item: Item;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [description, setDescription] = useState(item.description ?? "");
  const [dailyRate, setDailyRate] = useState(String(item.dailyRate));
  const [bufferHours, setBufferHours] = useState(item.bufferHours?.toString() ?? "");
  const [active, setActive] = useState(item.active);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateItem(item.id, {
        name,
        categoryId,
        description,
        dailyRate: Number(dailyRate),
        bufferHours: bufferHours ? Number(bufferHours) : null,
        active,
      });
      setSaved(true);
      router.refresh();
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        await uploadItemPhoto(item.id, formData);
        router.refresh();
      } catch {
        setPhotoError("Upload failed — use a JPEG/PNG/WebP/GIF under 8MB.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function handleRemovePhoto() {
    startTransition(async () => {
      await removeItemPhoto(item.id);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-white shadow-sm p-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-navy">Photo</span>
        <div className="flex items-center gap-3">
          {item.photoUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line">
              <Image src={item.photoUrl} alt={item.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-xs text-steel">
              No photo
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:border-signal">
              <Upload className="h-3 w-3" />
              {item.photoUrl ? "Replace photo" : "Upload photo"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={pending}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            {item.photoUrl && (
              <button
                type="button"
                disabled={pending}
                onClick={handleRemovePhoto}
                className="inline-flex w-fit items-center gap-1 text-xs font-medium text-steel hover:text-red-600"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
        {photoError && <p className="text-xs font-medium text-red-600">{photoError}</p>}
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-line px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Category
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded border border-line px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded border border-line px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Daily rate ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Buffer hours override
          <input
            type="number"
            min={0}
            placeholder="Uses global default"
            value={bufferHours}
            onChange={(e) => setBufferHours(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-navy">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (visible in public catalog)
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded bg-navy px-5 py-2.5 font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved && !pending && <span className="text-sm text-signal">Saved.</span>}
      </div>
    </form>
  );
}
