"use client";

import { useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiChatLogic } from "@/hooks/use-ai-chat";

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestionPrompts = [
  "What's the best way to explore careers on this platform?",
  "How can I improve my career match score?",
];

export function AiChatDrawer({ isOpen, onClose }: AiChatDrawerProps) {
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, inputRef]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-white/20 backdrop-blur-[10px]"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed right-4 top-[97px] z-50 flex h-[908px] max-h-[calc(100vh-120px)] w-[454px] flex-col bg-white transition-transform duration-300 ease-in-out",
          "rounded-3xl border border-black/15 shadow-[0_4px_12px_0_rgba(0,0,0,0.12)]",
          isOpen ? "translate-x-0" : "translate-x-[calc(100%+16px)]"
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-medium leading-none text-[#989898]">
            Conversation with AI Mentor
          </h2>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                title="New chat"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 text-gray-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Start a conversation with your AI Mentor
              </p>
            </div>
          ) : (
            <div className="space-y-6">
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
                  <div key={message.id} className="prose prose-sm max-w-none text-gray-900 prose-headings:font-semibold prose-headings:text-gray-900 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
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
          )}
        </div>

        {messages.length === 0 && (
          <div className="flex gap-2.5 overflow-x-auto px-6 pb-4">
            {suggestionPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(prompt)}
                className="w-[250px] shrink-0 rounded-2xl bg-[#F6F6F6] p-4 text-left text-base font-normal leading-none text-[#898989] transition-colors hover:bg-gray-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4">
          <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
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
    </>
  );
}
