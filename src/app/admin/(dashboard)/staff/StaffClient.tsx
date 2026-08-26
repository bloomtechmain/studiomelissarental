"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaffUser, updateStaffRole, resetStaffPassword, deleteStaffUser } from "../actions";
import type { Role } from "@prisma/client";
import { Trash2, KeyRound, UserPlus } from "lucide-react";
import SectionHeader from "@/components/admin/SectionHeader";

type StaffUser = { id: string; name: string; email: string; role: Role };

const ROLES: Role[] = ["ADMIN", "STAFF_BOOKINGS", "STAFF_WAREHOUSE"];
const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Owner / Admin",
  STAFF_BOOKINGS: "Staff — Bookings",
  STAFF_WAREHOUSE: "Staff — Warehouse / Ops",
};

export default function StaffClient({ staff, currentUserId }: { staff: StaffUser[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF_BOOKINGS");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createStaffUser({ name, email, password, role });
        setName("");
        setEmail("");
        setPassword("");
        setRole("STAFF_BOOKINGS");
        router.refresh();
      } catch {
        setError("Could not create staff account — email may already be in use.");
      }
    });
  }

  function handleRoleChange(userId: string, newRole: Role) {
    startTransition(async () => {
      await updateStaffRole(userId, newRole);
      router.refresh();
    });
  }

  function handleResetPassword(userId: string) {
    if (!newPassword.trim()) return;
    startTransition(async () => {
      await resetStaffPassword(userId, newPassword.trim());
      setResetTarget(null);
      setNewPassword("");
      router.refresh();
    });
  }

  function handleDelete(userId: string) {
    startTransition(async () => {
      await deleteStaffUser(userId);
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
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-navy">{s.name}</td>
                <td className="px-4 py-3 text-steel">{s.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={s.role}
                    disabled={pending}
                    onChange={(e) => handleRoleChange(s.id, e.target.value as Role)}
                    className="rounded border border-line px-2 py-1 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {resetTarget === s.id ? (
                      <>
                        <input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="rounded border border-line px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => handleResetPassword(s.id)}
                          className="text-xs font-semibold text-signal hover:underline"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setResetTarget(s.id)}
                        className="text-steel hover:text-signal"
                        aria-label="Reset password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    )}
                    {s.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-steel hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm"
      >
        <SectionHeader icon={UserPlus}>Add staff account</SectionHeader>
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
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-line px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-navy">
            Temporary password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-line px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-navy">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="rounded border border-line px-3 py-2"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
