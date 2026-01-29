"use server";

import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/user";

export interface CareerWithMatch {
  id: string;
  title: string;
  description: string | null;
  matchPercent: number;
  salary: string | null;
  growth: string | null;
  isSaved: boolean;
}

function formatSalary(medianWage: number | null): string | null {
  if (!medianWage) return null;
  if (medianWage >= 1000) {
    return `$${Math.round(medianWage / 1000)}k`;
  }
  return `$${medianWage}`;
}

function calculateMatch(
  userScores: { r: number; i: number; a: number; s: number; e: number; c: number } | null,
  occupation: {
    riasecRealistic: number | null;
    riasecInvestigative: number | null;
    riasecArtistic: number | null;
    riasecSocial: number | null;
    riasecEnterprising: number | null;
    riasecConventional: number | null;
  }
): number {
  if (!userScores) return Math.floor(Math.random() * 30) + 70;
  
  const occScores = {
    r: occupation.riasecRealistic || 0,
    i: occupation.riasecInvestigative || 0,
    a: occupation.riasecArtistic || 0,
    s: occupation.riasecSocial || 0,
    e: occupation.riasecEnterprising || 0,
    c: occupation.riasecConventional || 0,
  };

  const userTotal = Object.values(userScores).reduce((a, b) => a + b, 0) || 1;
  const occTotal = Object.values(occScores).reduce((a, b) => a + b, 0) || 1;

  const userNorm = {
    r: userScores.r / userTotal,
    i: userScores.i / userTotal,
    a: userScores.a / userTotal,
    s: userScores.s / userTotal,
    e: userScores.e / userTotal,
    c: userScores.c / userTotal,
  };

  const occNorm = {
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

export async function getRecommendedCareers(limit = 10): Promise<CareerWithMatch[]> {
  const user = await getOrCreateUser();
  
  const [occupations, savedCareers, assessment] = await Promise.all([
    db.occupation.findMany({
      take: limit,
      orderBy: { brightOutlook: "desc" },
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

  return occupations.map((occ) => ({
    id: occ.id,
    title: occ.title,
    description: occ.description,
    matchPercent: calculateMatch(userScores, occ),
    salary: formatSalary(occ.medianWage),
    growth: occ.jobGrowth,
    isSaved: savedIds.has(occ.id),
  }));
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

  return occupations.map((occ) => ({
    id: occ.id,
    title: occ.title,
    description: occ.description,
    matchPercent: calculateMatch(userScores, occ),
    salary: formatSalary(occ.medianWage),
    growth: occ.jobGrowth,
    isSaved: savedIds.has(occ.id),
  }));
}
