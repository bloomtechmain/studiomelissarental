"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAgreementStatus, updateInsuranceStatus, uploadAgreementFile } from "../../actions";
import { FileCheck2, ShieldCheck, Upload, FileText } from "lucide-react";
import { format } from "date-fns";
import SignatureBlock from "@/components/SignatureBlock";
import SectionHeader from "@/components/admin/SectionHeader";

export default function AgreementPanel({
  bookingId,
  agreementSigned,
  agreementSignedAt,
  agreementOverridden,
  insuranceOnFile,
  agreementFileUrl,
  agreementFileName,
  signatureName,
  signatureHash,
  signatureIp,
  signatureImageUrl,
  decryptedSignature,
}: {
  bookingId: string;
  agreementSigned: boolean;
  agreementSignedAt: Date | null;
  agreementOverridden: boolean;
  insuranceOnFile: boolean;
  agreementFileUrl: string | null;
  agreementFileName: string | null;
  signatureName: string | null;
  signatureHash: string | null;
  signatureIp: string | null;
  signatureImageUrl: string | null;
  decryptedSignature: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleAgreement(checked: boolean) {
    startTransition(async () => {
      await updateAgreementStatus(bookingId, checked);
      router.refresh();
    });
  }

  function toggleInsurance(checked: boolean) {
    startTransition(async () => {
      await updateInsuranceStatus(bookingId, checked);
      router.refresh();
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        await uploadAgreementFile(bookingId, formData);
        router.refresh();
      } catch {
        setUploadError("Upload failed — try a smaller file (15MB max).");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <SectionHeader icon={ShieldCheck}>Agreement &amp; insurance</SectionHeader>

      <label className="mt-3 flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={agreementSigned}
          disabled={pending}
          onChange={(e) => toggleAgreement(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <span className="flex items-center gap-1.5 font-medium text-navy">
            <FileCheck2 className="h-3.5 w-3.5 text-signal" /> Signed rental agreement on file
          </span>
          {agreementSigned && agreementSignedAt && (
            <span className="text-xs text-steel">
              Marked signed {format(agreementSignedAt, "MMM d, yyyy")}
            </span>
          )}
          {!agreementSigned && agreementOverridden && (
            <span className="block text-xs font-medium text-amber-deep">
              Confirmed without a signed agreement — admin override on record.
            </span>
          )}
        </span>
      </label>

      {signatureName && signatureHash && signatureIp && (
        <div className="mt-3">
          <div className={signatureImageUrl ? "grid gap-3 sm:grid-cols-2" : ""}>
            <SignatureBlock
              name={signatureName}
              hash={signatureHash}
              ip={signatureIp}
              signedAt={agreementSignedAt ? format(agreementSignedAt, "MMM d, yyyy 'at' h:mm a") : undefined}
            />
            {signatureImageUrl && (
              <img
                src={signatureImageUrl}
                alt={`${signatureName}'s signature`}
                className="w-full rounded-lg border border-line bg-white"
              />
            )}
          </div>
          <p className="mt-2 text-xs text-steel break-all">
            Verified:{" "}
            {decryptedSignature ? (
              <span className="font-mono text-navy">{decryptedSignature}</span>
            ) : (
              "could not decrypt"
            )}
          </p>
        </div>
      )}

      <div className="mt-3 pl-6">
        {agreementFileUrl ? (
          <a
            href={agreementFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-signal hover:underline"
          >
            <FileText className="h-3.5 w-3.5" /> {agreementFileName}
          </a>
        ) : (
          <p className="text-xs text-steel">No file uploaded.</p>
        )}
        <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-navy hover:text-signal">
          <Upload className="h-3 w-3" />
          {agreementFileUrl ? "Replace file" : "Upload signed PDF"}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            disabled={pending}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {uploadError && <p className="mt-1 text-xs font-medium text-red-600">{uploadError}</p>}
      </div>

      <label className="mt-4 flex items-start gap-2.5 border-t border-line pt-4 text-sm">
        <input
          type="checkbox"
          checked={insuranceOnFile}
          disabled={pending}
          onChange={(e) => toggleInsurance(e.target.checked)}
          className="mt-0.5"
        />
        <span className="flex items-center gap-1.5 font-medium text-navy">
          <ShieldCheck className="h-3.5 w-3.5 text-signal" /> Insurance proof on file
        </span>
      </label>
      <p className="mt-1 pl-6 text-xs text-steel">Required for Hall / Field tier bookings before delivery.</p>
    </div>
  );
}
