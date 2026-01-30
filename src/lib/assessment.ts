/**
 * RIASEC Assessment Service
 *
 * Handles fetching questions, saving answers, and calculating scores.
 * Uses O*NET's 30-question Mini-IP Interest Profiler.
 */

import { db } from "@/lib/db";
import { OnetClient } from "@/lib/onet/client";

const TOTAL_QUESTIONS = 30;
const ONBOARDING_QUESTIONS = 6;

type RiasecCategory = "R" | "I" | "A" | "S" | "E" | "C";

interface RiasecQuestion {
  id: string;
  index: number;
  text: string;
  area: string;
}

interface AnswerRecord {
  [questionIndex: number]: number;
}

interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

/**
 * Get 6 onboarding questions (1 per RIASEC category)
 */
export async function getOnboardingQuestions(): Promise<RiasecQuestion[]> {
  const allQuestions = await db.riasecQuestion.findMany({
    orderBy: { index: "asc" },
  });

  if (allQuestions.length === 0) {
    throw new Error("No RIASEC questions found. Run ingestion first.");
  }

  const categories: RiasecCategory[] = ["R", "I", "A", "S", "E", "C"];
  const selectedQuestions: RiasecQuestion[] = [];

  for (const category of categories) {
    const categoryQuestion = allQuestions.find(
      (q) => q.area.charAt(0).toUpperCase() === category
    );
    if (categoryQuestion) {
      selectedQuestions.push(categoryQuestion);
    }
  }

  return selectedQuestions;
}

/**
 * Get remaining questions user hasn't answered
 */
export async function getRemainingQuestions(
  userId: string
): Promise<RiasecQuestion[]> {
  const assessment = await db.assessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const answeredIndexes = new Set<number>(
    Object.keys((assessment?.answersJson as AnswerRecord) || {}).map(Number)
  );

  const allQuestions = await db.riasecQuestion.findMany({
    orderBy: { index: "asc" },
  });

  return allQuestions.filter((q) => !answeredIndexes.has(q.index));
}

/**
 * Save assessment answers (partial or full)
 */
export async function saveAnswers(
  userId: string,
  answers: AnswerRecord
): Promise<{ questionsAnswered: number; isComplete: boolean }> {
  const existingAssessment = await db.assessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const existingAnswers = (existingAssessment?.answersJson as AnswerRecord) || {};
  const mergedAnswers = { ...existingAnswers, ...answers };
  const questionsAnswered = Object.keys(mergedAnswers).length;
  const isComplete = questionsAnswered >= TOTAL_QUESTIONS;

  const questions = await db.riasecQuestion.findMany();
  const questionCategories: Record<number, string> = {};
  for (const q of questions) {
    questionCategories[q.index] = q.area;
  }

  const scores = calculateLocalScores(mergedAnswers, questionCategories);

  if (existingAssessment) {
    await db.assessment.update({
      where: { id: existingAssessment.id },
      data: {
        answersJson: mergedAnswers,
        questionsAnswered,
        isComplete,
        completedAt: isComplete ? new Date() : null,
        ...scores,
      },
    });
  } else {
    await db.assessment.create({
      data: {
        userId,
        answersJson: mergedAnswers,
        questionsAnswered,
        isComplete,
        completedAt: isComplete ? new Date() : null,
        ...scores,
      },
    });
  }

  return { questionsAnswered, isComplete };
}

/**
 * Calculate RIASEC scores locally from answers
 * This is a simple sum - O*NET's official API provides more sophisticated scoring
 */
export function calculateLocalScores(
  answers: AnswerRecord,
  questionCategories: Record<number, string>
): RiasecScores {
  const scores: RiasecScores = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  const areaToScore: Record<string, keyof RiasecScores> = {
    R: "realistic",
    I: "investigative",
    A: "artistic",
    S: "social",
    E: "enterprising",
    C: "conventional",
  };

  for (const [indexStr, value] of Object.entries(answers)) {
    const index = Number(indexStr);
    const area = questionCategories[index]?.toUpperCase();
    const scoreKey = areaToScore[area];
    if (scoreKey) {
      scores[scoreKey] += value;
    }
  }

  return scores;
}

/**
 * Get full RIASEC scores using O*NET Results API
 * Call this when all 30 questions are answered
 */
export async function getOnetScores(
  answers: AnswerRecord
): Promise<RiasecScores | null> {
  if (Object.keys(answers).length < TOTAL_QUESTIONS) {
    return null;
  }

  const answerString = buildAnswerString(answers);
  const client = new OnetClient();

  try {
    const result = await client.getInterestProfilerResults(answerString);

    const scores: RiasecScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    };

    for (const item of result.result) {
      const key = item.code.toLowerCase() as keyof RiasecScores;
      if (key in scores) {
        scores[key] = item.score;
      }
    }

    return scores;
  } catch (error) {
    console.error("Error fetching O*NET scores:", error);
    return null;
  }
}

/**
 * Build the answer string for O*NET API (30 characters, 1-5 per question)
 */
function buildAnswerString(answers: AnswerRecord): string {
  const chars: string[] = [];
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    chars.push(String(answers[i] || 3));
  }
  return chars.join("");
}

/**
 * Get user's assessment progress
 */
export async function getAssessmentProgress(userId: string): Promise<{
  questionsAnswered: number;
  totalQuestions: number;
  percentComplete: number;
  isComplete: boolean;
}> {
  const assessment = await db.assessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const questionsAnswered = assessment?.questionsAnswered || 0;

  return {
    questionsAnswered,
    totalQuestions: TOTAL_QUESTIONS,
    percentComplete: Math.round((questionsAnswered / TOTAL_QUESTIONS) * 100),
    isComplete: assessment?.isComplete || false,
  };
}

/**
 * Reset user's assessment to start fresh
 */
export async function resetAssessment(userId: string): Promise<void> {
  await db.assessment.deleteMany({
    where: { userId },
  });
}

/**
 * Get all questions for full assessment
 */
export async function getAllQuestions(): Promise<RiasecQuestion[]> {
  return db.riasecQuestion.findMany({
    orderBy: { index: "asc" },
  });
}

/**
 * Complete assessment and update with O*NET official scores
 */
export async function completeAssessment(userId: string): Promise<boolean> {
  const assessment = await db.assessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!assessment?.answersJson) {
    return false;
  }

  const answers = assessment.answersJson as AnswerRecord;
  const scores = await getOnetScores(answers);

  if (!scores) {
    return false;
  }

  await db.assessment.update({
    where: { id: assessment.id },
    data: {
      ...scores,
      isComplete: true,
      completedAt: new Date(),
    },
  });

  return true;
}
