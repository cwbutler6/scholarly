"use client";

import { useState } from "react";
import Image from "next/image";
import { saveAssessment } from "../actions";

interface AssessmentStepProps {
  initialAnswers?: Record<number, number>;
  initialIndex?: number;
  onProgress?: (answers: Record<number, number>, index: number) => void;
  onComplete: () => void;
  onBack: () => void;
}

const riasecQuestions = [
  { id: 1, text: "Build kitchen cabinets", category: "R" },
  { id: 2, text: "Stamp, sort, and distribute mail for an organization", category: "C" },
  { id: 3, text: "Fix a broken faucet", category: "R" },
  { id: 4, text: "Assemble electronic parts", category: "R" },
  { id: 5, text: "Study the structure of the human body", category: "I" },
  { id: 6, text: "Develop a new medicine", category: "I" },
  { id: 7, text: "Conduct chemical experiments", category: "I" },
  { id: 8, text: "Study animal behavior", category: "I" },
  { id: 9, text: "Compose or arrange music", category: "A" },
  { id: 10, text: "Draw pictures", category: "A" },
  { id: 11, text: "Create special effects for movies", category: "A" },
  { id: 12, text: "Paint sets for plays", category: "A" },
  { id: 13, text: "Help people with personal or emotional problems", category: "S" },
  { id: 14, text: "Teach children how to read", category: "S" },
  { id: 15, text: "Work with mentally disabled children", category: "S" },
  { id: 16, text: "Teach sign language to people with hearing disabilities", category: "S" },
  { id: 17, text: "Sell merchandise at a department store", category: "E" },
  { id: 18, text: "Manage a department within a large company", category: "E" },
  { id: 19, text: "Start your own business", category: "E" },
  { id: 20, text: "Negotiate business contracts", category: "E" },
  { id: 21, text: "Keep shipping and receiving records", category: "C" },
  { id: 22, text: "Proofread records or forms", category: "C" },
  { id: 23, text: "Calculate the wages of employees", category: "C" },
  { id: 24, text: "Inventory supplies using a hand-held computer", category: "C" },
];

const ratings = [
  { value: 1, label: "Strongly\nDislike", image: "/images/emoji-strongly-dislike.svg" },
  { value: 2, label: "Dislike", image: "/images/emoji-dislike.svg" },
  { value: 3, label: "Unsure", image: "/images/emoji-unsure.svg" },
  { value: 4, label: "Like", image: "/images/emoji-like.svg" },
  { value: 5, label: "Strongly\nLike", image: "/images/emoji-strongly-like.svg" },
];

export function AssessmentStep({
  initialAnswers = {},
  initialIndex = 0,
  onProgress,
  onComplete,
  onBack,
}: AssessmentStepProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers);
  const [isSaving, setIsSaving] = useState(false);

  const currentQuestion = riasecQuestions[currentIndex];
  const progress = ((currentIndex + 1) / riasecQuestions.length) * 100;

  const handleAnswer = async (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentIndex < riasecQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      onProgress?.(newAnswers, nextIndex);
      setTimeout(() => setCurrentIndex(nextIndex), 300);
    } else {
      setIsSaving(true);
      const scores = calculateScores(newAnswers);
      await saveAssessment(scores);
      setIsSaving(false);
      onComplete();
    }
  };

  const calculateScores = (ans: Record<number, number>) => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    riasecQuestions.forEach((q) => {
      const answer = ans[q.id];
      if (answer) {
        scores[q.category as keyof typeof scores] += answer;
      }
    });
    return scores;
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
                answers[currentQuestion.id] === rating.value ? "scale-110" : ""
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

        <div className="mt-10 flex justify-center gap-4 md:mt-16">
          <button
            onClick={onBack}
            aria-label="Go back to profile"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700 md:h-12 md:w-12"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {currentIndex > 0 && (
            <button
              onClick={() => {
                const prevIndex = currentIndex - 1;
                setCurrentIndex(prevIndex);
                onProgress?.(answers, prevIndex);
              }}
              aria-label="Previous question"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 md:h-12 md:w-12"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-400 md:mt-4">
          {currentIndex + 1} of {riasecQuestions.length}
        </p>
      </div>
    </div>
  );
}
