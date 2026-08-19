"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUnit, updateUnitStatus, addMaintenanceLog, resolveMaintenanceLog } from "../../actions";
import type { UnitStatus } from "@prisma/client";

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
  maintenance: MaintenanceLog[];
};

const STATUS_OPTIONS: UnitStatus[] = ["AVAILABLE", "OUT", "MAINTENANCE", "RETIRED"];

export default function UnitsPanel({ itemId, units }: { itemId: string; units: Unit[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serial, setSerial] = useState("");
  const [maintenanceNote, setMaintenanceNote] = useState<Record<string, string>>({});

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
          return (
            <div key={unit.id} className="rounded border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-navy">{unit.serialNumber}</p>
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
