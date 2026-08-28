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

// Item photos are shown on the public catalog, so — unlike agreements —
// they're served without auth via /api/items/photos/[filename]. Still kept
// outside /public and behind a route rather than a static path, so the same
// path-traversal guard pattern applies to every upload type in this file.
const ITEM_PHOTOS_DIR = path.join(process.cwd(), "uploads", "items");
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveItemPhoto(itemId: string, file: File): Promise<{ url: string }> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image type — use JPEG, PNG, WebP, or GIF.");
  }
  await fs.mkdir(ITEM_PHOTOS_DIR, { recursive: true });

  const ext = path.extname(file.name) || ".jpg";
  const storedName = `${itemId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(ITEM_PHOTOS_DIR, storedName), buffer);

  return { url: `/api/items/photos/${storedName}` };
}

export async function readItemPhoto(storedName: string): Promise<Buffer> {
  const filePath = path.join(ITEM_PHOTOS_DIR, storedName);
  if (!filePath.startsWith(ITEM_PHOTOS_DIR)) {
    throw new Error("Invalid file path.");
  }
  return fs.readFile(filePath);
}

// Signature images from customer submissions made before the upload step
// was removed — kept outside /public, served only via the authenticated
// /api/admin/files/signatures/[filename] route, so old records still load.
const SIGNATURES_DIR = path.join(process.cwd(), "uploads", "signatures");

export async function readSignatureImage(storedName: string): Promise<Buffer> {
  const filePath = path.join(SIGNATURES_DIR, storedName);
  if (!filePath.startsWith(SIGNATURES_DIR)) {
    throw new Error("Invalid file path.");
  }
  return fs.readFile(filePath);
}

// The company's own signature — uploaded once in Settings, reused as the
// Company-side signature on every countersign action. Fixed filename, so a
// re-upload simply replaces it rather than accumulating old versions.
const COMPANY_SIGNATURE_NAME = "company-signature.png";

export async function saveCompanySignature(buffer: Buffer): Promise<{ url: string }> {
  await fs.mkdir(SIGNATURES_DIR, { recursive: true });
  await fs.writeFile(path.join(SIGNATURES_DIR, COMPANY_SIGNATURE_NAME), buffer);
  return { url: `/api/admin/files/signatures/${COMPANY_SIGNATURE_NAME}` };
}
