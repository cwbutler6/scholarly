"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const STORAGE_KEY = "ai-chat-messages";

const transport = new DefaultChatTransport({
  api: "/api/chat",
});

export function useAiChatLogic() {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isHydratedRef = useRef(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    isHydratedRef.current = true;
  }, [setMessages]);

  useEffect(() => {
    if (isHydratedRef.current && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      const message = inputValue.trim();
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
      await sendMessage({ text: message });
    },
    [inputValue, isLoading, sendMessage]
  );

  const handleSuggestionClick = useCallback(
    async (prompt: string) => {
      await sendMessage({ text: prompt });
    },
    [sendMessage]
  );

  const handleClearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [setMessages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const adjustTextareaHeight = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const getTextContent = useCallback(
    (message: (typeof messages)[0]) =>
      message.parts
        ?.filter(
          (part): part is { type: "text"; text: string } => part.type === "text"
        )
        .map((part) => part.text)
        .join("") || "",
    []
  );

  return {
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
  };
}
