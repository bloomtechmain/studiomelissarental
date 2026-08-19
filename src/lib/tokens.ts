import { randomBytes } from "crypto";

// 24 random bytes (48 hex chars) — enough entropy that a shareable quote
// link can't be guessed, unlike a cuid/uuid which trades some randomness
// for sortability we don't need here.
export function generateShareToken(): string {
  return randomBytes(24).toString("hex");
}
