import { prisma } from "@/lib/prisma";
import { getGlobalBufferHours } from "@/lib/settings";
import { rentalWindow } from "@/lib/rental";
import type { Prisma } from "@prisma/client";

export class InsufficientAvailabilityError extends Error {
  constructor(itemName: string, requested: number, available: number) {
    super(
      `Only ${available} unit(s) of "${itemName}" are available for that pickup time (requested ${requested}).`
    );
    this.name = "InsufficientAvailabilityError";
  }
}

async function itemBufferHours(itemId: string): Promise<number> {
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });
  if (item.bufferHours !== null && item.bufferHours !== undefined) return item.bufferHours;
  return getGlobalBufferHours();
}

// Units eligible for booking at all (excludes maintenance/retired), and which
// of those are free for the requested window once existing assignments +
// their buffer are accounted for.
export async function getAvailability(
  itemId: string,
  pickupAt: Date
): Promise<{ totalEligible: number; availableUnitIds: string[] }> {
  const { startAt, endAt } = rentalWindow(pickupAt);

  const eligibleUnits = await prisma.equipmentUnit.findMany({
    where: { itemId, status: { in: ["AVAILABLE", "OUT"] } },
    select: { id: true },
  });
  if (eligibleUnits.length === 0) return { totalEligible: 0, availableUnitIds: [] };

  const eligibleIds = eligibleUnits.map((u) => u.id);

  // Any BookingUnit row whose blocked range overlaps the requested window
  // marks that unit as unavailable. Overlap: existing.start < requested.end
  // AND existing.until > requested.start.
  const conflicting = await prisma.bookingUnit.findMany({
    where: {
      unitId: { in: eligibleIds },
      blockedFrom: { lt: endAt },
      blockedUntil: { gt: startAt },
    },
    select: { unitId: true },
  });
  const conflictingIds = new Set(conflicting.map((c) => c.unitId));

  const availableUnitIds = eligibleIds.filter((id) => !conflictingIds.has(id));
  return { totalEligible: eligibleIds.length, availableUnitIds };
}

// Picks `quantity` free units for the given item/pickup time and inserts
// BookingUnit rows inside the given transaction. The DB-level EXCLUDE
// constraint (see migration) is the real guarantee against double-booking
// under concurrency; this query is what makes a single request pick
// sensible units and fail fast with a clear error otherwise.
export async function assignUnits(
  tx: Prisma.TransactionClient,
  args: { bookingId: string; itemId: string; pickupAt: Date; quantity: number }
): Promise<string[]> {
  const { bookingId, itemId, pickupAt, quantity } = args;
  const { startAt, endAt } = rentalWindow(pickupAt);
  const buffer = await itemBufferHours(itemId);
  const blockedUntil = new Date(endAt.getTime() + buffer * 60 * 60 * 1000);

  const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });

  const eligibleUnits = await tx.equipmentUnit.findMany({
    where: { itemId, status: { in: ["AVAILABLE", "OUT"] } },
    select: { id: true },
  });
  const eligibleIds = eligibleUnits.map((u) => u.id);

  const conflicting = await tx.bookingUnit.findMany({
    where: {
      unitId: { in: eligibleIds },
      blockedFrom: { lt: endAt },
      blockedUntil: { gt: startAt },
    },
    select: { unitId: true },
  });
  const conflictingIds = new Set(conflicting.map((c) => c.unitId));
  const freeIds = eligibleIds.filter((id) => !conflictingIds.has(id));

  if (freeIds.length < quantity) {
    throw new InsufficientAvailabilityError(item.name, quantity, freeIds.length);
  }

  const chosen = freeIds.slice(0, quantity);
  await tx.bookingUnit.createMany({
    data: chosen.map((unitId) => ({
      bookingId,
      unitId,
      blockedFrom: startAt,
      blockedUntil,
    })),
  });
  return chosen;
}

export type PackageAvailabilityLine = {
  itemId: string;
  itemName: string;
  required: number;
  available: number;
  ok: boolean;
};

// Checks every component of a package against a single pickup time. All lines
// must have enough free stock for the package as a whole to be bookable.
export async function getPackageAvailability(
  packageId: string,
  pickupAt: Date
): Promise<{ bookable: boolean; lines: PackageAvailabilityLine[] }> {
  const pkg = await prisma.package.findUniqueOrThrow({
    where: { id: packageId },
    include: { components: { include: { item: true } } },
  });

  const lines: PackageAvailabilityLine[] = [];
  for (const comp of pkg.components) {
    const { availableUnitIds } = await getAvailability(comp.itemId, pickupAt);
    lines.push({
      itemId: comp.itemId,
      itemName: comp.item.name,
      required: comp.quantity,
      available: availableUnitIds.length,
      ok: availableUnitIds.length >= comp.quantity,
    });
  }

  return { bookable: lines.every((l) => l.ok), lines };
}
