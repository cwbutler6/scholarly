"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  getOnboardingQuestions,
  saveAnswers as saveAssessmentAnswers,
} from "@/lib/assessment";

interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export async function getAssessmentQuestions() {
  return getOnboardingQuestions();
}

export async function getAssessmentState() {
  const { userId } = await auth();
  if (!userId) {
    return { answers: {}, currentIndex: 0 };
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return { answers: {}, currentIndex: 0 };
  }

  const assessment = await db.assessment.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const answers = (assessment?.answersJson as Record<number, number>) || {};
  const answeredCount = Object.keys(answers).length;

  return {
    answers,
    currentIndex: answeredCount,
  };
}

export async function saveAssessmentAnswer(
  questionIndex: number,
  value: number
) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const result = await saveAssessmentAnswers(user.id, { [questionIndex]: value });
  return result;
}

export async function saveAssessmentWithAnswers(
  answers: Record<number, number>
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const result = await saveAssessmentAnswers(user.id, answers);
  revalidatePath("/dashboard");
  return result;
}

export async function saveAssessment(scores: RiasecScores) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await db.assessment.upsert({
    where: {
      id: `${user.id}-riasec`,
    },
    update: {
      realistic: scores.R,
      investigative: scores.I,
      artistic: scores.A,
      social: scores.S,
      enterprising: scores.E,
      conventional: scores.C,
      questionsAnswered: 6,
      isComplete: false,
    },
    create: {
      id: `${user.id}-riasec`,
      userId: user.id,
      type: "riasec",
      realistic: scores.R,
      investigative: scores.I,
      artistic: scores.A,
      social: scores.S,
      enterprising: scores.E,
      conventional: scores.C,
      questionsAnswered: 6,
      isComplete: false,
    },
  });

  revalidatePath("/dashboard");
}

export async function saveSkills(skills: string[]) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // For MVP, store skills in user metadata or a separate table
  // For now, we'll just log and continue - skills table can be added later
  console.log(`Saved skills for user ${user.id}:`, skills);

  await db.user.update({
    where: { clerkId: userId },
    data: { onboardingComplete: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
}

export async function updateUserProfile(data: {
  name?: string;
  email?: string;
  location?: string;
  birthDate?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const nameParts = data.name?.split(" ") || [];
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(" ") || null;

  await db.user.update({
    where: { clerkId: userId },
    data: {
      firstName,
      lastName,
    },
  });

  revalidatePath("/dashboard");
}
