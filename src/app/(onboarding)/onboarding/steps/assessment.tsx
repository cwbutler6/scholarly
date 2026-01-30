"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getAssessmentQuestions,
  getAssessmentState,
  saveAssessmentAnswer,
} from "../actions";
import { useAnalytics } from "@/lib/posthog";

interface AssessmentStepProps {
  onComplete: () => void;
  onBack: () => void;
}

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

export function AssessmentStep({ onComplete, onBack }: AssessmentStepProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { track } = useAnalytics();

  useEffect(() => {
    async function loadState() {
      try {
        const [questionsData, stateData] = await Promise.all([
          getAssessmentQuestions(),
          getAssessmentState(),
        ]);
        setQuestions(questionsData);
        setAnswers(stateData.answers);
        const startIndex = Math.min(stateData.currentIndex, questionsData.length - 1);
        setCurrentIndex(Math.max(0, startIndex));
      } catch {
        // Failed to load
      } finally {
        setIsLoading(false);
      }
    }
    loadState();
  }, []);

  useEffect(() => {
    if (currentIndex === 0 && Object.keys(answers).length === 0 && questions.length > 0) {
      track("assessment_started", { type: "riasec" });
    }
  }, [questions.length, currentIndex, answers, track]);

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
        <p className="text-gray-500">No questions available. Please try again later.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = async (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.index]: value };
    setAnswers(newAnswers);
    setIsSaving(true);

    try {
      await saveAssessmentAnswer(currentQuestion.index, value);

      if (currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
      } else {
        track("assessment_partial_complete", { type: "riasec", questionsAnswered: 6 });
        onComplete();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl text-center">
        <h1 className="mb-1 text-xl font-bold text-gray-900 md:text-2xl">Assessment</h1>
        <p className="mb-4 text-sm text-gray-500 md:mb-6">
          Answer a few questions<br />(we promise it&apos;s not a lot!)
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

        <div className="mt-10 flex justify-center md:mt-16">
          <button
            onClick={handleBack}
            disabled={isSaving}
            aria-label={currentIndex > 0 ? "Previous question" : "Go back to profile"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700 disabled:opacity-50 md:h-12 md:w-12"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-400 md:mt-4">
          {currentIndex + 1} of {questions.length}
        </p>
      </div>
    </div>
  );
}
