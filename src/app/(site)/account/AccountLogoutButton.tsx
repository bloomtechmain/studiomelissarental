"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AccountLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-signal/60 hover:text-signal hover:shadow-md"
    >
      <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} />
      Sign out
    </button>
  );
}
