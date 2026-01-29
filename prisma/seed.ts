import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const sampleOccupations = [
  {
    id: "15-1252.00",
    title: "Software Developers",
    description:
      "Research, design, and develop computer and network software or specialized utility programs.",
    jobZone: 4,
    brightOutlook: true,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 6,
    riasecArtistic: 4,
    riasecSocial: 2,
    riasecEnterprising: 3,
    riasecConventional: 4,
    medianWage: 127260,
    jobGrowth: "Much faster than average",
    totalEmployment: 1795300,
  },
  {
    id: "29-1141.00",
    title: "Registered Nurses",
    description:
      "Assess patient health problems and needs, develop and implement nursing care plans.",
    jobZone: 3,
    brightOutlook: true,
    greenOccupation: false,
    riasecRealistic: 3,
    riasecInvestigative: 4,
    riasecArtistic: 1,
    riasecSocial: 6,
    riasecEnterprising: 2,
    riasecConventional: 4,
    medianWage: 81220,
    jobGrowth: "Faster than average",
    totalEmployment: 3175390,
  },
  {
    id: "27-1024.00",
    title: "Graphic Designers",
    description:
      "Design or create graphics to meet specific commercial or promotional needs.",
    jobZone: 3,
    brightOutlook: false,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 2,
    riasecArtistic: 6,
    riasecSocial: 2,
    riasecEnterprising: 4,
    riasecConventional: 3,
    medianWage: 57990,
    jobGrowth: "Average",
    totalEmployment: 264800,
  },
  {
    id: "25-2021.00",
    title: "Elementary School Teachers",
    description:
      "Teach academic and social skills to students at the elementary school level.",
    jobZone: 4,
    brightOutlook: false,
    greenOccupation: false,
    riasecRealistic: 1,
    riasecInvestigative: 3,
    riasecArtistic: 4,
    riasecSocial: 6,
    riasecEnterprising: 3,
    riasecConventional: 3,
    medianWage: 61690,
    jobGrowth: "Average",
    totalEmployment: 1395830,
  },
  {
    id: "11-1021.00",
    title: "General and Operations Managers",
    description:
      "Plan, direct, or coordinate the operations of public or private sector organizations.",
    jobZone: 4,
    brightOutlook: true,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 3,
    riasecArtistic: 1,
    riasecSocial: 4,
    riasecEnterprising: 6,
    riasecConventional: 4,
    medianWage: 101280,
    jobGrowth: "Faster than average",
    totalEmployment: 3011570,
  },
  {
    id: "47-2111.00",
    title: "Electricians",
    description:
      "Install, maintain, and repair electrical wiring, equipment, and fixtures.",
    jobZone: 3,
    brightOutlook: true,
    greenOccupation: true,
    riasecRealistic: 6,
    riasecInvestigative: 3,
    riasecArtistic: 1,
    riasecSocial: 2,
    riasecEnterprising: 3,
    riasecConventional: 3,
    medianWage: 61590,
    jobGrowth: "Faster than average",
    totalEmployment: 726200,
  },
];

async function main() {
  console.log("Seeding database...");

  for (const occupation of sampleOccupations) {
    await prisma.occupation.upsert({
      where: { id: occupation.id },
      update: occupation,
      create: occupation,
    });
    console.log(`  Upserted: ${occupation.title}`);
  }

  console.log(`\nSeeded ${sampleOccupations.length} occupations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
