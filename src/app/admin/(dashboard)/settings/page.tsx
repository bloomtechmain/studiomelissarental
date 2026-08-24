import { getGlobalBufferHours, getBookingFeePercent, getCompanySignatureUrl } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";
import CompanySignatureForm from "./CompanySignatureForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!can(session, "settings:view")) redirect("/admin");

  const [bufferHours, bookingFeePercent, companySignatureUrl] = await Promise.all([
    getGlobalBufferHours(),
    getBookingFeePercent(),
    getCompanySignatureUrl(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Settings</h1>
      <SettingsForm bufferHours={bufferHours} bookingFeePercent={bookingFeePercent} />
      <CompanySignatureForm currentUrl={companySignatureUrl} />
    </div>
  );
}
