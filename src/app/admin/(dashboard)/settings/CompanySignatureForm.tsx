"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadCompanySignature } from "../actions";
import { Upload, PenTool } from "lucide-react";
import SectionHeader from "@/components/admin/SectionHeader";

export default function CompanySignatureForm({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        await uploadCompanySignature(formData);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  return (
    <div className="mt-6 flex max-w-sm flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
      <SectionHeader icon={PenTool}>Company signature</SectionHeader>
      <p className="text-xs text-steel">
        Used to countersign leads as Studio Melissa Rental, LLC after a customer has signed.
        PNG only, exactly 772×229px, under 500KB.
      </p>

      {currentUrl && (
        <img
          src={currentUrl}
          alt="Company signature on file"
          className="w-full rounded-lg border border-line bg-white"
        />
      )}

      <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold text-navy hover:text-signal">
        <Upload className="h-3.5 w-3.5" />
        {currentUrl ? "Replace signature" : "Upload signature"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          disabled={pending}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {pending && <span className="text-xs text-steel">Uploading…</span>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
