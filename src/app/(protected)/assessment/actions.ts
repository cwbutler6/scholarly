"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  getAllQuestions,
  getRemainingQuestions,
  saveAnswers,
  resetAssessment as resetAssessmentService,
  getAssessmentProgress,
} from "@/lib/assessment";

export async function getAssessmentData() {
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

  const [allQuestions, remainingQuestions, progress, assessment] = await Promise.all([
    getAllQuestions(),
    getRemainingQuestions(user.id),
    getAssessmentProgress(user.id),
    db.assessment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    allQuestions,
    remainingQuestions,
    progress,
    answers: (assessment?.answersJson as Record<number, number>) || {},
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

  const result = await saveAnswers(user.id, { [questionIndex]: value });
  return result;
}

export async function resetAssessment() {
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

  await resetAssessmentService(user.id);
  revalidatePath("/assessment");
  revalidatePath("/dashboard");
}
