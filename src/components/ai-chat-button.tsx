"use client";

import Image from "next/image";
import { useAiChat } from "./ai-chat-provider";

export function AiChatButton() {
  const { openChat } = useAiChat();

  return (
    <button
      onClick={openChat}
      className="flex h-12 items-center gap-2.5 rounded-[24px] bg-linear-to-r from-[#FFEB7B] to-[#FE9900] py-[5px] pl-[5px] pr-5 font-medium text-gray-900 shadow-sm transition-all hover:shadow-md"
    >
      <Image
        src="/images/ai-chat-orb.png"
        alt=""
        width={38}
        height={38}
        className="h-[38px] w-[38px] rounded-full"
      />
      <span>AI Chat</span>
      <Image
        src="/images/ai-chat-icon.svg"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5"
      />
    </button>
  );
}
