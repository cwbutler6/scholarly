/**
 * O*NET Data Ingestion Orchestrator
 *
 * Fetches all O*NET data and upserts into the database.
 * Designed to be called from a cron job or manually.
 */

import { db } from "@/lib/db";
import { OnetClient } from "./client";
import {
  transformOccupation,
  transformSkill,
  transformKnowledge,
  transformAbility,
  transformWorkActivity,
  transformTechnology,
  transformRelation,
} from "./transform";

interface IngestResult {
  success: boolean;
  occupationsProcessed: number;
  errors: string[];
  duration: number;
}

interface IngestOptions {
  limit?: number;
  skipRelations?: boolean;
  onProgress?: (message: string) => void;
}

export async function ingestOnetData(
  options: IngestOptions = {}
): Promise<IngestResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let occupationsProcessed = 0;

  const log = options.onProgress || console.log;

  try {
    const client = new OnetClient();

    log("Fetching all occupations from O*NET...");
    const occupations = await client.getAllOccupations();
    const toProcess = options.limit
      ? occupations.slice(0, options.limit)
      : occupations;
    log(`Found ${occupations.length} occupations, processing ${toProcess.length}`);

    for (const occupation of toProcess) {
      try {
        await ingestSingleOccupation(client, occupation.code, log);
        occupationsProcessed++;

        if (occupationsProcessed % 50 === 0) {
          log(`Processed ${occupationsProcessed}/${toProcess.length} occupations`);
        }
      } catch (error) {
        const msg = `Error processing ${occupation.code}: ${error}`;
        errors.push(msg);
        log(msg);
      }
    }

    if (!options.skipRelations) {
      log("Ingesting related occupations...");
      await ingestAllRelations(client, toProcess, log);
    }

    log(`Ingestion complete. Processed ${occupationsProcessed} occupations.`);
  } catch (error) {
    errors.push(`Fatal error: ${error}`);
  }

  return {
    success: errors.length === 0,
    occupationsProcessed,
    errors,
    duration: Date.now() - startTime,
  };
}

async function ingestSingleOccupation(
  client: OnetClient,
  code: string,
  log: (msg: string) => void
): Promise<void> {
  const [details, report, skills, knowledge, abilities, workActivities, tech] =
    await Promise.all([
      client.getOccupationDetails(code).catch(() => null),
      client.getOccupationReport(code).catch(() => null),
      client.getOccupationSkills(code).catch(() => ({ element: [] })),
      client.getOccupationKnowledge(code).catch(() => ({ element: [] })),
      client.getOccupationAbilities(code).catch(() => ({ element: [] })),
      client.getOccupationWorkActivities(code).catch(() => ({ element: [] })),
      client.getOccupationTechnology(code).catch(() => ({ category: [] })),
    ]);

  const occupationData = transformOccupation(
    {
      code,
      title: details?.title || report?.title || code,
      description: details?.description,
      tags: {
        bright_outlook: report?.job_outlook?.bright_outlook !== undefined,
      },
    },
    report || undefined
  );

  await db.occupation.upsert({
    where: { id: code },
    update: occupationData,
    create: occupationData,
  });

  await db.occupationSkill.deleteMany({ where: { occupationId: code } });
  if (skills.element?.length) {
    await db.occupationSkill.createMany({
      data: skills.element.map((el) => transformSkill(code, el)),
      skipDuplicates: true,
    });
  }

  await db.occupationKnowledge.deleteMany({ where: { occupationId: code } });
  if (knowledge.element?.length) {
    await db.occupationKnowledge.createMany({
      data: knowledge.element.map((el) => transformKnowledge(code, el)),
      skipDuplicates: true,
    });
  }

  await db.occupationAbility.deleteMany({ where: { occupationId: code } });
  if (abilities.element?.length) {
    await db.occupationAbility.createMany({
      data: abilities.element.map((el) => transformAbility(code, el)),
      skipDuplicates: true,
    });
  }

  await db.occupationWorkActivity.deleteMany({ where: { occupationId: code } });
  if (workActivities.element?.length) {
    await db.occupationWorkActivity.createMany({
      data: workActivities.element.map((el) => transformWorkActivity(code, el)),
      skipDuplicates: true,
    });
  }

  await db.occupationTechnology.deleteMany({ where: { occupationId: code } });
  if (tech.category?.length) {
    const techData: ReturnType<typeof transformTechnology>[] = [];
    for (const cat of tech.category) {
      if (cat.title) {
        for (const t of cat.title) {
          const techName =
            typeof t === "string"
              ? t
              : typeof t === "object" && t.title?.name
                ? t.title.name
                : null;
          if (techName) {
            techData.push(
              transformTechnology(
                code,
                techName,
                typeof t === "object" && t.category?.name
                  ? t.category.name
                  : undefined,
                typeof t === "object" && t.hot_technology === true
              )
            );
          }
        }
      }
    }
    if (techData.length > 0) {
      await db.occupationTechnology.createMany({
        data: techData,
        skipDuplicates: true,
      });
    }
  }
}

async function ingestAllRelations(
  client: OnetClient,
  occupations: Array<{ code: string }>,
  log: (msg: string) => void
): Promise<void> {
  let processed = 0;

  for (const occupation of occupations) {
    try {
      const related = await client.getRelatedOccupations(occupation.code);

      if (related.occupation?.length) {
        await db.occupationRelation.deleteMany({
          where: { sourceId: occupation.code },
        });

        const existingOccupations = await db.occupation.findMany({
          where: {
            id: { in: related.occupation.map((r) => r.code) },
          },
          select: { id: true },
        });

        const existingIds = new Set(existingOccupations.map((o) => o.id));

        const relationData = related.occupation
          .filter((r) => existingIds.has(r.code))
          .map((r) => transformRelation(occupation.code, r.code));

        if (relationData.length > 0) {
          await db.occupationRelation.createMany({
            data: relationData,
            skipDuplicates: true,
          });
        }
      }

      processed++;
      if (processed % 100 === 0) {
        log(`Processed relations for ${processed}/${occupations.length} occupations`);
      }
    } catch (error) {
      log(`Error processing relations for ${occupation.code}: ${error}`);
    }
  }
}

export async function ingestHotTechnologies(): Promise<string[]> {
  const client = new OnetClient();
  const hotTech = await client.getHotTechnologies();

  const technologies: string[] = [];
  if (hotTech.technology) {
    for (const tech of hotTech.technology) {
      technologies.push(tech.name);
    }
  }

  return technologies;
}

export async function getIngestionStats(): Promise<{
  totalOccupations: number;
  withSkills: number;
  withTechnologies: number;
  lastSynced: Date | null;
}> {
  const [totalOccupations, withSkills, withTechnologies, lastSynced] =
    await Promise.all([
      db.occupation.count(),
      db.occupation.count({
        where: { skills: { some: {} } },
      }),
      db.occupation.count({
        where: { technologies: { some: {} } },
      }),
      db.occupation.findFirst({
        where: { lastSynced: { not: null } },
        orderBy: { lastSynced: "desc" },
        select: { lastSynced: true },
      }),
    ]);

  return {
    totalOccupations,
    withSkills,
    withTechnologies,
    lastSynced: lastSynced?.lastSynced || null,
  };
}
