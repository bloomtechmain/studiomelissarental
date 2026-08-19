import { createHash } from "crypto";

// Computed server-side only, from server-known values (never trust a
// client-supplied hash or IP) — this is the "certificate ID" shown under
// the rendered signature, the same role DocuSign's envelope ID plays.
export function generateSignatureHash(input: {
  name: string;
  ip: string;
  timestamp: Date;
  bookingSeed: string;
}): string {
  const raw = `${input.name}|${input.ip}|${input.timestamp.toISOString()}|${input.bookingSeed}`;
  return createHash("sha256").update(raw).digest("hex").toUpperCase();
}

// Matches the reference DocuSign-style display: first 15 chars + ellipsis.
export function truncateSignatureHash(hash: string): string {
  return `${hash.slice(0, 15)}...`;
}
