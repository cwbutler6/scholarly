"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AiChatDrawer } from "./ai-chat-drawer";

interface AiChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export function useAiChat() {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error("useAiChat must be used within an AiChatProvider");
  }
  return context;
}

interface AiChatProviderProps {
  children: ReactNode;
}

export function AiChatProvider({ children }: AiChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  return (
    <AiChatContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
      <AiChatDrawer isOpen={isOpen} onClose={closeChat} />
    </AiChatContext.Provider>
  );
}
