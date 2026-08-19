"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomer } from "../../actions";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  org: string | null;
  notes: string | null;
  tags: string[];
};

export default function EditCustomerForm({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [org, setOrg] = useState(customer.org ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [tags, setTags] = useState(customer.tags.join(", "));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await updateCustomer(customer.id, {
        name,
        email,
        phone,
        org,
        notes,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-white shadow-sm p-5">
      <div className="grid grid-cols-2 gap-4">
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
          Organization
          <input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-navy">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-line px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Tags (comma separated)
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="church, repeat customer"
          className="rounded border border-line px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-navy">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded border border-line px-3 py-2"
        />
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
