import { db } from "./db";
import { getOrCreateUser } from "./user";

export interface QuestionWithUserAnswer {
  id: string;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  hint: string | null;
  createdAt: Date;
  userAnswer?: {
    selectedAnswerOption: number;
    isCorrect: boolean;
  } | null;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: number;
  funFactHeader: string | null;
  funFactText: string | null;
}

export async function getTodaysQuestion(): Promise<QuestionWithUserAnswer | null> {
  const user = await getOrCreateUser();
  
  const question = await db.question.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      questionText: true,
      option1: true,
      option2: true,
      option3: true,
      option4: true,
      hint: true,
      createdAt: true,
      answers: user ? {
        where: { userId: user.id },
        select: {
          selectedAnswerOption: true,
          isCorrect: true,
        },
      } : false,
    },
  });

  if (!question) return null;

  return {
    ...question,
    userAnswer: user && question.answers && question.answers.length > 0 
      ? question.answers[0] 
      : null,
  };
}

export async function submitQuestionAnswer(
  questionId: string,
  selectedAnswer: number
): Promise<AnswerResult> {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  if (selectedAnswer < 1 || selectedAnswer > 4) {
    throw new Error("Selected answer must be between 1 and 4");
  }

  const question = await db.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  await db.questionAnswer.upsert({
    where: {
      questionId_userId: {
        questionId,
        userId: user.id,
      },
    },
    update: {
      selectedAnswerOption: selectedAnswer,
      isCorrect,
    },
    create: {
      questionId,
      userId: user.id,
      selectedAnswerOption: selectedAnswer,
      isCorrect,
    },
  });

  return {
    isCorrect,
    correctAnswer: question.correctAnswer,
    funFactHeader: question.funFactHeader,
    funFactText: question.funFactText,
  };
}

export async function getUserQuestionAnswer(questionId: string) {
  const user = await getOrCreateUser();
  if (!user) return null;

  return db.questionAnswer.findUnique({
    where: {
      questionId_userId: {
        questionId,
        userId: user.id,
      },
    },
    include: {
      question: true,
    },
  });
}
