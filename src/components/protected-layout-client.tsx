"use client";

import { ReactNode } from "react";
import { AiChatProvider } from "./ai-chat-provider";

interface ProtectedLayoutClientProps {
  children: ReactNode;
}

export function ProtectedLayoutClient({ children }: ProtectedLayoutClientProps) {
  return <AiChatProvider>{children}</AiChatProvider>;
}
