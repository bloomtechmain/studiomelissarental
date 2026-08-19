import { truncateSignatureHash } from "@/lib/signature";

// Mirrors the reference DocuSign layout: "DocuSigned by:" + the cursive
// name over an underline, the certificate hash beneath it, then the IP.
export default function SignatureBlock({
  name,
  hash,
  ip,
  signedAt,
}: {
  name: string;
  hash: string;
  ip: string;
  signedAt?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">Signature</p>
      <div className="mt-2 border-l-2 border-signal pl-3">
        <p className="text-xs text-steel">DocuSigned by:</p>
        <p className="font-signature text-3xl leading-tight text-navy">{name}</p>
        <p className="mt-1 border-b border-line pb-1 text-xs text-steel">
          {truncateSignatureHash(hash)}
        </p>
      </div>
      <p className="mt-3 text-xs text-steel">Using IP Address: {ip}</p>
      {signedAt && <p className="text-xs text-steel">Signed {signedAt}</p>}
    </div>
  );
}
