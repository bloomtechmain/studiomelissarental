import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// Signed agreements contain customer PII and shouldn't be world-readable —
// stored outside /public, served only via the authenticated
// /api/admin/files/agreements/[filename] route.
const AGREEMENTS_DIR = path.join(process.cwd(), "uploads", "agreements");

export async function saveAgreementFile(
  bookingId: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  await fs.mkdir(AGREEMENTS_DIR, { recursive: true });

  const ext = path.extname(file.name) || ".pdf";
  const safeStamp = `${bookingId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const storedName = `${safeStamp}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(AGREEMENTS_DIR, storedName), buffer);

  return { url: `/api/admin/files/agreements/${storedName}`, fileName: file.name };
}

export async function readAgreementFile(storedName: string): Promise<Buffer> {
  // storedName comes from a route param — resolve and verify it stays
  // inside AGREEMENTS_DIR before reading, so a crafted "../.." can't escape it.
  const filePath = path.join(AGREEMENTS_DIR, storedName);
  if (!filePath.startsWith(AGREEMENTS_DIR)) {
    throw new Error("Invalid file path.");
  }
  return fs.readFile(filePath);
}
