"use server";

import { submitQuestionAnswer } from "@/lib/questions";
import {
  consumeCrosswordHint,
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

export async function getCrosswordHint(
  crosswordId: string,
  userGrid: string[][]
) {
  return consumeCrosswordHint(crosswordId, userGrid);
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
