"use client";

import { useState } from "react";
import Image from "next/image";
import { QuestionOfTheDayModal } from "@/components/question-of-the-day-modal";
import { CrosswordChallengeModal } from "@/components/crossword-challenge-modal";
import { StreakModal } from "@/components/streak-modal";
import { useAnalytics } from "@/lib/posthog";
import type { QuestionWithUserAnswer, AnswerResult } from "@/lib/questions";
import type {
  CrosswordData,
  HintResult,
  SubmitResult,
} from "@/lib/crossword";
import type { StreakData } from "@/lib/streaks";

interface DashboardStreakCardProps {
  streak: StreakData | null;
}

export function DashboardStreakCard({ streak }: DashboardStreakCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { track } = useAnalytics();

  const handleOpenModal = () => {
    if (streak) {
      track("streak_modal_opened", { currentStreak: streak.currentStreak });
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={!streak}
        className="relative flex h-[180px] w-full flex-col rounded-2xl bg-[#F6F6F6] p-5 text-left transition-all hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-60 md:h-[252px]"
      >
        <span className="text-sm text-gray-500">Your</span>
        <span className="text-xl font-bold text-gray-900">Daily Streak</span>
        <Image
          src="/images/icon-streak.png"
          alt="Streak"
          width={140}
          height={140}
          className="absolute bottom-4 right-4 h-auto w-[100px] md:w-auto"
        />
      </button>

      {isModalOpen && streak && (
        <StreakModal streak={streak} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

interface DashboardQOTDCardProps {
  question: QuestionWithUserAnswer | null;
  submitAnswer: (questionId: string, answer: number) => Promise<AnswerResult>;
}

export function DashboardQOTDCard({
  question,
  submitAnswer,
}: DashboardQOTDCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(question);
  const { track } = useAnalytics();

  const handleOpenModal = () => {
    if (currentQuestion) {
      track("qotd_opened", { questionId: currentQuestion.id });
      setIsModalOpen(true);
    }
  };

  const handleSubmitAnswer = async (questionId: string, answer: number) => {
    const result = await submitAnswer(questionId, answer);
    setCurrentQuestion((prev) =>
      prev
        ? {
            ...prev,
            userAnswer: {
              selectedAnswerOption: answer,
              isCorrect: result.isCorrect,
            },
          }
        : null
    );
    return result;
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={!currentQuestion}
        className="relative flex h-[180px] w-full flex-col rounded-2xl bg-[#F6F6F6] p-5 text-left transition-all hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-60 md:h-[252px]"
      >
        <span className="text-sm text-gray-500">Today&apos;s</span>
        <span className="text-xl font-bold text-gray-900">Question</span>
        {!currentQuestion && (
          <span className="mt-2 text-xs text-gray-400">
            No question available
          </span>
        )}
        <Image
          src="/images/icon-question.png"
          alt="Question"
          width={140}
          height={140}
          className="absolute bottom-4 right-4 h-auto w-[100px] md:w-auto"
        />
      </button>

      {isModalOpen && currentQuestion && (
        <QuestionOfTheDayModal
          question={currentQuestion}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitAnswer}
        />
      )}
    </>
  );
}

interface DashboardChallengeCardProps {
  crossword: CrosswordData | null;
  onUseHint: (crosswordId: string, userGrid: string[][]) => Promise<HintResult>;
  onSubmit: (crosswordId: string, userGrid: string[][]) => Promise<SubmitResult>;
  onReset: (crosswordId: string) => Promise<void>;
  onSaveProgress: (crosswordId: string, userGrid: string[][]) => Promise<void>;
}

export function DashboardChallengeCard({
  crossword,
  onUseHint,
  onSubmit,
  onReset,
  onSaveProgress,
}: DashboardChallengeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCrossword, setCurrentCrossword] = useState(crossword);
  const { track } = useAnalytics();

  const handleOpenModal = () => {
    if (currentCrossword) {
      track("crossword_opened", { crosswordId: currentCrossword.id });
      setIsModalOpen(true);
    }
  };

  const handleReset = async (crosswordId: string) => {
    await onReset(crosswordId);
    setCurrentCrossword((prev) =>
      prev
        ? {
            ...prev,
            userProgress: null,
          }
        : null
    );
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={!currentCrossword}
        className="relative flex h-[180px] w-full flex-col rounded-2xl bg-[#F6F6F6] p-5 text-left transition-all hover:bg-[#EBEBEB] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 md:h-[252px] lg:col-span-1"
      >
        <span className="text-sm text-gray-500">Today&apos;s</span>
        <span className="text-xl font-bold text-gray-900">Challenge</span>
        {!currentCrossword && (
          <span className="mt-2 text-xs text-gray-400">
            No challenge available
          </span>
        )}
        <Image
          src="/images/icon-challenge.png"
          alt="Challenge"
          width={140}
          height={140}
          className="absolute bottom-4 right-4 h-auto w-[100px] md:w-auto"
        />
      </button>

      {isModalOpen && currentCrossword && (
        <CrosswordChallengeModal
          crossword={currentCrossword}
          onClose={() => setIsModalOpen(false)}
          onUseHint={onUseHint}
          onSubmit={onSubmit}
          onReset={handleReset}
          onSaveProgress={onSaveProgress}
        />
      )}
    </>
  );
}
