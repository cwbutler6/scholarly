/**
 * Refresh career images from Unsplash
 *
 * This script clears existing cached images and fetches fresh, diverse images
 * for all STEM occupations.
 *
 * Run with: npx tsx scripts/refresh-career-images.ts
 *
 * Options:
 *   --clear-only    Only clear images, don't fetch new ones
 *   --clear-dupes   Only clear duplicate images, then fetch
 *   --continue      Continue from where we left off (only fetch missing images)
 *   --limit=N       Only process N occupations (for testing)
 *   --dry-run       Show what would be done without making changes
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { getCareerImageUrl } from "../src/lib/unsplash";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const clearOnly = args.includes("--clear-only");
  const clearDupes = args.includes("--clear-dupes");
  const continueMode = args.includes("--continue");
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

  console.log("Career Image Refresh Script");
  console.log("=".repeat(50));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Clear only: ${clearOnly}`);
  console.log(`Clear dupes only: ${clearDupes}`);
  console.log(`Continue (missing only): ${continueMode}`);
  console.log(`Limit: ${limit || "none"}`);
  console.log("");

  if (!process.env.UNSPLASH_ACCESS_KEY && !clearOnly && !clearDupes) {
    console.error("ERROR: UNSPLASH_ACCESS_KEY is required to fetch images");
    console.error("Set it in your .env file or use --clear-only to just clear existing images");
    process.exit(1);
  }

  // Handle clear-dupes mode
  if (clearDupes) {
    console.log("Clearing duplicate images only...");
    
    const dupes = await db.$queryRaw<{ image_url: string }[]>`
      SELECT image_url FROM occupations 
      WHERE image_url IS NOT NULL 
      GROUP BY image_url 
      HAVING COUNT(*) > 1
    `;
    
    if (dupes.length === 0) {
      console.log("  No duplicate images found!");
    } else {
      console.log(`  Found ${dupes.length} duplicate image URLs`);
      
      if (!dryRun) {
        const result = await db.occupation.updateMany({
          where: {
            imageUrl: { in: dupes.map((d) => d.image_url) },
          },
          data: { imageUrl: null },
        });
        console.log(`  Cleared ${result.count} occupation images`);
      } else {
        console.log(`  Would clear images from occupations with duplicate URLs`);
      }
    }
    console.log("");
    
    if (clearOnly) {
      console.log("Done!");
      process.exit(0);
    }
  }

  const occupations = await db.occupation.findMany({
    where: { 
      stemOccupation: true,
      ...(continueMode && { imageUrl: null }),
    },
    select: { id: true, title: true, imageUrl: true },
    take: limit,
    orderBy: { title: "asc" },
  });

  console.log(`Found ${occupations.length} STEM occupations${continueMode ? " without images" : ""}`);

  const withImages = occupations.filter((o) => o.imageUrl);
  const withoutImages = occupations.filter((o) => !o.imageUrl);

  console.log(`  - With images: ${withImages.length}`);
  console.log(`  - Without images: ${withoutImages.length}`);
  console.log("");

  // Step 1: Clear existing images (skip in continue mode)
  if (withImages.length > 0 && !continueMode && !clearDupes) {
    console.log("Step 1: Clearing existing images...");

    if (dryRun) {
      console.log(`  Would clear ${withImages.length} images`);
    } else {
      const result = await db.occupation.updateMany({
        where: {
          id: { in: occupations.map((o) => o.id) },
        },
        data: { imageUrl: null },
      });
      console.log(`  Cleared ${result.count} images`);
    }
    console.log("");
  }

  if (clearOnly) {
    console.log("Clear-only mode, skipping image fetch");
    console.log("Done!");
    process.exit(0);
  }

  // In continue mode, we only process occupations without images
  const toProcess = continueMode ? withoutImages : occupations;

  // Step 2: Fetch new images in batches
  console.log("Step 2: Fetching new images from Unsplash...");
  console.log(`  Processing ${toProcess.length} occupations in batches of ${BATCH_SIZE}`);
  console.log(`  Delay between batches: ${DELAY_BETWEEN_BATCHES_MS}ms (to avoid rate limits)`);
  console.log("");

  if (toProcess.length === 0) {
    console.log("No occupations to process!");
    process.exit(0);
  }

  let successCount = 0;
  let failCount = 0;
  let rateLimited = false;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    if (rateLimited) {
      console.log("\nRate limited! Stopping to avoid more 403 errors.");
      console.log("Wait 1 hour and run with --continue to resume.");
      break;
    }

    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches}:`);

    for (const occ of batch) {
      try {
        if (dryRun) {
          console.log(`  [DRY RUN] Would fetch image for: ${occ.title}`);
          successCount++;
          continue;
        }

        const imageUrl = await getCareerImageUrl(occ.title, occ.id);

        if (imageUrl) {
          await db.occupation.update({
            where: { id: occ.id },
            data: { imageUrl },
          });
          console.log(`  ✓ ${occ.title}`);
          successCount++;
        } else {
          console.log(`  ✗ ${occ.title} (no image found)`);
          failCount++;
          
          // Check if we're being rate limited
          if (failCount > 3 && successCount === 0) {
            rateLimited = true;
          }
        }
      } catch (error) {
        const errorStr = String(error);
        if (errorStr.includes("403")) {
          rateLimited = true;
          console.log(`  ✗ ${occ.title} (rate limited)`);
        } else {
          console.log(`  ✗ ${occ.title} (error: ${error})`);
        }
        failCount++;
      }
      
      // Small delay between individual requests
      await sleep(100);
    }

    if (i + BATCH_SIZE < toProcess.length && !rateLimited) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log("");
  console.log("=".repeat(50));
  console.log(rateLimited ? "STOPPED (rate limited)" : "COMPLETE");
  console.log("=".repeat(50));
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);
  console.log(`  Total processed: ${successCount + failCount}`);
  console.log(`  Remaining: ${toProcess.length - successCount - failCount}`);
  
  if (rateLimited) {
    console.log("\nTo continue, wait 1 hour and run:");
    console.log("  npx tsx scripts/refresh-career-images.ts --continue");
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
