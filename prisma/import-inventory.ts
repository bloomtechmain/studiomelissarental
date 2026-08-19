// One-time import of the real equipment inventory (from
// Studio_Melissa_Rental_Equipment_Inventory.xlsx) to replace the placeholder
// demo catalog. Run with: npx tsx prisma/import-inventory.ts
//
// Source spreadsheet had no pricing data and no real per-unit purchase
// dates (every row shared one identical timestamp — clearly the sheet's
// creation time, not real history), so dailyRate is imported as 0 and
// purchaseDate is left unset. Existing package tier compositions
// referenced the old fake catalog and don't map onto real gear, so their
// components are cleared and price reset to 0 (renders as "Custom quote"
// until real bundles are defined).
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type Row = { category: string; name: string; units: number };

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, "data", "equipment-inventory.json"), "utf-8");
  const rows: Row[] = JSON.parse(raw);

  console.log(`Importing ${rows.length} items / ${rows.reduce((n, r) => n + r.units, 0)} units…`);

  await prisma.$transaction(async (tx) => {
    // Wipe anything tied to the old placeholder catalog. Safe in this
    // dev database — no real customer bookings exist yet.
    await tx.booking.deleteMany();
    await tx.maintenanceLog.deleteMany();
    await tx.packageItem.deleteMany();
    await tx.equipmentUnit.deleteMany();
    await tx.item.deleteMany();
    await tx.category.deleteMany();

    const categoryIds: Record<string, string> = {};
    for (const category of [...new Set(rows.map((r) => r.category))]) {
      const cat = await tx.category.create({ data: { name: category } });
      categoryIds[category] = cat.id;
    }

    for (const row of rows) {
      const item = await tx.item.create({
        data: {
          name: row.name,
          categoryId: categoryIds[row.category],
          dailyRate: 0,
        },
      });

      const slug = row.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 28);
      // Suffix with part of the item's own id — names can collide after
      // truncation (e.g. two similarly-worded cable descriptions), and the
      // id guarantees serial numbers stay unique per item.
      const itemTag = item.id.slice(-5).toUpperCase();

      for (let i = 1; i <= row.units; i++) {
        await tx.equipmentUnit.create({
          data: {
            itemId: item.id,
            serialNumber: `${slug}-${itemTag}-${String(i).padStart(2, "0")}`,
            status: "AVAILABLE",
          },
        });
      }
    }

    // Package tiers no longer have valid components against the real
    // catalog — reset to "custom quote" (empty components) until real
    // bundles + pricing are defined.
    await tx.package.updateMany({ data: { price: 0 } });
    await tx.package.update({
      where: { name: "Huddle" },
      data: { description: "Small room, up to ~40 guests. Contact us for equipment list and pricing." },
    });
    await tx.package.update({
      where: { name: "Gathering" },
      data: { description: "Mid-size room, up to ~120 guests. Contact us for equipment list and pricing." },
    });
    await tx.package.update({
      where: { name: "Hall" },
      data: { description: "Large hall, up to ~300 guests. Contact us for equipment list and pricing." },
    });
  });

  console.log("Import complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
