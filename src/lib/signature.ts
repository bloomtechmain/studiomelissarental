// Matches the reference DocuSign-style display: first 15 chars + ellipsis.
// Used for both the booking flow's signatureHash and the lead flow's AES
// code (see signatureEncryption.ts) — pure string truncation, algorithm-
// agnostic despite the name.
export function truncateSignatureHash(hash: string): string {
  return `${hash.slice(0, 15)}...`;
}
