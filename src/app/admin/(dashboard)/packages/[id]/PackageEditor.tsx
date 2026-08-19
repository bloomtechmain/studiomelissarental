"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updatePackage,
  addPackageComponent,
  updatePackageComponentQuantity,
  removePackageComponent,
} from "../../actions";
import { Trash2 } from "lucide-react";

type Component = { id: string; itemId: string; itemName: string; quantity: number };
type ItemOption = { id: string; name: string; unitCount: number };

export default function PackageEditor({
  packageId,
  description,
  price,
  active,
  components,
  items,
}: {
  packageId: string;
  description: string;
  price: number;
  active: boolean;
  components: Component[];
  items: ItemOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [desc, setDesc] = useState(description);
  const [priceVal, setPriceVal] = useState(String(price));
  const [activeVal, setActiveVal] = useState(active);

  const [newItemId, setNewItemId] = useState(items[0]?.id ?? "");
  const [newQty, setNewQty] = useState(1);

  function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updatePackage(packageId, {
        description: desc,
        price: Number(priceVal),
        active: activeVal,
      });
      setSaved(true);
      router.refresh();
    });
  }

  function handleAddComponent() {
    if (!newItemId) return;
    startTransition(async () => {
      await addPackageComponent(packageId, newItemId, newQty);
      setNewQty(1);
      router.refresh();
    });
  }

  function handleQtyChange(componentId: string, qty: number) {
    startTransition(async () => {
      await updatePackageComponentQuantity(componentId, packageId, qty);
      router.refresh();
    });
  }

  function handleRemove(componentId: string) {
    startTransition(async () => {
      await removePackageComponent(componentId, packageId);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSaveDetails}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-navy">Tier details</h2>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Description
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Price ($) — 0 shows as &quot;Custom quote&quot; and disables online booking
          <input
            type="number"
            min={0}
            step="0.01"
            value={priceVal}
            onChange={(e) => setPriceVal(e.target.value)}
            className="w-40 rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-navy">
          <input
            type="checkbox"
            checked={activeVal}
            onChange={(e) => setActiveVal(e.target.checked)}
          />
          Active (visible on public site)
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save details"}
          </button>
          {saved && !pending && <span className="text-sm text-signal">Saved.</span>}
        </div>
      </form>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Equipment composition</h2>
        <p className="mt-1 text-xs text-steel">
          When this package is booked, the system assigns specific serial-numbered units for each
          line below.
        </p>

        <ul className="mt-3 divide-y divide-line">
          {components.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-navy">{c.itemName}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  defaultValue={c.quantity}
                  onBlur={(e) => {
                    const qty = Number(e.target.value);
                    if (qty !== c.quantity && qty > 0) handleQtyChange(c.id, qty);
                  }}
                  className="w-16 rounded border border-line px-2 py-1 text-sm"
                />
                <button
                  disabled={pending}
                  onClick={() => handleRemove(c.id)}
                  className="text-steel hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {components.length === 0 && (
            <li className="py-3 text-sm text-steel">No components yet — add one below.</li>
          )}
        </ul>

        <div className="mt-4 flex items-end gap-2 border-t border-line pt-4">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-navy">
            Item
            <select
              value={newItemId}
              onChange={(e) => setNewItemId(e.target.value)}
              className="rounded border border-line px-2 py-1.5 text-sm"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unitCount} in fleet)
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-navy">
            Qty
            <input
              type="number"
              min={1}
              value={newQty}
              onChange={(e) => setNewQty(Number(e.target.value))}
              className="w-16 rounded border border-line px-2 py-1.5 text-sm"
            />
          </label>
          <button
            disabled={pending || !newItemId}
            onClick={handleAddComponent}
            className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
