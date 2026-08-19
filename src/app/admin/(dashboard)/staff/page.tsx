import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import StaffClient from "./StaffClient";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const session = await getSession();
  if (!session || !can(session, "staff:manage")) redirect("/admin");

  const staff = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Staff accounts</h1>
      <p className="mt-1 text-sm text-steel">
        Owner/Admin only. Permissions are attached to roles, not individual accounts.
      </p>
      <div className="mt-6">
        <StaffClient
          staff={staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role }))}
          currentUserId={session.id}
        />
      </div>
    </div>
  );
}
