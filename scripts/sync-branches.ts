/**
 * Sync Neon branches from main after O*NET ingestion
 * 
 * This script resets preview and staging branches from main,
 * copying all O*NET data without re-running ingestion.
 * 
 * Prerequisites:
 *   - NEON_API_KEY environment variable
 *   - Run AFTER ingestion completes on main branch
 * 
 * Usage:
 *   npx tsx scripts/sync-branches.ts
 *   npx tsx scripts/sync-branches.ts --dry-run
 */

import "dotenv/config";

const NEON_PROJECT_ID = "square-tree-48125940";
const BRANCHES_TO_SYNC = [
  { id: "br-lively-wave-ahuj64i8", name: "preview/dev" },
  { id: "br-wandering-sky-ahqhotyy", name: "staging/dev" },
];

async function resetBranch(branchId: string, branchName: string, dryRun: boolean) {
  const apiKey = process.env.NEON_API_KEY;
  
  if (!apiKey) {
    throw new Error("NEON_API_KEY environment variable is required");
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Resetting ${branchName} from main...`);
  
  if (dryRun) {
    console.log(`  Would call: POST /projects/${NEON_PROJECT_ID}/branches/${branchId}/reset`);
    return { success: true, dryRun: true };
  }

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/reset`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_branch_id: "br-dry-smoke-ahp6jzdv", // main branch
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to reset ${branchName}: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(`  ✓ ${branchName} reset successfully`);
  return result;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  
  console.log("=".repeat(60));
  console.log("NEON BRANCH SYNC");
  console.log("=".repeat(60));
  console.log(`Project: ${NEON_PROJECT_ID}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log("");

  for (const branch of BRANCHES_TO_SYNC) {
    try {
      await resetBranch(branch.id, branch.name, dryRun);
    } catch (error) {
      console.error(`  ✗ Failed to reset ${branch.name}:`, error);
    }
  }

  console.log("");
  console.log("Done! Preview and staging branches now have the same data as main.");
}

main();
