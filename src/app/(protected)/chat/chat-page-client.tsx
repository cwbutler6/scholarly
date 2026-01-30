"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { ArrowUp, Lightbulb, TrendingUp, MessageCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChatLogic } from "@/hooks/use-ai-chat";
import { useSetHeaderActions } from "@/components/header";

interface ChatPageClientProps {
  firstName: string;
}

const suggestionCards = [
  {
    icon: Lightbulb,
    iconColor: "text-purple-600",
    bgColor: "bg-[#FFF8E6]",
    borderColor: "border-[#FFE4A0]",
    prompt: "Help me discover careers that match my interests and strengths",
  },
  {
    icon: TrendingUp,
    iconColor: "text-pink-500",
    bgColor: "bg-[#FFF8E6]",
    borderColor: "border-[#FFE4A0]",
    prompt: "What are the highest-paying careers for Gen Z right now?",
  },
  {
    icon: MessageCircle,
    iconColor: "text-blue-500",
    bgColor: "bg-[#FFF8E6]",
    borderColor: "border-[#FFE4A0]",
    prompt: "Let's setup a mock interview!",
  },
];

function NewChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
    >
      <RotateCcw className="h-4 w-4" />
      New Chat
    </button>
  );
}

export function ChatPageClient({ firstName }: ChatPageClientProps) {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    messagesEndRef,
    inputRef,
    handleSubmit,
    handleSuggestionClick,
    handleClearChat,
    handleKeyDown,
    getTextContent,
  } = useAiChatLogic();

  const headerActions = useMemo(
    () =>
      messages.length > 0 ? <NewChatButton onClick={handleClearChat} /> : null,
    [messages.length, handleClearChat]
  );
  useSetHeaderActions(headerActions);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
        {messages.length === 0 ? (
          <div className="flex w-full max-w-3xl flex-col items-center">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              Hey {firstName} 👋
            </h1>
            <p className="mb-12 text-2xl text-gray-400">
              What&apos;s on your mind?
            </p>

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              {suggestionCards.map((card, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(card.prompt)}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all hover:shadow-md",
                    card.bgColor,
                    card.borderColor
                  )}
                >
                  <card.icon className={cn("h-6 w-6", card.iconColor)} />
                  <p className="text-sm leading-relaxed text-gray-700">
                    {card.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <div className="space-y-6 py-4">
              {messages.map((message) => {
                const textContent = getTextContent(message);

                if (!textContent) return null;

                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-3xl bg-[#2F2F2F] px-4 py-3 text-white">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {textContent}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className="prose prose-sm max-w-none text-gray-900 prose-headings:font-semibold prose-headings:text-gray-900 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5"
                  >
                    <ReactMarkdown>{textContent}</ReactMarkdown>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex space-x-1 py-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 w-full bg-white px-6 pb-10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              title="Attach file"
              className="mb-0.5 shrink-0 text-gray-400 hover:text-gray-600"
            >
              <Image
                src="/images/icon-attach.svg"
                alt="Attach"
                width={20}
                height={20}
                className="opacity-60"
              />
            </button>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your Mentor"
              rows={1}
              className="max-h-[150px] min-h-[24px] flex-1 resize-none border-none bg-transparent text-[15px] leading-normal text-gray-900 shadow-none placeholder:text-gray-400"
              style={{ outline: "none" }}
            />
            <button
              type="submit"
              title="Send message"
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                inputValue.trim() && !isLoading
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
