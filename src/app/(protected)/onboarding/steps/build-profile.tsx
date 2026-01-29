"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ProfileData {
  name: string;
  email: string;
  location: string;
  birthDate: string;
}

interface BuildProfileStepProps {
  profileData: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
  onComplete: () => void;
  onBack: () => void;
}

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  content: string;
  field?: keyof ProfileData;
};

const questions: { field: keyof ProfileData; question: string; placeholder: string }[] = [
  { field: "name", question: "What should we call you?", placeholder: "Enter your first and last name" },
  { field: "email", question: "What's a good email to use to reach you?", placeholder: "Enter your email address" },
  { field: "location", question: "Where are you located? (not to be creepy)", placeholder: "Search for your city and state" },
  { field: "birthDate", question: "How old are you? (or we can ask for birth date)", placeholder: "Enter your age (or birth date)" },
];

export function BuildProfileStep({
  profileData,
  updateProfile,
  onComplete,
  onBack,
}: BuildProfileStepProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            id: "q-0",
            role: "bot",
            content: questions[0].question,
            field: questions[0].field,
          },
        ]);
      }, 500);
    }
  }, [messages.length]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];
    
    setMessages((prev) => [
      ...prev,
      { id: `a-${currentQuestionIndex}`, role: "user", content: inputValue },
    ]);

    updateProfile({ [currentQuestion.field]: inputValue });

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setTimeout(() => {
        const responses = ["Nice to meet you, " + inputValue.split(" ")[0] + "!", "Got it!", "Nice!", "Perfect!"];
        setMessages((prev) => [
          ...prev,
          { id: `r-${currentQuestionIndex}`, role: "bot", content: responses[currentQuestionIndex] || "Got it!" },
          { id: `q-${nextIndex}`, role: "bot", content: questions[nextIndex].question, field: questions[nextIndex].field },
        ]);
        setCurrentQuestionIndex(nextIndex);
      }, 300);
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: "complete", role: "bot", content: "Awesome! You're all set. Let's move on to the assessment!" },
        ]);
        setIsComplete(true);
      }, 300);
    }

    setInputValue("");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Help us to build your profile
            </h1>
            <p className="text-gray-500">
              Answer a few questions (we promise it&apos;s not a lot!)
            </p>
          </div>

          <div className="space-y-4 pb-32">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "bot" && (
                  <div className="mr-2 flex-shrink-0">
                    <Image
                      src="/images/logo-scholarly.svg"
                      alt="Bot"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-[#00B2FF] text-white"
                      : "border border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-3">
          {!isComplete ? (
            <>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={questions[currentQuestionIndex]?.placeholder || "Type your response..."}
                className="flex-1 rounded-full border border-gray-300 px-4 py-3 focus:border-[#00B2FF] focus:outline-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00B2FF] text-white transition-colors hover:bg-[#00A0E6] disabled:bg-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex w-full justify-center gap-4">
              <button
                onClick={onBack}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onComplete}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00B2FF] text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
