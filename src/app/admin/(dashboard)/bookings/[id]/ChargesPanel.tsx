"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBookingCharge, removeBookingCharge } from "../../actions";
import SectionHeader from "@/components/admin/SectionHeader";
import { Tag, Trash2 } from "lucide-react";

type Charge = { id: string; description: string; quantity: number; unitPrice: number };
type AddOn = { id: string; name: string; price: number };

export default function ChargesPanel({
  bookingId,
  charges,
  addOns,
}: {
  bookingId: string;
  charges: Charge[];
  addOns: AddOn[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("0");

  function applyAddOn(id: string) {
    const addOn = addOns.find((a) => a.id === id);
    if (addOn) {
      setDesc(addOn.name);
      setPrice(String(addOn.price));
    }
  }

  function handleAdd() {
    if (!desc.trim()) return;
    startTransition(async () => {
      await addBookingCharge(bookingId, { description: desc.trim(), quantity: qty, unitPrice: Number(price) });
      setDesc("");
      setQty(1);
      setPrice("0");
      router.refresh();
    });
  }

  function handleRemove(chargeId: string) {
    startTransition(async () => {
      await removeBookingCharge(chargeId, bookingId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <SectionHeader icon={Tag}>Add-ons &amp; discounts</SectionHeader>
      <ul className="mt-2 divide-y divide-line">
        {charges.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-navy">
              {c.description} {c.quantity > 1 && `×${c.quantity}`}
            </span>
            <div className="flex items-center gap-3">
              <span className={c.unitPrice < 0 ? "text-signal" : "text-navy"}>
                ${(c.unitPrice * c.quantity).toFixed(2)}
              </span>
              <button onClick={() => handleRemove(c.id)} className="text-steel hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
        {charges.length === 0 && <p className="py-2 text-sm text-steel">None yet.</p>}
      </ul>

      {addOns.length > 0 && (
        <select
          onChange={(e) => e.target.value && applyAddOn(e.target.value)}
          defaultValue=""
          className="mt-3 w-full rounded border border-line px-2 py-1.5 text-sm"
        >
          <option value="">Add from add-on list…</option>
          {addOns.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — ${a.price.toFixed(2)}
            </option>
          ))}
        </select>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-navy">
          Description
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Extra mic, discount, travel fee…"
            className="w-full rounded border border-line px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-navy">
          Qty
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full rounded border border-line px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-navy">
          Price ($, negative = discount)
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded border border-line px-2 py-1.5 text-sm"
          />
        </label>
        <button
          disabled={pending}
          onClick={handleAdd}
          className="col-span-2 rounded bg-navy px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
