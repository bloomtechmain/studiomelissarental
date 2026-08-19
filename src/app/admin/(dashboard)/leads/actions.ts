"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
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
    const existing = lead.email
      ? await prisma.customer.findFirst({ where: { email: lead.email } })
      : lead.phone
        ? await prisma.customer.findFirst({ where: { phone: lead.phone } })
        : null;

    const customer =
      existing ??
      (await prisma.customer.create({
        data: { name: lead.name, email: lead.email, phone: lead.phone, org: lead.org },
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
