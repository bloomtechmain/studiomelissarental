import { getGlobalBufferHours, getBookingFeePercent } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!can(session, "settings:view")) redirect("/admin");

  const [bufferHours, bookingFeePercent] = await Promise.all([
    getGlobalBufferHours(),
    getBookingFeePercent(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Settings</h1>
      <SettingsForm bufferHours={bufferHours} bookingFeePercent={bookingFeePercent} />
    </div>
  );
}
