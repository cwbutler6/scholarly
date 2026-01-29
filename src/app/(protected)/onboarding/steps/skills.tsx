"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSkills } from "../actions";

interface SkillsStepProps {
  onBack: () => void;
}

const skillOptions = [
  "Problem Solving",
  "Communication",
  "Leadership",
  "Teamwork",
  "Critical Thinking",
  "Creativity",
  "Time Management",
  "Data Analysis",
  "Public Speaking",
  "Writing",
  "Research",
  "Project Management",
  "Technical Skills",
  "Customer Service",
  "Sales",
  "Marketing",
  "Design",
  "Programming",
  "Mathematics",
  "Science",
];

export function SkillsStep({ onBack }: SkillsStepProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelected((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleComplete = async () => {
    if (selected.length < 3) return;
    
    setIsSaving(true);
    await saveSkills(selected);
    setIsSaving(false);
    router.push("/dashboard");
  };

  const isValid = selected.length >= 3;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Skills & Interests
        </h1>
        <p className="mb-8 text-gray-500">Select at least 3 skills or interests</p>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {skillOptions.map((skill) => {
            const isSelected = selected.includes(skill);
            return (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-orange-400 bg-orange-400 text-white"
                    : "border-blue-200 bg-blue-50 text-gray-700 hover:border-blue-300"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleComplete}
            disabled={!isValid || isSaving}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isValid
                ? "bg-[#00B2FF] text-white hover:bg-[#00A0E6]"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-400">
          {selected.length} selected {selected.length < 3 && `(need ${3 - selected.length} more)`}
        </p>
      </div>
    </div>
  );
}
