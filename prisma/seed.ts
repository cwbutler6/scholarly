import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Sample O*NET occupations for development.
 * Real data will be ingested from O*NET bulk downloads.
 */
const sampleOccupations = [
  {
    id: "15-1252.00",
    title: "Software Developers",
    description:
      "Research, design, and develop computer and network software or specialized utility programs. Analyze user needs and develop software solutions, applying principles and techniques of computer science, engineering, and mathematical analysis.",
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
      "Assess patient health problems and needs, develop and implement nursing care plans, and maintain medical records. Administer nursing care to ill, injured, convalescent, or disabled patients.",
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
      "Design or create graphics to meet specific commercial or promotional needs, such as packaging, displays, or logos. May use a variety of mediums to achieve artistic or decorative effects.",
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
      "Teach academic and social skills to students at the elementary school level. Plan and present lessons on a variety of subjects.",
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
      "Plan, direct, or coordinate the operations of public or private sector organizations. Formulate policies, manage daily operations, and plan the use of materials and human resources.",
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
    id: "43-3031.00",
    title: "Bookkeeping, Accounting, and Auditing Clerks",
    description:
      "Compute, classify, and record numerical data to keep financial records complete. Perform any combination of routine calculating, posting, and verifying duties.",
    jobZone: 3,
    brightOutlook: false,
    greenOccupation: false,
    riasecRealistic: 2,
    riasecInvestigative: 2,
    riasecArtistic: 1,
    riasecSocial: 2,
    riasecEnterprising: 3,
    riasecConventional: 6,
    medianWage: 47440,
    jobGrowth: "Declining",
    totalEmployment: 1528600,
  },
  {
    id: "47-2111.00",
    title: "Electricians",
    description:
      "Install, maintain, and repair electrical wiring, equipment, and fixtures. Ensure that work is in accordance with relevant codes.",
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
  {
    id: "19-2041.00",
    title: "Environmental Scientists and Specialists",
    description:
      "Conduct research or perform investigation for the purpose of identifying, abating, or eliminating sources of pollutants or hazards that affect the environment or public health.",
    jobZone: 4,
    brightOutlook: true,
    greenOccupation: true,
    riasecRealistic: 3,
    riasecInvestigative: 6,
    riasecArtistic: 1,
    riasecSocial: 3,
    riasecEnterprising: 3,
    riasecConventional: 3,
    medianWage: 78980,
    jobGrowth: "Faster than average",
    totalEmployment: 86900,
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
