/**
 * Run full O*NET ingestion
 * 
 * Run with: npx tsx scripts/run-full-ingest.ts
 */

import "dotenv/config";
import { ingestOnetData } from "../src/lib/onet/ingest";
import { db } from "../src/lib/db";

async function main() {
  console.log("Starting full O*NET ingestion...\n");
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  const result = await ingestOnetData({
    onProgress: (msg) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`),
  });

  console.log("\n" + "=".repeat(60));
  console.log("INGESTION COMPLETE");
  console.log("=".repeat(60));
  console.log(`  Success: ${result.success}`);
  console.log(`  Occupations processed: ${result.occupationsProcessed}`);
  console.log(`  Duration: ${Math.round(result.duration / 1000)}s`);
  
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
    result.errors.slice(0, 5).forEach((e) => console.log(`    - ${e.substring(0, 100)}`));
  }

  // Verify counts
  console.log("\nDatabase verification:");
  const [occupations, tasks, workContext, workStyles, skills] = await Promise.all([
    db.occupation.count(),
    db.occupationTask.count(),
    db.occupationWorkContext.count(),
    db.occupationWorkStyle.count(),
    db.occupationSkill.count(),
  ]);
  
  console.log(`  Occupations: ${occupations}`);
  console.log(`  Tasks: ${tasks}`);
  console.log(`  Work Context: ${workContext}`);
  console.log(`  Work Styles: ${workStyles}`);
  console.log(`  Skills: ${skills}`);
  
  const stemCount = await db.occupation.count({ where: { stemOccupation: true } });
  console.log(`  STEM occupations: ${stemCount}`);

  process.exit(result.success ? 0 : 1);
}

main();
