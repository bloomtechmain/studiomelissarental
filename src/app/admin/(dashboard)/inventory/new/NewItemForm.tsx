"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem, createCategory } from "../../actions";

export default function NewItemForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [dailyRate, setDailyRate] = useState("0");
  const [bufferHours, setBufferHours] = useState("");
  const [newCategory, setNewCategory] = useState("");

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
