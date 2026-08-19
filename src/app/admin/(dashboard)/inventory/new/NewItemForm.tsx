"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem, createCategory, uploadItemPhoto } from "../../actions";
import { Upload, X } from "lucide-react";

export default function NewItemForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [dailyRate, setDailyRate] = useState("0");
  const [bufferHours, setBufferHours] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!categoryId) {
      setError("Choose or add a category first.");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createItem({
          name,
          categoryId,
          description,
          dailyRate: Number(dailyRate),
          bufferHours: bufferHours ? Number(bufferHours) : null,
        });
        // The photo upload action needs a real itemId, so it can only
        // happen once the item exists — right after creation, before the
        // redirect, keeps it feeling like one step from the user's side.
        if (photo) {
          const formData = new FormData();
          formData.set("file", photo);
          await uploadItemPhoto(id, formData);
        }
        router.push(`/admin/inventory/${id}`);
      } catch {
        setError("Could not create item.");
      }
    });
  }

  function handleAddCategory() {
    if (!newCategory.trim()) return;
    startTransition(async () => {
      await createCategory(newCategory.trim());
      setNewCategory("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border border-line px-3 py-2"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-navy">Photo</span>
        <div className="flex items-center gap-3">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="h-20 w-20 shrink-0 rounded-lg border border-line object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-xs text-steel">
              No photo
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded border border-line px-3 py-1.5 text-xs font-semibold text-navy hover:border-signal">
              <Upload className="h-3 w-3" />
              {photoPreview ? "Replace photo" : "Upload photo"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex w-fit items-center gap-1 text-xs font-medium text-steel hover:text-red-600"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-navy" htmlFor="categoryId">
          Category
        </label>
        <select
          id="categoryId"
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
        <div className="mt-1 flex gap-2">
          <input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 rounded border border-line px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="rounded border border-line px-3 py-1.5 text-sm text-navy hover:border-signal"
          >
            Add category
          </button>
        </div>
      </div>

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

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded bg-navy px-5 py-2.5 font-semibold text-white hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create item"}
      </button>
    </form>
  );
}
