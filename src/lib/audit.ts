import { prisma } from "@/lib/prisma";

// Section 6 non-functional requirement: who changed a booking, price, or
// equipment assignment, and when. Fire-and-forget-ish but awaited so
// server actions can rely on it having landed before revalidating.
export async function logAudit(args: {
  entity: string;
  entityId: string;
  action: string;
  detail: string;
  actorId?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      entity: args.entity,
      entityId: args.entityId,
      action: args.action,
      detail: args.detail,
      actorId: args.actorId ?? undefined,
    },
  });
}
