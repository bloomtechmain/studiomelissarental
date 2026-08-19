"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem } from "../../actions";

type Item = {
  id: string;
  name: string;
  categoryId: string;
  description: string | null;
  dailyRate: number;
  bufferHours: number | null;
  active: boolean;
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-white shadow-sm p-5">
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
