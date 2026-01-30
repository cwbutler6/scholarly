"use server";

import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/user";
import { getCareerImageUrl } from "@/lib/unsplash";

const STEM_FILTER = { stemOccupation: true } as const;

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
 * Conviction Score Weights
 * Total = 100%
 */
const CONVICTION_WEIGHTS = {
  riasec: 0.3,
  skills: 0.3,
  education: 0.2,
  engagement: 0.2,
};

/**
 * Calculate comprehensive conviction score based on multiple factors:
 * - RIASEC personality match (30%)
 * - Skills match (30%)
 * - Education/Knowledge alignment (20%)
 * - Engagement (videos watched, time spent) (20%)
 */
async function calculateConvictionScore(
  userId: string,
  occupationId: string
): Promise<number> {
  const [
    userSkills,
    occupationSkills,
    occupationKnowledge,
    assessment,
    occupation,
    videoWatches,
    engagement,
    user,
  ] = await Promise.all([
    db.userSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
    db.occupationSkill.findMany({
      where: { occupationId },
    }),
    db.occupationKnowledge.findMany({
      where: { occupationId },
    }),
    db.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.occupation.findUnique({
      where: { id: occupationId },
      select: {
        riasecRealistic: true,
        riasecInvestigative: true,
        riasecArtistic: true,
        riasecSocial: true,
        riasecEnterprising: true,
        riasecConventional: true,
        typicalEducation: true,
        jobZone: true,
      },
    }),
    db.careerVideoWatch.findMany({
      where: { userId, occupationId },
    }),
    db.careerEngagement.findUnique({
      where: { userId_occupationId: { userId, occupationId } },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { accountType: true, graduationYear: true },
    }),
  ]);

  let riasecScore = 50;
  let skillsScore = 0;
  let educationScore = 50;
  let engagementScore = 0;

  if (assessment && occupation) {
    const userScores: RiasecScores = {
      r: assessment.realistic,
      i: assessment.investigative,
      a: assessment.artistic,
      s: assessment.social,
      e: assessment.enterprising,
      c: assessment.conventional,
    };
    riasecScore = calculateMatch(userScores, occupation);
  }

  if (userSkills.length > 0 && occupationSkills.length > 0) {
    const userSkillNames = new Set(
      userSkills.map((us) => us.skill.name.toLowerCase())
    );

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

    if (totalImportance > 0) {
      skillsScore = Math.round((matchedImportance / totalImportance) * 100);
    }
  }

  if (occupation && user) {
    const jobZone = occupation.jobZone || 3;
    const accountType = user.accountType || "high_school";

    const educationLevelMap: Record<string, number> = {
      high_school: 2,
      some_college: 3,
      associates: 3,
      bachelors: 4,
      masters: 5,
      doctorate: 5,
    };

    const userEducationLevel = educationLevelMap[accountType] || 2;

    if (userEducationLevel >= jobZone) {
      educationScore = 100;
    } else if (userEducationLevel === jobZone - 1) {
      educationScore = 70;
    } else if (userEducationLevel === jobZone - 2) {
      educationScore = 40;
    } else {
      educationScore = 20;
    }

    if (occupationKnowledge.length > 0) {
      const userSkillNames = new Set(
        userSkills.map((us) => us.skill.name.toLowerCase())
      );
      let knowledgeMatches = 0;
      for (const knowledge of occupationKnowledge) {
        if (userSkillNames.has(knowledge.name.toLowerCase())) {
          knowledgeMatches++;
        }
      }
      const knowledgeMatchPercent =
        (knowledgeMatches / occupationKnowledge.length) * 100;
      educationScore = Math.round((educationScore + knowledgeMatchPercent) / 2);
    }
  }

  const completedVideos = videoWatches.filter((v) => v.completed).length;
  const totalWatchTime = videoWatches.reduce(
    (sum, v) => sum + v.watchedSeconds,
    0
  );
  const pageViews = engagement?.pageViews || 0;
  const timeSpent = engagement?.timeSpentSeconds || 0;

  const videoScore = Math.min(completedVideos * 20, 50);
  const watchTimeScore = Math.min(Math.floor(totalWatchTime / 60) * 5, 25);
  const pageViewScore = Math.min(pageViews * 5, 15);
  const timeSpentScore = Math.min(Math.floor(timeSpent / 60) * 2, 10);

  engagementScore = videoScore + watchTimeScore + pageViewScore + timeSpentScore;
  engagementScore = Math.min(engagementScore, 100);

  const weightedScore =
    riasecScore * CONVICTION_WEIGHTS.riasec +
    skillsScore * CONVICTION_WEIGHTS.skills +
    educationScore * CONVICTION_WEIGHTS.education +
    engagementScore * CONVICTION_WEIGHTS.engagement;

  return Math.round(Math.max(0, Math.min(100, weightedScore)));
}

export interface ConvictionBreakdown {
  total: number;
  riasec: number;
  skills: number;
  education: number;
  engagement: number;
}

/**
 * Get detailed conviction score breakdown for UI display
 */
export async function getConvictionBreakdown(
  userId: string,
  occupationId: string
): Promise<ConvictionBreakdown> {
  const [
    userSkills,
    occupationSkills,
    occupationKnowledge,
    assessment,
    occupation,
    videoWatches,
    engagement,
    user,
  ] = await Promise.all([
    db.userSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
    db.occupationSkill.findMany({
      where: { occupationId },
    }),
    db.occupationKnowledge.findMany({
      where: { occupationId },
    }),
    db.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.occupation.findUnique({
      where: { id: occupationId },
      select: {
        riasecRealistic: true,
        riasecInvestigative: true,
        riasecArtistic: true,
        riasecSocial: true,
        riasecEnterprising: true,
        riasecConventional: true,
        typicalEducation: true,
        jobZone: true,
      },
    }),
    db.careerVideoWatch.findMany({
      where: { userId, occupationId },
    }),
    db.careerEngagement.findUnique({
      where: { userId_occupationId: { userId, occupationId } },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { accountType: true, graduationYear: true },
    }),
  ]);

  let riasecScore = 50;
  let skillsScore = 0;
  let educationScore = 50;
  let engagementScore = 0;

  if (assessment && occupation) {
    const userScores: RiasecScores = {
      r: assessment.realistic,
      i: assessment.investigative,
      a: assessment.artistic,
      s: assessment.social,
      e: assessment.enterprising,
      c: assessment.conventional,
    };
    riasecScore = calculateMatch(userScores, occupation);
  }

  if (userSkills.length > 0 && occupationSkills.length > 0) {
    const userSkillNames = new Set(
      userSkills.map((us) => us.skill.name.toLowerCase())
    );

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

    if (totalImportance > 0) {
      skillsScore = Math.round((matchedImportance / totalImportance) * 100);
    }
  }

  if (occupation && user) {
    const jobZone = occupation.jobZone || 3;
    const accountType = user.accountType || "high_school";

    const educationLevelMap: Record<string, number> = {
      high_school: 2,
      some_college: 3,
      associates: 3,
      bachelors: 4,
      masters: 5,
      doctorate: 5,
    };

    const userEducationLevel = educationLevelMap[accountType] || 2;

    if (userEducationLevel >= jobZone) {
      educationScore = 100;
    } else if (userEducationLevel === jobZone - 1) {
      educationScore = 70;
    } else if (userEducationLevel === jobZone - 2) {
      educationScore = 40;
    } else {
      educationScore = 20;
    }

    if (occupationKnowledge.length > 0) {
      const userSkillNames = new Set(
        userSkills.map((us) => us.skill.name.toLowerCase())
      );
      let knowledgeMatches = 0;
      for (const knowledge of occupationKnowledge) {
        if (userSkillNames.has(knowledge.name.toLowerCase())) {
          knowledgeMatches++;
        }
      }
      const knowledgeMatchPercent =
        (knowledgeMatches / occupationKnowledge.length) * 100;
      educationScore = Math.round((educationScore + knowledgeMatchPercent) / 2);
    }
  }

  const completedVideos = videoWatches.filter((v) => v.completed).length;
  const totalWatchTime = videoWatches.reduce(
    (sum, v) => sum + v.watchedSeconds,
    0
  );
  const pageViews = engagement?.pageViews || 0;
  const timeSpent = engagement?.timeSpentSeconds || 0;

  const videoScore = Math.min(completedVideos * 20, 50);
  const watchTimeScore = Math.min(Math.floor(totalWatchTime / 60) * 5, 25);
  const pageViewScore = Math.min(pageViews * 5, 15);
  const timeSpentScore = Math.min(Math.floor(timeSpent / 60) * 2, 10);

  engagementScore = videoScore + watchTimeScore + pageViewScore + timeSpentScore;
  engagementScore = Math.min(engagementScore, 100);

  const total =
    riasecScore * CONVICTION_WEIGHTS.riasec +
    skillsScore * CONVICTION_WEIGHTS.skills +
    educationScore * CONVICTION_WEIGHTS.education +
    engagementScore * CONVICTION_WEIGHTS.engagement;

  return {
    total: Math.round(Math.max(0, Math.min(100, total))),
    riasec: riasecScore,
    skills: skillsScore,
    education: educationScore,
    engagement: engagementScore,
  };
}

export async function getRecommendedCareers(limit = 10): Promise<CareerWithMatch[]> {
  const user = await getOrCreateUser();

  const [allOccupations, savedCareers, assessment, userSkills, userInterests] =
    await Promise.all([
      db.occupation.findMany({
        where: STEM_FILTER,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          medianWage: true,
          jobGrowth: true,
          brightOutlook: true,
          riasecRealistic: true,
          riasecInvestigative: true,
          riasecArtistic: true,
          riasecSocial: true,
          riasecEnterprising: true,
          riasecConventional: true,
          majorGroup: true,
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
      user
        ? db.userSkill.findMany({
            where: { userId: user.id },
            include: { skill: true },
          })
        : [],
      user
        ? db.userInterest.findMany({
            where: { userId: user.id },
          })
        : [],
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

  const hasAssessment = assessment !== null;
  const hasSkills = userSkills.length > 0;
  const hasInterests = userInterests.length > 0;

  const occupationSkillsMap: Map<string, string[]> = new Map();
  if (hasSkills) {
    const allOccupationSkills = await db.occupationSkill.findMany({
      select: { occupationId: true, name: true },
    });
    for (const skill of allOccupationSkills) {
      const existing = occupationSkillsMap.get(skill.occupationId) || [];
      existing.push(skill.name.toLowerCase());
      occupationSkillsMap.set(skill.occupationId, existing);
    }
  }

  const userSkillNames = new Set(
    userSkills.map((us) => us.skill.name.toLowerCase())
  );
  const userInterestNames = new Set(
    userInterests.map((ui) => ui.name.toLowerCase())
  );

  const scoredOccupations = allOccupations.map((occ) => {
    let totalScore = 0;
    let maxPossibleScore = 0;

    if (hasAssessment) {
      maxPossibleScore += 40;
      const riasecMatch = calculateMatch(userScores, occ);
      totalScore += (riasecMatch / 100) * 40;
    }

    if (hasSkills) {
      maxPossibleScore += 35;
      const occSkills = occupationSkillsMap.get(occ.id) || [];
      if (occSkills.length > 0) {
        let matchCount = 0;
        for (const skill of occSkills) {
          if (userSkillNames.has(skill)) {
            matchCount++;
          }
        }
        const skillMatchPercent = matchCount / occSkills.length;
        totalScore += skillMatchPercent * 35;
      }
    }

    if (hasInterests) {
      maxPossibleScore += 15;
      const titleLower = occ.title.toLowerCase();
      const descLower = (occ.description || "").toLowerCase();
      const majorGroupLower = (occ.majorGroup || "").toLowerCase();
      let interestMatchCount = 0;
      for (const interest of userInterestNames) {
        if (
          titleLower.includes(interest) ||
          descLower.includes(interest) ||
          majorGroupLower.includes(interest)
        ) {
          interestMatchCount++;
        }
      }
      if (userInterestNames.size > 0) {
        const interestMatchPercent = Math.min(
          interestMatchCount / userInterestNames.size,
          1
        );
        totalScore += interestMatchPercent * 15;
      }
    }

    maxPossibleScore += 10;
    if (occ.brightOutlook) {
      totalScore += 5;
    }
    if (occ.medianWage && occ.medianWage > 50000) {
      totalScore += 5;
    }

    const finalScore =
      maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 100)
        : 50 + Math.floor(Math.random() * 20);

    return {
      occ,
      matchPercent: Math.min(finalScore, 99),
    };
  });

  scoredOccupations.sort((a, b) => b.matchPercent - a.matchPercent);
  const topCareers = scoredOccupations.slice(0, limit);

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
        ...STEM_FILTER,
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
      db.occupation.findFirst({
        where: { id, ...STEM_FILTER },
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
