"use client";

import Image from "next/image";
import { useAiChat } from "./ai-chat-provider";
import { useAnalytics } from "@/lib/posthog";

export function AiChatButton() {
  const { openChat } = useAiChat();
  const { track } = useAnalytics();

  const handleClick = () => {
    track("chat_opened", {});
    openChat();
  };

  return (
    <button
      onClick={handleClick}
      className="flex h-11 items-center gap-2 rounded-[24px] bg-linear-to-r from-[#FFEB7B] to-[#FE9900] p-1 font-medium text-gray-900 shadow-sm transition-all hover:shadow-md md:h-12 md:gap-2.5 md:py-[5px] md:pl-[5px] md:pr-5"
    >
      <Image
        src="/images/ai-chat-orb.png"
        alt=""
        width={38}
        height={38}
        className="h-[34px] w-[34px] rounded-full md:h-[38px] md:w-[38px]"
      />
      <span className="hidden md:inline">AI Chat</span>
      <Image
        src="/images/ai-chat-icon.svg"
        alt=""
        width={20}
        height={20}
        className="hidden h-5 w-5 md:block"
      />
    </button>
  );
}
