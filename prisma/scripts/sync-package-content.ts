// Backfills the four service-tier packages and a set of product "best for"
// descriptions with the copy/inventory decided for the site redesign. Keyed
// by tier number (not name) so it's safe to re-run even after the name has
// already been changed from "Huddle" to "Backyard" — every run converges on
// the same canonical state. Item descriptions are only set when currently
// blank, so later manual edits in the admin panel are never clobbered by a
// future deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const packages: {
  tier: number;
  name: string;
  description: string;
  components: { item: string; qty: number }[];
}[] = [
  {
    tier: 1,
    name: "Backyard",
    description:
      "Intimate gatherings, up to ~75 guests — backyard parties, small receptions, baby showers, patio hangouts.",
    components: [
      { item: "Alto Professional TX210", qty: 2 },
      { item: "Behringer Xenyx 1204USB no FX", qty: 1 },
      { item: "Shure SM58 Cardioid Dynamic Vocal Microphone", qty: 1 },
      { item: "Microphone Stand Foldable Tripod Boom Arm Floor Mic Stand", qty: 1 },
      { item: "Rockville RVES1 Pair Adjustable Tripod PA Speaker Stands", qty: 1 },
      { item: "Gearlux XLR Microphone Cable, 100 Feet", qty: 2 },
      { item: "PDU Metered 120V 20A 5-15/20R 12-Outlet", qty: 1 },
    ],
  },
  {
    tier: 2,
    name: "Gathering",
    description:
      "Mid-size events, ~75–200 guests — community events, church functions, larger receptions, corporate mixers.",
    components: [
      { item: "Harbinger Vari v3412", qty: 2 },
      { item: "18inch RCF SUB 708-AS MK2", qty: 1 },
      { item: "Yamaha MG12XU", qty: 1 },
      { item: "Sennheiser EW100ENG G2 100 Series", qty: 2 },
      { item: "Shure SM58 Cardioid Dynamic Vocal Microphone", qty: 1 },
      { item: "dbx DriveRack PA2", qty: 1 },
    ],
  },
  {
    tier: 3,
    name: "Hall",
    description:
      "Larger events, ~200–500 guests — banquets, galas, conference general sessions, large weddings.",
    components: [
      { item: "Yamaha DXR15 mk3", qty: 2 },
      { item: "18inch RCF SUB 708-AS MK2", qty: 2 },
      { item: "Behringer X32", qty: 1 },
      { item: "dbx DriveRack PA2", qty: 1 },
      { item: "BBE Max-X2", qty: 1 },
      { item: "Sennheiser EW100ENG G2 100 Series", qty: 4 },
      { item: "Shure SM58 Cardioid Dynamic Vocal Microphone", qty: 2 },
    ],
  },
  {
    tier: 4,
    name: "Field",
    description: "Large-scale outdoor or festival events, ~500–1,000 guests.",
    components: [
      { item: "Yamaha DXR15 mk3", qty: 2 },
      { item: "Harbinger Vari v3412", qty: 2 },
      { item: "Alto Professional TX415", qty: 2 },
      { item: "18inch RCF SUB 708-AS MK2", qty: 2 },
      { item: "Behringer X32", qty: 1 },
      { item: "dbx DriveRack PA2", qty: 1 },
      { item: "BBE Max-X2", qty: 1 },
      { item: "Behringer Ultra-Graph PRO GEQ3102", qty: 1 },
      { item: "Sennheiser EW100ENG G2 100 Series", qty: 8 },
    ],
  },
];

const itemDescriptions: Record<string, string> = {
  "Behringer X32": "Multi-channel events needing scene recall & DSP",
  "Yamaha MG12XU": "Mid-size events, DJs, live vocals + instruments",
  "Behringer Xenyx 1204USB no FX": "Small setups, simple vocal + music mixing",
  "Alto Professional TX210": "Small rooms, patios, background music",
  "Alto Professional TX415": "Mid-size rooms, DJ sets",
  "Harbinger Vari v2408": "Live vocals, small-to-mid events",
  "Harbinger Vari v3412": "Larger rooms, higher output needs",
  "Harbinger Vari v2315": "Compact high-output coverage",
  "Yamaha DXR15 mk3": "Larger events, clean full-range output",
  "18inch RCF SUB 708-AS MK2": "Low-end reinforcement for DJs & bands",
  "12inch MTX Audio": "Smaller events needing light low-end support",
  "dbx DriveRack PA2": "System tuning, feedback control, crossover setup",
  "BBE Max-X2": "Adding clarity & punch to a mix",
  "Behringer Ultra-Graph PRO GEQ3102": "Graphic EQ for room correction",
  "Zoom rfx-2200": "Reverb & effects for live vocals",
  "Shure SM58 Cardioid Dynamic Vocal Microphone": "Speeches, vocals, durable everyday use",
  "Sennheiser Pro Audio Professional E 835": "Vocal performances",
  "Sennheiser EW100ENG G2 100 Series": "Freedom of movement — hosts, performers, officiants",
  "RØDE NT1 Signature Series Condenser Microphone": "Podcasting, voiceover, acoustic recording",
  "Behringer C2": "Overheads, acoustic instrument pickup",
  "Rockville RVES1 Pair Adjustable Tripod PA Speaker Stands": "Elevating mains for even coverage",
  "Microphone Stand Foldable Tripod Boom Arm Floor Mic Stand":
    "Podium, vocal, or instrument mic placement",
  "Focusrite Scarlett 2i2 3rd Gen": "Recording or computer playback integration",
  "PDU Metered 120V 20A 5-15/20R 12-Outlet": "Safe, monitored power for the full rig",
  "PDU Metered 120V 30A 5-15/20R 12-Outlet": "Safe, monitored power for the full rig",

  "3 Pin Male/Female Audio Mic Microphone Connector": "In-line XLR repair or extension connector",
  "Furry Windscreen Muff for Behringer C-2 Mic": "Wind noise reduction for outdoor recording",
  "JOYO 5.8Ghz Wireless XLR Microphone Transmitter Receiver":
    "Cable-free mic signal for mobile presenters",
  "Musou RCA Analog to Digital Optical Toslink Coaxial Audio Converter":
    "Bridges analog gear to digital optical inputs",
  "Professional Microphone Isolation Shield with Pop Filter":
    "Cleaner vocal takes, less room reflection",
  "Pyle Dual Studio Monitor Speaker Stand": "Elevates studio monitors to ear height",
  "SmallRig Microphone Shock Mount for Behringer c-2 Mic":
    "Isolates mic from stand vibration and handling noise",
  'XLR Female to 1/4" TRS Adapter': 'Connects XLR mics to 1/4" TRS inputs',
  'XLR Male to 1/4" TRS Adapter': 'Connects 1/4" TRS outputs to XLR inputs',

  '3.5mm 1/8" TRS to Dual 6.35mm 1/4" TS Mono Stereo Y-Cable Splitter Cord':
    'Splits a stereo mini output to dual mono 1/4" jacks',
  "Amazon Basics 3.5 mm Male to Male Stereo Audio Cable, 8 Feet":
    "Connects phones and laptops to speakers or mixers",
  "Amazon Basics Standard XLR 25ft": "Standard mic and line-level runs up to 25 feet",
  "Balanced XLR Splitter Cable - 1.5ft": "Short balanced splitter for tight rack runs",
  "Cable Matters 2-Pack 1/4 Inch TS to TS": 'Instrument and line-level 1/4" connections',
  "Cable Matters Dual XLR to RCA Cable 10 ft,": "Feeds mixer XLR outputs into RCA inputs",
  'CPR-202 Dual 1/4" TS to Dual RCA Stereo': 'Stereo 1/4" to RCA interconnect for short runs',
  'CPR-202 Dual 1/4" TS to Dual RCA Stereo Interconnect Cable 2 Meteres':
    'Stereo 1/4" to RCA interconnect, 2-meter run',
  "Dual RCA to XLR Cable, Dual RCA Male to Dual XLR Male, 10ft":
    "Feeds RCA sources into balanced XLR inputs",
  "Dual RCA to XLR Unbalanced Interconnect Cable": "Short RCA-to-XLR run for consumer gear",
  "Dual RCA to XLR Unbalanced Interconnect Cable - 10ft":
    "Longer RCA-to-XLR run for consumer gear",
  "EBXYA XLR Cable 20ft": "Standard mic and line-level runs up to 20 feet",
  "EBXYA XLR Cables 3ft": "Short balanced runs between rack gear",
  "Gearlux XLR Microphone Cable, 100 Feet": "Long balanced run for stage-to-mixer distances",
  "XLR Splitter, Balanced XLR Splitter Cable Male to 2 Female":
    "Feeds one XLR source to two destinations",

  "BEHRINGER ECM8000": "Measurement mic for room and system tuning",
  "Behringer mx8500": "Affordable dynamic mic for live vocals",
  "JLab Talk USB Microphone": "Plug-and-play USB mic for streaming or voiceover",
  "Sanken CS-2": "Shotgun mic for focused dialogue pickup",
  "Sony ECM-778": "Compact lavalier mic for interviews and presenters",
};

async function main() {
  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({ where: { tier: pkg.tier } });
    if (!existing) {
      console.log(`SKIP tier ${pkg.tier}: no package found`);
      continue;
    }

    const updated = await prisma.package.update({
      where: { id: existing.id },
      data: { name: pkg.name, description: pkg.description },
    });

    const itemRecords = await Promise.all(
      pkg.components.map(async (c) => {
        const item = await prisma.item.findUnique({ where: { name: c.item } });
        if (!item) {
          console.log(`  MISSING ITEM (tier ${pkg.tier}): ${c.item}`);
          return null;
        }
        return { itemId: item.id, qty: c.qty };
      })
    );
    const valid = itemRecords.filter((v): v is { itemId: string; qty: number } => v !== null);

    await prisma.packageItem.deleteMany({
      where: { packageId: updated.id, itemId: { notIn: valid.map((v) => v.itemId) } },
    });
    for (const v of valid) {
      await prisma.packageItem.upsert({
        where: { packageId_itemId: { packageId: updated.id, itemId: v.itemId } },
        update: { quantity: v.qty },
        create: { packageId: updated.id, itemId: v.itemId, quantity: v.qty },
      });
    }
    console.log(`Synced tier ${pkg.tier} -> ${pkg.name} (${valid.length} components)`);
  }

  for (const [name, description] of Object.entries(itemDescriptions)) {
    const item = await prisma.item.findUnique({ where: { name } });
    if (!item) {
      console.log(`MISSING ITEM: ${name}`);
      continue;
    }
    if (item.description) {
      continue; // already has a description (backfilled before, or edited by staff) — leave it alone
    }
    await prisma.item.update({ where: { id: item.id }, data: { description } });
    console.log(`Set description: ${name}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
