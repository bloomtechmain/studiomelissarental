import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "bufferHours" },
    update: {},
    create: { key: "bufferHours", value: "3" },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@studiomelissarental.com" },
    update: {},
    create: {
      name: "Studio Melissa Admin",
      email: "admin@studiomelissarental.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const categoryNames = [
    "Top / Speaker",
    "Sub / Subwoofer",
    "Mixer / DSP",
    "Wireless Mic",
    "Cable / Accessory",
  ];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
  }

  type ItemSeed = { name: string; category: string; dailyRate: number; units: number };
  const items: ItemSeed[] = [
    { name: "Yamaha DXR15 mk3", category: "Top / Speaker", dailyRate: 45, units: 4 },
    { name: "QSC K12.2", category: "Top / Speaker", dailyRate: 40, units: 4 },
    { name: "Yamaha DXS15 mk2 Sub", category: "Sub / Subwoofer", dailyRate: 55, units: 2 },
    { name: "Behringer X32 Compact", category: "Mixer / DSP", dailyRate: 65, units: 2 },
    { name: "Shure SLXD Wireless Handheld", category: "Wireless Mic", dailyRate: 25, units: 6 },
    { name: "XLR Cable 25ft", category: "Cable / Accessory", dailyRate: 3, units: 20 },
    { name: "Speaker Stand (Pair)", category: "Cable / Accessory", dailyRate: 8, units: 6 },
  ];

  const itemIds: Record<string, string> = {};
  for (const it of items) {
    const item = await prisma.item.upsert({
      where: { name: it.name },
      update: {},
      create: {
        name: it.name,
        categoryId: categories[it.category],
        dailyRate: it.dailyRate,
      },
    });
    itemIds[it.name] = item.id;

    const existingUnits = await prisma.equipmentUnit.count({ where: { itemId: item.id } });
    for (let i = existingUnits; i < it.units; i++) {
      await prisma.equipmentUnit.create({
        data: {
          itemId: item.id,
          serialNumber: `${it.name.replace(/\s+/g, "-").toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
          status: "AVAILABLE",
        },
      });
    }
  }

  type PackageSeed = {
    name: string;
    tier: number;
    price: number;
    description: string;
    components: { item: string; qty: number }[];
  };
  const packages: PackageSeed[] = [
    {
      name: "Huddle",
      tier: 1,
      price: 0,
      description: "Small room, up to ~40 guests.",
      components: [],
    },
    {
      name: "Gathering",
      tier: 2,
      price: 0,
      description: "Mid-size room, up to ~120 guests.",
      components: [],
    },
    {
      name: "Hall",
      tier: 3,
      price: 0,
      description: "Large hall, up to ~300 guests.",
      components: [],
    },
    {
      name: "Field",
      tier: 4,
      price: 0,
      description: "Custom outdoor / large-format build — quoted per event.",
      components: [],
    },
  ];

  for (const pkg of packages) {
    const created = await prisma.package.upsert({
      where: { name: pkg.name },
      update: { tier: pkg.tier, price: pkg.price, description: pkg.description },
      create: {
        name: pkg.name,
        tier: pkg.tier,
        price: pkg.price,
        description: pkg.description,
      },
    });
    const keepItemIds = pkg.components.map((c) => itemIds[c.item]);
    await prisma.packageItem.deleteMany({
      where: { packageId: created.id, itemId: { notIn: keepItemIds.length ? keepItemIds : [""] } },
    });
    for (const comp of pkg.components) {
      await prisma.packageItem.upsert({
        where: { packageId_itemId: { packageId: created.id, itemId: itemIds[comp.item] } },
        update: { quantity: comp.qty },
        create: { packageId: created.id, itemId: itemIds[comp.item], quantity: comp.qty },
      });
    }
  }

  console.log("Seed complete. Admin login: admin@studiomelissarental.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
