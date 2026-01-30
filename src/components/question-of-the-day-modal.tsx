"use client";

import { useState, useTransition } from "react";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/lib/posthog";

interface QuestionOption {
  number: number;
  text: string;
  emoji: string;
}

interface QuestionOfTheDayModalProps {
  question: {
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
  };
  onClose: () => void;
  onSubmit: (
    questionId: string,
    answer: number
  ) => Promise<{
    isCorrect: boolean;
    correctAnswer: number;
    funFactHeader: string | null;
    funFactText: string | null;
  }>;
}

const optionEmojis = ["🔢", "✍️", "💻", "🌍"];

export function QuestionOfTheDayModal({
  question,
  onClose,
  onSubmit,
}: QuestionOfTheDayModalProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(
    question.userAnswer?.selectedAnswerOption ?? null
  );
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    funFactHeader: string | null;
    funFactText: string | null;
  } | null>(
    question.userAnswer
      ? {
          isCorrect: question.userAnswer.isCorrect,
          correctAnswer: question.userAnswer.selectedAnswerOption,
          funFactHeader: null,
          funFactText: null,
        }
      : null
  );
  const [isPending, startTransition] = useTransition();
  const { track } = useAnalytics();

  const options: QuestionOption[] = [
    { number: 1, text: question.option1, emoji: optionEmojis[0] },
    { number: 2, text: question.option2, emoji: optionEmojis[1] },
    { number: 3, text: question.option3, emoji: optionEmojis[2] },
    { number: 4, text: question.option4, emoji: optionEmojis[3] },
  ];

  const formattedDate = new Date(question.createdAt).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const hasAnswered = result !== null;

  const handleSubmit = () => {
    if (selectedOption === null || hasAnswered) return;

    startTransition(async () => {
      const answerResult = await onSubmit(question.id, selectedOption);
      setResult(answerResult);
      track("qotd_answered", {
        questionId: question.id,
        selectedAnswer: selectedOption,
        isCorrect: answerResult.isCorrect,
      });
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-linear-to-r from-[#E879F9] to-[#FB7185] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Question of the Day
                </h2>
                <p className="text-sm text-white/80">{formattedDate}</p>
              </div>
            </div>
            <button
              title="Close"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            {question.questionText}
          </h3>

          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedOption === option.number;
              const isCorrectAnswer =
                hasAnswered && result?.correctAnswer === option.number;
              const isWrongSelection =
                hasAnswered && isSelected && !result?.isCorrect;

              return (
                <button
                  key={option.number}
                  onClick={() => !hasAnswered && setSelectedOption(option.number)}
                  disabled={hasAnswered || isPending}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    !hasAnswered && isSelected
                      ? "border-purple-500 bg-purple-50"
                      : !hasAnswered
                        ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        : "",
                    isCorrectAnswer && "border-green-500 bg-green-50",
                    isWrongSelection && "border-red-500 bg-red-50",
                    hasAnswered &&
                      !isCorrectAnswer &&
                      !isWrongSelection &&
                      "border-gray-200 opacity-60"
                  )}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium",
                      isCorrectAnswer && "text-green-700",
                      isWrongSelection && "text-red-700",
                      !isCorrectAnswer && !isWrongSelection && "text-gray-700"
                    )}
                  >
                    {option.text}
                  </span>
                  {isCorrectAnswer && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {isWrongSelection && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </button>
              );
            })}
          </div>

          {!hasAnswered && (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null || isPending}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-center font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Answer"}
            </button>
          )}

          {hasAnswered && result && (
            <div
              className={cn(
                "mt-6 rounded-xl p-4",
                result.isCorrect ? "bg-green-50" : "bg-orange-50"
              )}
            >
              <div className="flex items-center gap-2">
                {result.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-700">
                      Correct! Great job!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-orange-700">
                      Not quite! The correct answer was option{" "}
                      {result.correctAnswer}.
                    </span>
                  </>
                )}
              </div>
              {result.funFactHeader && result.funFactText && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {result.funFactHeader}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {result.funFactText}
                  </p>
                </div>
              )}
            </div>
          )}

          {question.hint && !hasAnswered && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>💡</span>
              <span>Tip: {question.hint}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
