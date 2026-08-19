"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUnit,
  updateUnitStatus,
  updateUnitDetails,
  addMaintenanceLog,
  resolveMaintenanceLog,
} from "../../actions";
import type { UnitStatus } from "@prisma/client";
import { ChevronDown, ChevronUp } from "lucide-react";

type MaintenanceLog = {
  id: string;
  description: string;
  resolved: boolean;
  resolvedBy: string | null;
};

type Unit = {
  id: string;
  serialNumber: string;
  status: UnitStatus;
  notes: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  reserved: boolean;
  maintenance: MaintenanceLog[];
};

const STATUS_OPTIONS: UnitStatus[] = ["AVAILABLE", "OUT", "MAINTENANCE", "RETIRED"];

export default function UnitsPanel({ itemId, units }: { itemId: string; units: Unit[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serial, setSerial] = useState("");
  const [maintenanceNote, setMaintenanceNote] = useState<Record<string, string>>({});
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const [purchaseDate, setPurchaseDate] = useState<Record<string, string>>({});
  const [purchaseCost, setPurchaseCost] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!serial.trim()) return;
    startTransition(async () => {
      await createUnit(itemId, serial.trim());
      setSerial("");
      router.refresh();
    });
  }

  function handleStatusChange(unitId: string, status: UnitStatus) {
    if (status === "MAINTENANCE") return; // handled via the maintenance-note flow below
    startTransition(async () => {
      await updateUnitStatus(unitId, itemId, status);
      router.refresh();
    });
  }

  function toggleDetails(unit: Unit) {
    setOpenDetails((prev) => ({ ...prev, [unit.id]: !prev[unit.id] }));
    // Seed the editable fields from the unit the first time it's expanded.
    setPurchaseDate((prev) => (unit.id in prev ? prev : { ...prev, [unit.id]: unit.purchaseDate ?? "" }));
    setPurchaseCost((prev) =>
      unit.id in prev ? prev : { ...prev, [unit.id]: unit.purchaseCost !== null ? String(unit.purchaseCost) : "" }
    );
    setNotes((prev) => (unit.id in prev ? prev : { ...prev, [unit.id]: unit.notes ?? "" }));
  }

  function handleSaveDetails(unitId: string) {
    startTransition(async () => {
      await updateUnitDetails(unitId, itemId, {
        purchaseDate: purchaseDate[unitId] || null,
        purchaseCost: purchaseCost[unitId] ? Number(purchaseCost[unitId]) : null,
        notes: notes[unitId] ?? "",
      });
      router.refresh();
    });
  }

  function handleFlagMaintenance(unitId: string) {
    const description = maintenanceNote[unitId]?.trim();
    if (!description) return;
    startTransition(async () => {
      await addMaintenanceLog(unitId, itemId, description);
      setMaintenanceNote((prev) => ({ ...prev, [unitId]: "" }));
      router.refresh();
    });
  }

  function handleResolve(logId: string, unitId: string) {
    startTransition(async () => {
      await resolveMaintenanceLog(logId, unitId, itemId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white shadow-sm p-5">
      <h2 className="font-semibold text-navy">Units ({units.length})</h2>

      <div className="mt-3 space-y-4">
        {units.map((unit) => {
          const openLog = unit.maintenance.find((m) => !m.resolved);
          const detailsOpen = Boolean(openDetails[unit.id]);
          return (
            <div key={unit.id} className="rounded border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-navy">{unit.serialNumber}</p>
                  {unit.status === "AVAILABLE" && unit.reserved && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-amber/15 px-2 py-0.5 text-[11px] font-semibold text-amber-deep">
                      Reserved — upcoming booking
                    </span>
                  )}
                </div>
                <select
                  value={unit.status}
                  disabled={pending}
                  onChange={(e) => handleStatusChange(unit.id, e.target.value as UnitStatus)}
                  className="rounded border border-line px-2 py-1 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} disabled={s === "MAINTENANCE"}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {openLog ? (
                <div className="mt-2 rounded bg-amber/10 px-3 py-2 text-sm">
                  <p className="text-amber-deep">Maintenance: {openLog.description}</p>
                  <button
                    disabled={pending}
                    onClick={() => handleResolve(openLog.id, unit.id)}
                    className="mt-1 text-xs font-semibold text-signal hover:underline"
                  >
                    Mark resolved (returns to Available)
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    placeholder="Flag an issue…"
                    value={maintenanceNote[unit.id] ?? ""}
                    onChange={(e) =>
                      setMaintenanceNote((prev) => ({ ...prev, [unit.id]: e.target.value }))
                    }
                    className="flex-1 rounded border border-line px-2 py-1 text-sm"
                  />
                  <button
                    disabled={pending}
                    onClick={() => handleFlagMaintenance(unit.id)}
                    className="rounded border border-line px-3 py-1 text-xs font-semibold text-navy hover:border-signal"
                  >
                    Flag maintenance
                  </button>
                </div>
              )}

              {unit.maintenance.filter((m) => m.resolved).length > 0 && (
                <details className="mt-2 text-xs text-steel">
                  <summary className="cursor-pointer">Maintenance history</summary>
                  <ul className="mt-1 space-y-1">
                    {unit.maintenance
                      .filter((m) => m.resolved)
                      .map((m) => (
                        <li key={m.id}>
                          {m.description} — resolved by {m.resolvedBy}
                        </li>
                      ))}
                  </ul>
                </details>
              )}

              <button
                type="button"
                onClick={() => toggleDetails(unit)}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-steel hover:text-navy"
              >
                {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Purchase details &amp; notes
              </button>

              {detailsOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2 rounded bg-paper/60 p-2.5">
                  <label className="flex flex-col gap-1 text-xs font-medium text-navy">
                    Purchase date
                    <input
                      type="date"
                      value={purchaseDate[unit.id] ?? ""}
                      onChange={(e) => setPurchaseDate((prev) => ({ ...prev, [unit.id]: e.target.value }))}
                      className="rounded border border-line px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-navy">
                    Purchase cost ($)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={purchaseCost[unit.id] ?? ""}
                      onChange={(e) => setPurchaseCost((prev) => ({ ...prev, [unit.id]: e.target.value }))}
                      className="rounded border border-line px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-navy">
                    Notes
                    <textarea
                      rows={2}
                      value={notes[unit.id] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [unit.id]: e.target.value }))}
                      className="rounded border border-line px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleSaveDetails(unit.id)}
                    className="col-span-2 w-fit rounded bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Save details
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddUnit} className="mt-4 flex gap-2">
        <input
          placeholder="New serial number"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          className="flex-1 rounded border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Add unit
        </button>
      </form>
    </div>
  );
}
