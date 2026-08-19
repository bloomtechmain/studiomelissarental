"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAddOn, updateAddOn } from "../actions";

type AddOn = { id: string; name: string; price: number; active: boolean };

export default function AddOnsClient({ addOns }: { addOns: AddOn[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await createAddOn({ name: name.trim(), price: Number(price) });
      setName("");
      setPrice("0");
      router.refresh();
    });
  }

  function handleUpdate(addOn: AddOn, patch: Partial<AddOn>) {
    startTransition(async () => {
      await updateAddOn(addOn.id, {
        name: patch.name ?? addOn.name,
        price: patch.price ?? addOn.price,
        active: patch.active ?? addOn.active,
      });
      router.refresh();
    });
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-steel">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {addOns.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2">
                  <input
                    disabled={pending}
                    defaultValue={a.name}
                    onBlur={(e) => e.target.value !== a.name && handleUpdate(a, { name: e.target.value })}
                    className="w-full rounded border border-transparent px-2 py-1 hover:border-line focus:border-line"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={pending}
                    defaultValue={a.price}
                    onBlur={(e) =>
                      Number(e.target.value) !== a.price && handleUpdate(a, { price: Number(e.target.value) })
                    }
                    className="w-24 rounded border border-transparent px-2 py-1 hover:border-line focus:border-line"
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    disabled={pending}
                    onClick={() => handleUpdate(a, { active: !a.active })}
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      a.active ? "bg-signal-light text-navy" : "bg-line text-steel"
                    }`}
                  >
                    {a.active ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
            {addOns.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-steel">
                  No add-ons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-navy">
          New add-on name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Extra wireless mic"
            className="rounded border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Price ($)
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 rounded border border-line px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
