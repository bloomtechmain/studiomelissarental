import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Reversible (unlike the booking flow's one-way SHA-256 hash in signature.ts)
// so staff can later decrypt a lead's signature code to verify who signed —
// deliberately requested as AES rather than a hash.
const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.SIGNATURE_ENCRYPTION_KEY;
  if (!secret) throw new Error("SIGNATURE_ENCRYPTION_KEY is not set.");
  const key = Buffer.from(secret, "hex");
  if (key.length !== 32) {
    throw new Error("SIGNATURE_ENCRYPTION_KEY must be 64 hex characters (32 bytes).");
  }
  return key;
}

// Builds the plaintext identifying string for one signing event, then
// encrypts it. A fresh random seed (not the Lead's own id, which doesn't
// exist yet at signing time) keeps every code unique even for the same
// person signing twice.
export function generateSignatureCode(input: {
  name: string;
  contact: string;
  ip: string;
  timestamp: Date;
}): { code: string; seed: string } {
  const seed = randomBytes(8).toString("hex");
  const plaintext = `${seed}|${input.name}|${input.contact}|${input.ip}|${input.timestamp.toISOString()}`;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const code = [iv, authTag, ciphertext].map((b) => b.toString("hex")).join(":");
  return { code, seed };
}

export function decryptSignatureCode(code: string): string {
  const [ivHex, tagHex, dataHex] = code.split(":");
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// Matches the reference DocuSign-style display used for the booking hash.
export function truncateSignatureCode(code: string): string {
  return `${code.slice(0, 15)}...`;
}
