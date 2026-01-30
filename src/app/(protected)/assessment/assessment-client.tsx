"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getAssessmentData,
  saveAssessmentAnswer,
  resetAssessment,
} from "./actions";

interface Question {
  id: string;
  index: number;
  text: string;
  area: string;
}

const ratings = [
  { value: 1, label: "Strongly\nDislike", image: "/images/emoji-strongly-dislike.svg" },
  { value: 2, label: "Dislike", image: "/images/emoji-dislike.svg" },
  { value: 3, label: "Unsure", image: "/images/emoji-unsure.svg" },
  { value: 4, label: "Like", image: "/images/emoji-like.svg" },
  { value: 5, label: "Strongly\nLike", image: "/images/emoji-strongly-like.svg" },
];

export function AssessmentClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await getAssessmentData();
      setQuestions(data.allQuestions);
      setAnswers(data.answers);
      const answeredCount = Object.keys(data.answers).length;
      const startAt = Math.min(answeredCount, data.allQuestions.length - 1);
      setCurrentIndex(startAt);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }

  const handleAnswer = async (value: number) => {
    const currentQuestion = questions[currentIndex];
    const newAnswers = { ...answers, [currentQuestion.index]: value };
    setAnswers(newAnswers);
    setIsSaving(true);

    try {
      const result = await saveAssessmentAnswer(currentQuestion.index, value);

      if (result.isComplete) {
        router.push("/dashboard");
      } else if (currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      router.push("/dashboard");
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      await resetAssessment();
      const data = await getAssessmentData();
      setQuestions(data.allQuestions);
      setAnswers({});
      setCurrentIndex(0);
      setShowResetConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-gray-500">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="mb-4 text-gray-500">Assessment complete!</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg bg-gray-900 px-6 py-2 text-white"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalAnswered = Object.keys(answers).length;
  const progress = (totalAnswered / 30) * 100;
  const remaining = 30 - totalAnswered;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl text-center">
        <h1 className="mb-1 text-xl font-bold text-gray-900 md:text-2xl">
          Complete Your Assessment
        </h1>
        <p className="mb-4 text-sm text-gray-500 md:mb-6">
          {remaining > 0 ? `${remaining} questions remaining` : "Almost done!"}
        </p>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200 md:mb-8">
          <div
            className="h-full bg-[#00B2FF] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="mb-8 text-lg font-bold text-gray-900 md:mb-12 md:text-xl">
          {currentQuestion.text}
        </h2>

        <div className="flex justify-center gap-2 sm:gap-4 md:gap-8">
          {ratings.map((rating) => (
            <button
              key={rating.value}
              onClick={() => handleAnswer(rating.value)}
              disabled={isSaving}
              className={`flex flex-col items-center transition-transform hover:scale-110 ${
                answers[currentQuestion.index] === rating.value ? "scale-110" : ""
              }`}
            >
              <Image
                src={rating.image}
                alt={rating.label.replace("\n", " ")}
                width={80}
                height={80}
                className="mb-1 h-12 w-12 object-contain sm:h-16 sm:w-16 md:mb-2 md:h-20 md:w-20"
              />
              <span className="whitespace-pre-line text-[10px] text-gray-600 sm:text-xs">
                {rating.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 md:mt-16">
          <button
            onClick={handleBack}
            disabled={isSaving}
            aria-label={currentIndex > 0 ? "Previous question" : "Go to dashboard"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700 disabled:opacity-50 md:h-12 md:w-12"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-400 md:mt-4">
          {currentIndex + 1} of 30
        </p>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="mt-6 text-sm text-gray-400 underline hover:text-gray-600"
        >
          Start Over
        </button>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Start Over?</h3>
            <p className="mb-6 text-sm text-gray-500">
              This will reset all your answers and you&apos;ll need to answer all 30 questions again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSaving ? "Resetting..." : "Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
