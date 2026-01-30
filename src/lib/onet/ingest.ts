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
  transformTask,
  transformWorkContext,
  transformWorkStyle,
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

    log("Fetching STEM occupations list...");
    const stemData = await client.getStemOccupations().catch(() => ({ occupation: [] }));
    const stemCodes = new Set(stemData.occupation?.map((o) => o.code) || []);
    log(`Found ${stemCodes.size} STEM occupations`);

    log("Fetching RIASEC Interest Profiler questions...");
    await ingestRiasecQuestions(client, log).catch((err) => {
      errors.push(`Error ingesting RIASEC questions: ${err}`);
      log(`Error ingesting RIASEC questions: ${err}`);
    });

    for (const occupation of toProcess) {
      try {
        const isStem = stemCodes.has(occupation.code);
        await ingestSingleOccupation(client, occupation.code, isStem);
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
  isStem: boolean
): Promise<void> {
  const [
    details,
    mnmReport,
    skills,
    knowledge,
    abilities,
    workActivities,
    tech,
    jobZone,
    interests,
    tasks,
    workContext,
    workStyles,
  ] = await Promise.all([
    client.getOccupationDetails(code).catch(() => null),
    client.getMnmCareerReport(code).catch(() => null),
    client.getOccupationSkills(code).catch(() => ({ element: [] })),
    client.getOccupationKnowledge(code).catch(() => ({ element: [] })),
    client.getOccupationAbilities(code).catch(() => ({ element: [] })),
    client.getOccupationWorkActivities(code).catch(() => ({ element: [] })),
    client.getOccupationTechnology(code).catch(() => ({ category: [] })),
    client.getOccupationJobZone(code).catch(() => null),
    client.getOccupationInterests(code).catch(() => ({ element: [] })),
    client.getOccupationTasks(code).catch(() => ({ task: [] })),
    client.getOccupationWorkContext(code).catch(() => ({ element: [] })),
    client.getOccupationWorkStyles(code).catch(() => ({ element: [] })),
  ]);

  const occupationData = transformOccupation(
    {
      code,
      title: details?.title || mnmReport?.title || code,
      description: details?.description,
      tags: {
        bright_outlook: details?.tags?.bright_outlook ?? false,
        stem: isStem,
      },
    },
    mnmReport || undefined,
    jobZone || undefined,
    interests || undefined
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
      const categoryName = typeof cat.title === "string" ? cat.title : undefined;
      if (cat.example?.length) {
        for (const example of cat.example) {
          const techName = typeof example === "string" ? example : example?.title;
          if (techName) {
            techData.push(
              transformTechnology(
                code,
                techName,
                categoryName,
                typeof example === "object" && example.hot_technology === true
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

  await db.occupationTask.deleteMany({ where: { occupationId: code } });
  if (tasks.task?.length) {
    await db.occupationTask.createMany({
      data: tasks.task.map((t) => transformTask(code, t)),
      skipDuplicates: true,
    });
  }

  await db.occupationWorkContext.deleteMany({ where: { occupationId: code } });
  if (workContext.element?.length) {
    await db.occupationWorkContext.createMany({
      data: workContext.element.map((el) => transformWorkContext(code, el)),
      skipDuplicates: true,
    });
  }

  await db.occupationWorkStyle.deleteMany({ where: { occupationId: code } });
  if (workStyles.element?.length) {
    await db.occupationWorkStyle.createMany({
      data: workStyles.element.map((el) => transformWorkStyle(code, el)),
      skipDuplicates: true,
    });
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

async function ingestRiasecQuestions(
  client: OnetClient,
  log: (msg: string) => void
): Promise<void> {
  const questions = await client.getInterestProfilerQuestions30();

  if (!questions.question?.length) {
    log("No RIASEC questions found");
    return;
  }

  log(`Found ${questions.question.length} RIASEC questions, upserting...`);

  for (const q of questions.question) {
    await db.riasecQuestion.upsert({
      where: { index: q.index },
      update: {
        text: q.text,
        area: q.area,
      },
      create: {
        index: q.index,
        text: q.text,
        area: q.area,
      },
    });
  }

  log(`Upserted ${questions.question.length} RIASEC questions`);
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
