"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-signal-light/60 transition hover:text-white"
    >
      <LogOut className="h-3 w-3" /> Sign out
    </button>
  );
}
