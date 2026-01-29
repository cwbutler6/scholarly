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
  imageUrl: string | null;
  category: string | null;
  education: string | null;
  salaryLow: string | null;
  salaryHigh: string | null;
  growth: string | null;
  matchPercent: number;
  isSaved: boolean;
  skills: {
    technical: string[];
    soft: string[];
  };
  abilities: string[];
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

  const [occupation, savedCareers, assessment] = await Promise.all([
    db.occupation.findUnique({
      where: { id },
      include: {
        skills: true,
        abilities: true,
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

  const technicalSkills = occupation.skills
    .filter((s) => s.type === "technical")
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .map((s) => s.name);

  const softSkills = occupation.skills
    .filter((s) => s.type === "soft")
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .map((s) => s.name);

  const abilities = occupation.abilities
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .map((a) => a.name);

  return {
    id: occupation.id,
    title: occupation.title,
    description: occupation.description,
    imageUrl,
    category: occupation.category,
    education: occupation.education,
    salaryLow: formatSalary(occupation.medianWage),
    salaryHigh: formatSalary(occupation.medianWageHigh),
    growth: occupation.jobGrowth,
    matchPercent: calculateMatch(userScores, occupation),
    isSaved: savedIds.has(occupation.id),
    skills: {
      technical: technicalSkills,
      soft: softSkills,
    },
    abilities,
  };
}
