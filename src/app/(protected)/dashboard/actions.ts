"use server";

import { submitQuestionAnswer } from "@/lib/questions";
import {
  useCrosswordHint,
  submitCrossword,
  resetCrossword,
  saveCrosswordProgress,
} from "@/lib/crossword";

export async function submitQOTDAnswer(
  questionId: string,
  selectedAnswer: number
) {
  return submitQuestionAnswer(questionId, selectedAnswer);
}

export async function useCrosswordHintAction(
  crosswordId: string,
  userGrid: string[][]
) {
  return useCrosswordHint(crosswordId, userGrid);
}

export async function submitCrosswordAction(
  crosswordId: string,
  userGrid: string[][]
) {
  return submitCrossword(crosswordId, userGrid);
}

export async function resetCrosswordAction(crosswordId: string) {
  return resetCrossword(crosswordId);
}

export async function saveCrosswordProgressAction(
  crosswordId: string,
  userGrid: string[][]
) {
  return saveCrosswordProgress(crosswordId, userGrid);
}
