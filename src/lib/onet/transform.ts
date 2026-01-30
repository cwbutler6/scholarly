/**
 * Transform O*NET API responses to database schema format
 */

import type { Prisma } from "@/generated/prisma";

interface OnetElement {
  id: string;
  name: string;
  score?: {
    value: number;
    scale?: { id: string; name: string };
  };
}

interface OnetInterests {
  element?: Array<{
    id: string;
    name: string;
    score: { value: number };
  }>;
}

interface OnetJobOutlook {
  bright_outlook?: {
    category: string[];
  };
  salary?: {
    annual_median?: number;
    annual_10th_percentile?: number;
    annual_90th_percentile?: number;
  };
  outlook?: {
    category?: string;
    description?: string;
  };
  education?: {
    education_usually_needed?: {
      category?: string;
    };
  };
}

interface OnetOccupationReport {
  code: string;
  title: string;
  description?: string;
  what_they_do?: string;
  on_the_job?: { task: string[] };
  interests?: OnetInterests;
  job_outlook?: OnetJobOutlook;
}

interface OnetOccupation {
  code: string;
  title: string;
  description?: string;
  tags?: {
    bright_outlook?: boolean;
    green?: boolean;
    apprenticeship?: boolean;
  };
}

const RIASEC_MAP: Record<string, string> = {
  "1.B.1.a": "realistic",
  "1.B.1.b": "investigative",
  "1.B.1.c": "artistic",
  "1.B.1.d": "social",
  "1.B.1.e": "enterprising",
  "1.B.1.f": "conventional",
};

export function transformOccupation(
  occupation: OnetOccupation,
  report?: OnetOccupationReport
): Prisma.OccupationCreateInput {
  const riasec = extractRiasecScores(report?.interests);
  const majorGroup = extractMajorGroup(occupation.code);

  return {
    id: occupation.code,
    title: occupation.title,
    description: occupation.description || report?.description,
    whatTheyDo: report?.what_they_do,
    majorGroup,
    category: majorGroup,
    brightOutlook: occupation.tags?.bright_outlook ?? false,
    greenOccupation: occupation.tags?.green ?? false,
    riasecRealistic: riasec.realistic,
    riasecInvestigative: riasec.investigative,
    riasecArtistic: riasec.artistic,
    riasecSocial: riasec.social,
    riasecEnterprising: riasec.enterprising,
    riasecConventional: riasec.conventional,
    medianWage: report?.job_outlook?.salary?.annual_median,
    wagePercentile10: report?.job_outlook?.salary?.annual_10th_percentile,
    wagePercentile90: report?.job_outlook?.salary?.annual_90th_percentile,
    typicalEducation: report?.job_outlook?.education?.education_usually_needed?.category,
    jobGrowth: report?.job_outlook?.outlook?.category,
    onetVersion: "30.1",
    lastSynced: new Date(),
  };
}

function extractRiasecScores(interests?: OnetInterests): {
  realistic?: number;
  investigative?: number;
  artistic?: number;
  social?: number;
  enterprising?: number;
  conventional?: number;
} {
  if (!interests?.element) return {};

  const scores: Record<string, number> = {};
  for (const element of interests.element) {
    const riasecKey = RIASEC_MAP[element.id];
    if (riasecKey) {
      scores[riasecKey] = element.score.value;
    }
  }

  return scores;
}

function extractMajorGroup(code: string): string {
  const majorGroups: Record<string, string> = {
    "11": "Management",
    "13": "Business and Financial Operations",
    "15": "Computer and Mathematical",
    "17": "Architecture and Engineering",
    "19": "Life, Physical, and Social Science",
    "21": "Community and Social Service",
    "23": "Legal",
    "25": "Educational Instruction and Library",
    "27": "Arts, Design, Entertainment, Sports, and Media",
    "29": "Healthcare Practitioners and Technical",
    "31": "Healthcare Support",
    "33": "Protective Service",
    "35": "Food Preparation and Serving Related",
    "37": "Building and Grounds Cleaning and Maintenance",
    "39": "Personal Care and Service",
    "41": "Sales and Related",
    "43": "Office and Administrative Support",
    "45": "Farming, Fishing, and Forestry",
    "47": "Construction and Extraction",
    "49": "Installation, Maintenance, and Repair",
    "51": "Production",
    "53": "Transportation and Material Moving",
    "55": "Military Specific",
  };

  const prefix = code.substring(0, 2);
  return majorGroups[prefix] || "Other";
}

export function transformSkill(
  occupationId: string,
  element: OnetElement
): Prisma.OccupationSkillCreateManyInput {
  return {
    occupationId,
    elementId: element.id,
    name: element.name,
    importance: element.score?.value,
    level: element.score?.value,
    type: "onet_skill",
  };
}

export function transformKnowledge(
  occupationId: string,
  element: OnetElement
): Prisma.OccupationKnowledgeCreateManyInput {
  return {
    occupationId,
    elementId: element.id,
    name: element.name,
    importance: element.score?.value,
    level: element.score?.value,
  };
}

export function transformAbility(
  occupationId: string,
  element: OnetElement
): Prisma.OccupationAbilityCreateManyInput {
  return {
    occupationId,
    elementId: element.id,
    name: element.name,
    importance: element.score?.value,
    level: element.score?.value,
  };
}

export function transformWorkActivity(
  occupationId: string,
  element: OnetElement
): Prisma.OccupationWorkActivityCreateManyInput {
  return {
    occupationId,
    elementId: element.id,
    name: element.name,
    importance: element.score?.value,
    level: element.score?.value,
  };
}

export function transformTechnology(
  occupationId: string,
  name: string,
  categoryName?: string,
  hotTechnology: boolean = false
): Prisma.OccupationTechnologyCreateManyInput {
  return {
    occupationId,
    name,
    categoryName,
    hotTechnology,
  };
}

export function transformRelation(
  sourceId: string,
  targetId: string,
  similarity?: number
): Prisma.OccupationRelationCreateManyInput {
  return {
    sourceId,
    targetId,
    similarity,
  };
}
