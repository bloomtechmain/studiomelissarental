"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { generateSignatureCode } from "@/lib/signatureEncryption";
import { getCompanySignatureUrl } from "@/lib/settings";
import type { LeadSource, LeadStage } from "@prisma/client";

export async function createLead(input: {
  name: string;
  email?: string;
  phone?: string;
  org?: string;
  eventDate?: string;
  roomSize?: string;
  guestCount?: number;
  recommendedTier?: string;
  eventAddress?: string;
  source: LeadSource;
  notes?: string;
}) {
  const session = await requireSession();
  requirePermission(session, "leads:write");
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email || undefined,
      phone: input.phone || undefined,
      org: input.org || undefined,
      eventDate: input.eventDate ? new Date(`${input.eventDate}T00:00:00`) : undefined,
      roomSize: input.roomSize || undefined,
      guestCount: input.guestCount || undefined,
      recommendedTier: input.recommendedTier || undefined,
      eventAddress: input.eventAddress || undefined,
      source: input.source,
      notes: input.notes || undefined,
      createdById: session.id,
    },
  });
  revalidatePath("/admin/leads");
  return lead.id;
}

export async function updateLeadStage(leadId: string, stage: LeadStage) {
  const session = await requireSession();
  requirePermission(session, "leads:write");
  await prisma.lead.update({ where: { id: leadId }, data: { stage } });
  await prisma.leadActivity.create({
    data: { leadId, type: "stage_change", content: `Stage changed to ${stage}`, staffId: session.id },
  });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function setLeadFollowUp(leadId: string, followUpOn: string | null) {
  const session = await requireSession();
  requirePermission(session, "leads:write");
  await prisma.lead.update({
    where: { id: leadId },
    data: { followUpOn: followUpOn ? new Date(`${followUpOn}T00:00:00`) : null },
  });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function addLeadActivity(leadId: string, type: string, content: string) {
  const session = await requireSession();
  requirePermission(session, "leads:write");
  await prisma.leadActivity.create({ data: { leadId, type, content, staffId: session.id } });
  revalidatePath(`/admin/leads/${leadId}`);
}

// A Customer record is separate from a Lead — converting shouldn't require
// re-entering data already captured on the lead.
export async function convertLeadToCustomer(leadId: string) {
  const session = await requireSession();
  requirePermission(session, "leads:write");
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  let customerId = lead.customerId;
  if (!customerId) {
    const email = lead.email?.trim().toLowerCase() || null;
    const existing = email
      ? await prisma.customer.findFirst({ where: { email } })
      : lead.phone
        ? await prisma.customer.findFirst({ where: { phone: lead.phone } })
        : null;

    const customer =
      existing ??
      (await prisma.customer.create({
        data: { name: lead.name, email, phone: lead.phone, org: lead.org },
      }));
    customerId = customer.id;
    await prisma.lead.update({ where: { id: leadId }, data: { customerId } });
  }

  await prisma.leadActivity.create({
    data: { leadId, type: "note", content: "Converted to customer record", staffId: session.id },
  });
  revalidatePath(`/admin/leads/${leadId}`);
  return customerId;
}

// The company's side of the two-party signature (see the Lead.companySigned*
// comment in schema.prisma): a staff member reviews the customer's already-
// signed request, then clicks to countersign. Reuses the one company
// signature image from Settings, but generates a fresh AES-256-GCM code per
// countersign — same mechanism as the customer's own signature, just a
// deliberate per-lead staff action rather than an automatic stamp.
export async function countersignLeadAsCompany(leadId: string) {
  const session = await requireSession();
  requirePermission(session, "leads:write");

  const companySignatureUrl = await getCompanySignatureUrl();
  if (!companySignatureUrl) {
    throw new Error("Upload a company signature in Settings before countersigning.");
  }

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (!lead.signatureCode) {
    throw new Error("This lead hasn't been signed by the customer yet.");
  }
  if (lead.companySignatureCode) {
    throw new Error("This lead has already been countersigned.");
  }

  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (hdrs.get("x-real-ip") ?? "unknown");

  const signedAt = new Date();
  const { code } = generateSignatureCode({
    name: "Studio Melissa Rental, LLC",
    contact: session.email,
    ip,
    timestamp: signedAt,
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { companySignedAt: signedAt, companySignatureCode: code, companySignedById: session.id },
  });

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: "note",
      content: `Countersigned as Company by ${session.name}`,
      staffId: session.id,
    },
  });

  revalidatePath(`/admin/leads/${leadId}`);
}

export async function deleteLead(leadId: string) {
  const session = await requireSession();
  requirePermission(session, "leads:write");
  await prisma.lead.delete({ where: { id: leadId } });
  await logAudit({
    entity: "Lead",
    entityId: leadId,
    action: "deleted",
    detail: "Lead deleted",
    actorId: session.id,
  });
  revalidatePath("/admin/leads");
}
