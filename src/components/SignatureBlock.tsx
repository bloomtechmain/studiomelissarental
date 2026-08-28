import { truncateSignatureHash } from "@/lib/signature";

// Longer printed names need a smaller cursive size to avoid wrapping onto
// several lines inside narrow containers (e.g. the admin grid layouts).
function nameSizeClass(name: string): string {
  if (name.length > 28) return "text-lg sm:text-xl";
  if (name.length > 18) return "text-xl sm:text-2xl";
  return "text-2xl sm:text-3xl";
}

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
        <p className="text-xs text-steel">Electronically signed by:</p>
        <p className={`font-signature ${nameSizeClass(name)} break-words leading-tight text-navy`}>
          {name}
        </p>
        <p className="mt-1 border-b border-line pb-1 text-xs text-steel">
          {truncateSignatureHash(hash)}
        </p>
      </div>
      <p className="mt-3 text-xs text-steel">Using IP Address: {ip}</p>
      {signedAt && <p className="text-xs text-steel">Signed {signedAt}</p>}
    </div>
  );
}
