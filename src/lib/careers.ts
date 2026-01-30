"use server";

import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/user";
import { getCareerImageUrl } from "@/lib/unsplash";

export interface CareerWithMatch {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  matchPercent: number;
  salary: string | null;
  growth: string | null;
  isSaved: boolean;
}

export interface CareerDetail {
  id: string;
  title: string;
  description: string | null;
  whatTheyDo: string | null;
  imageUrl: string | null;
  category: string | null;
  majorGroup: string | null;
  education: string | null;
  typicalEducation: string | null;
  salaryLow: string | null;
  salaryHigh: string | null;
  growth: string | null;
  projectedGrowth: number | null;
  matchPercent: number;
  convictionScore: number;
  isSaved: boolean;
  skills: Array<{ name: string; importance: number | null }>;
  knowledge: Array<{ name: string; importance: number | null }>;
  abilities: Array<{ name: string; importance: number | null }>;
  technologies: Array<{ name: string; isHot: boolean }>;
  relatedCareers: Array<{ id: string; title: string }>;
}

function formatSalary(medianWage: number | null): string | null {
  if (!medianWage) return null;
  if (medianWage >= 1000) {
    return `$${Math.round(medianWage / 1000)}k`;
  }
  return `$${medianWage}`;
}

interface RiasecScores {
  r: number;
  i: number;
  a: number;
  s: number;
  e: number;
  c: number;
}

interface OccupationRiasec {
  riasecRealistic: number | null;
  riasecInvestigative: number | null;
  riasecArtistic: number | null;
  riasecSocial: number | null;
  riasecEnterprising: number | null;
  riasecConventional: number | null;
}

function calculateMatch(
  userScores: RiasecScores | null,
  occupation: OccupationRiasec
): number {
  if (!userScores) return Math.floor(Math.random() * 30) + 70;

  const occScores: RiasecScores = {
    r: occupation.riasecRealistic || 0,
    i: occupation.riasecInvestigative || 0,
    a: occupation.riasecArtistic || 0,
    s: occupation.riasecSocial || 0,
    e: occupation.riasecEnterprising || 0,
    c: occupation.riasecConventional || 0,
  };

  const userTotal = Object.values(userScores).reduce((a, b) => a + b, 0) || 1;
  const occTotal = Object.values(occScores).reduce((a, b) => a + b, 0) || 1;

  const userNorm: RiasecScores = {
    r: userScores.r / userTotal,
    i: userScores.i / userTotal,
    a: userScores.a / userTotal,
    s: userScores.s / userTotal,
    e: userScores.e / userTotal,
    c: userScores.c / userTotal,
  };

  const occNorm: RiasecScores = {
    r: occScores.r / occTotal,
    i: occScores.i / occTotal,
    a: occScores.a / occTotal,
    s: occScores.s / occTotal,
    e: occScores.e / occTotal,
    c: occScores.c / occTotal,
  };

  let similarity = 0;
  for (const key of ["r", "i", "a", "s", "e", "c"] as const) {
    similarity += userNorm[key] * occNorm[key];
  }

  return Math.round(similarity * 100);
}

/**
 * Calculate conviction score based on skill overlap between user and occupation
 */
async function calculateConvictionScore(
  userId: string,
  occupationId: string
): Promise<number> {
  const [userSkills, occupationSkills] = await Promise.all([
    db.userSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
    db.occupationSkill.findMany({
      where: { occupationId },
    }),
  ]);

  if (userSkills.length === 0 || occupationSkills.length === 0) {
    return 50;
  }

  const userSkillNames = new Set(
    userSkills.map((us) => us.skill.name.toLowerCase())
  );
  const occSkillNames = occupationSkills.map((os) => os.name.toLowerCase());

  let matchedImportance = 0;
  let totalImportance = 0;

  for (const occSkill of occupationSkills) {
    const importance = occSkill.importance || 50;
    totalImportance += importance;

    if (userSkillNames.has(occSkill.name.toLowerCase())) {
      const userSkill = userSkills.find(
        (us) => us.skill.name.toLowerCase() === occSkill.name.toLowerCase()
      );
      const proficiencyMultiplier = userSkill
        ? userSkill.proficiency / 100
        : 0.5;
      matchedImportance += importance * proficiencyMultiplier;
    }
  }

  if (totalImportance === 0) return 50;

  return Math.round((matchedImportance / totalImportance) * 100);
}

export async function getRecommendedCareers(limit = 10): Promise<CareerWithMatch[]> {
  const user = await getOrCreateUser();

  const [occupations, savedCareers, assessment] = await Promise.all([
    db.occupation.findMany({
      take: limit * 3,
      orderBy: [{ brightOutlook: "desc" }, { medianWage: "desc" }],
    }),
    user
      ? db.savedCareer.findMany({
          where: { userId: user.id },
          select: { occupationId: true },
        })
      : [],
    user
      ? db.assessment.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        })
      : null,
  ]);

  const savedIds = new Set(savedCareers.map((s) => s.occupationId));

  const userScores = assessment
    ? {
        r: assessment.realistic,
        i: assessment.investigative,
        a: assessment.artistic,
        s: assessment.social,
        e: assessment.enterprising,
        c: assessment.conventional,
      }
    : null;

  const careersWithMatch = occupations.map((occ) => ({
    occ,
    matchPercent: calculateMatch(userScores, occ),
  }));

  careersWithMatch.sort((a, b) => b.matchPercent - a.matchPercent);
  const topCareers = careersWithMatch.slice(0, limit);

  const careersWithImages = await Promise.all(
    topCareers.map(async ({ occ, matchPercent }) => {
      let imageUrl = occ.imageUrl;

      if (!imageUrl) {
        imageUrl = await getCareerImageUrl(occ.title);
        if (imageUrl) {
          db.occupation
            .update({
              where: { id: occ.id },
              data: { imageUrl },
            })
            .catch(() => {});
        }
      }

      return {
        id: occ.id,
        title: occ.title,
        description: occ.description,
        imageUrl,
        matchPercent,
        salary: formatSalary(occ.medianWage),
        growth: occ.jobGrowth,
        isSaved: savedIds.has(occ.id),
      };
    })
  );

  return careersWithImages;
}

export async function toggleSaveCareer(occupationId: string): Promise<boolean> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  const existing = await db.savedCareer.findUnique({
    where: {
      userId_occupationId: {
        userId: user.id,
        occupationId,
      },
    },
  });

  if (existing) {
    await db.savedCareer.delete({
      where: { id: existing.id },
    });
    return false;
  } else {
    await db.savedCareer.create({
      data: {
        userId: user.id,
        occupationId,
      },
    });
    return true;
  }
}

export async function searchCareers(query: string): Promise<CareerWithMatch[]> {
  const user = await getOrCreateUser();

  const [occupations, savedCareers, assessment] = await Promise.all([
    db.occupation.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
    user ? db.savedCareer.findMany({
      where: { userId: user.id },
      select: { occupationId: true },
    }) : [],
    user ? db.assessment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }) : null,
  ]);

  const savedIds = new Set(savedCareers.map((s) => s.occupationId));
  
  const userScores = assessment ? {
    r: assessment.realistic,
    i: assessment.investigative,
    a: assessment.artistic,
    s: assessment.social,
    e: assessment.enterprising,
    c: assessment.conventional,
  } : null;

  const careersWithImages = await Promise.all(
    occupations.map(async (occ) => {
      let imageUrl = occ.imageUrl;
      
      if (!imageUrl) {
        imageUrl = await getCareerImageUrl(occ.title);
        if (imageUrl) {
          db.occupation.update({
            where: { id: occ.id },
            data: { imageUrl },
          }).catch(() => {});
        }
      }

      return {
        id: occ.id,
        title: occ.title,
        description: occ.description,
        imageUrl,
        matchPercent: calculateMatch(userScores, occ),
        salary: formatSalary(occ.medianWage),
        growth: occ.jobGrowth,
        isSaved: savedIds.has(occ.id),
      };
    })
  );

  return careersWithImages;
}

export async function getCareerById(id: string): Promise<CareerDetail | null> {
  const user = await getOrCreateUser();

  const [occupation, savedCareers, assessment, relatedOccupations] =
    await Promise.all([
      db.occupation.findUnique({
        where: { id },
        include: {
          skills: { orderBy: { importance: "desc" } },
          knowledge: { orderBy: { importance: "desc" } },
          abilities: { orderBy: { importance: "desc" } },
          technologies: { orderBy: { hotTechnology: "desc" } },
        },
      }),
      user
        ? db.savedCareer.findMany({
            where: { userId: user.id },
            select: { occupationId: true },
          })
        : [],
      user
        ? db.assessment.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
          })
        : null,
      db.occupationRelation.findMany({
        where: { sourceId: id },
        include: { target: { select: { id: true, title: true } } },
        take: 6,
      }),
    ]);

  if (!occupation) return null;

  const savedIds = new Set(savedCareers.map((s) => s.occupationId));

  const userScores = assessment
    ? {
        r: assessment.realistic,
        i: assessment.investigative,
        a: assessment.artistic,
        s: assessment.social,
        e: assessment.enterprising,
        c: assessment.conventional,
      }
    : null;

  let imageUrl = occupation.imageUrl;
  if (!imageUrl) {
    imageUrl = await getCareerImageUrl(occupation.title);
    if (imageUrl) {
      db.occupation
        .update({
          where: { id: occupation.id },
          data: { imageUrl },
        })
        .catch(() => {});
    }
  }

  const convictionScore = user
    ? await calculateConvictionScore(user.id, occupation.id)
    : 50;

  return {
    id: occupation.id,
    title: occupation.title,
    description: occupation.description,
    whatTheyDo: occupation.whatTheyDo,
    imageUrl,
    category: occupation.category,
    majorGroup: occupation.majorGroup,
    education: occupation.education,
    typicalEducation: occupation.typicalEducation,
    salaryLow: formatSalary(occupation.medianWage),
    salaryHigh: formatSalary(occupation.medianWageHigh),
    growth: occupation.jobGrowth,
    projectedGrowth: occupation.projectedGrowth,
    matchPercent: calculateMatch(userScores, occupation),
    convictionScore,
    isSaved: savedIds.has(occupation.id),
    skills: occupation.skills.map((s) => ({
      name: s.name,
      importance: s.importance,
    })),
    knowledge: occupation.knowledge.map((k) => ({
      name: k.name,
      importance: k.importance,
    })),
    abilities: occupation.abilities.map((a) => ({
      name: a.name,
      importance: a.importance,
    })),
    technologies: occupation.technologies.map((t) => ({
      name: t.name,
      isHot: t.hotTechnology,
    })),
    relatedCareers: relatedOccupations.map((r) => ({
      id: r.target.id,
      title: r.target.title,
    })),
  };
}
