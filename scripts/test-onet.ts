/**
 * Test O*NET API v2.0 connection and run a small ingestion
 *
 * Run with: npx tsx scripts/test-onet.ts
 * Run with ingestion: npx tsx scripts/test-onet.ts --ingest
 */

import "dotenv/config";
import { OnetClient } from "../src/lib/onet/client";
import { ingestOnetData } from "../src/lib/onet/ingest";
import { db } from "../src/lib/db";

async function testOnetConnection() {
  console.log("Testing O*NET API v2.0 connection...\n");

  try {
    const client = new OnetClient();

    // Test 1: Get version/about info
    console.log("1. Testing API connection...");
    const occupations = await client.getAllOccupations();
    console.log(`   Found ${occupations.length} total occupations\n`);

    // Test 2: Get details for a single occupation
    console.log("2. Testing occupation details (Software Developers)...");
    const details = await client.getOccupationDetails("15-1252.00");
    console.log(`   Title: ${details.title}`);
    console.log(`   Bright Outlook: ${details.tags?.bright_outlook ?? false}\n`);

    // Test 3: Get Job Zone
    console.log("3. Testing Job Zone endpoint...");
    const jobZone = await client.getOccupationJobZone("15-1252.00");
    console.log(`   Job Zone: ${jobZone.code}`);
    console.log(`   Education: ${jobZone.education?.substring(0, 60)}...\n`);

    // Test 4: Skills with scores
    console.log("4. Testing skills endpoint (with importance)...");
    const skills = await client.getOccupationSkills("15-1252.00");
    console.log(`   Found ${skills.element?.length ?? 0} skills`);
    if (skills.element?.[0]) {
      const s = skills.element[0];
      console.log(`   Top: ${s.name} (importance: ${s.importance})\n`);
    }

    // Test 5: Interests with scores
    console.log("5. Testing interests endpoint (with occupational_interest)...");
    const interests = await client.getOccupationInterests("15-1252.00");
    console.log(`   Found ${interests.element?.length ?? 0} interest scores`);
    if (interests.element?.[0]) {
      const i = interests.element[0] as { name: string; occupational_interest?: number };
      console.log(`   Top: ${i.name} = ${i.occupational_interest}\n`);
    }

    // Test 6a: Technologies
    console.log("6a. Testing technologies endpoint...");
    const tech = await client.getOccupationTechnology("15-1252.00");
    console.log(`   Raw tech response:`, JSON.stringify(tech, null, 2).substring(0, 800));

    // Test 6b: Related occupations
    console.log("\n6b. Testing related occupations...");
    const related = await client.getRelatedOccupations("15-1252.00");
    console.log(`   Found ${related.occupation?.length ?? 0} related occupations`);
    if (related.occupation?.[0]) {
      console.log(`   First: ${related.occupation[0].code} - ${related.occupation[0].title}`);
    }

    // Test 6: Get MNM career report (salary/outlook)
    console.log("6. Testing My Next Move career report...");
    const mnmReport = await client.getMnmCareerReport("15-1252.00");
    console.log(`   What they do: ${mnmReport.what_they_do?.substring(0, 80)}...`);
    if (mnmReport.job_outlook?.salary) {
      console.log(
        `   Median salary: $${mnmReport.job_outlook.salary.annual_median?.toLocaleString()}\n`
      );
    }

    console.log("All API tests passed! O*NET API v2.0 is working correctly.\n");
    return true;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
}

async function testIngestion() {
  console.log("=".repeat(60));
  console.log("Testing O*NET ingestion (5 occupations)...\n");
  
  const dbUrl = process.env.DATABASE_URL;
  console.log(`DATABASE_URL: ${dbUrl?.substring(0, 50)}...`);

  try {
    const result = await ingestOnetData({ limit: 5 });
    console.log(`\nIngestion complete!`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Occupations processed: ${result.occupationsProcessed}`);
    console.log(`  Duration: ${result.duration}ms`);
    if (result.errors.length > 0) {
      console.log(`  Errors:`, result.errors);
    }
    
    // Verify database
    console.log("\nVerifying database...");
    const count = await db.occupation.count();
    const latest = await db.occupation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, jobZone: true, riasecInvestigative: true, updatedAt: true }
    });
    console.log(`  Total occupations in DB: ${count}`);
    console.log(`  Latest records:`, latest);
    
    return result.success;
  } catch (error) {
    console.error("Ingestion error:", error);
    return false;
  }
}

async function main() {
  const apiOk = await testOnetConnection();
  if (!apiOk) {
    process.exit(1);
  }

  if (process.argv.includes("--ingest")) {
    const ingestOk = await testIngestion();
    process.exit(ingestOk ? 0 : 1);
  }
}

main();
