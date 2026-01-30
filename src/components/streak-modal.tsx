"use client";

import { X } from "lucide-react";

interface StreakModalProps {
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    globalRankPercentile: number | null;
  };
  onClose: () => void;
}

export function StreakModal({ streak, onClose }: StreakModalProps) {
  const getMessage = () => {
    if (streak.currentStreak >= 100)
      return "You're on fire! Keep the momentum going!";
    if (streak.currentStreak >= 30) return "Amazing dedication! Keep pushing!";
    if (streak.currentStreak >= 7) return "Great start! You're building a habit!";
    if (streak.currentStreak >= 1) return "Every day counts! Keep it up!";
    return "Start your streak today!";
  };

  const formatRank = (percentile: number | null) => {
    if (percentile === null) return "—";
    return `Top ${percentile}%`;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-[720px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] shadow-2xl sm:w-full">
        <div
          className="relative flex flex-col items-center px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10"
          style={{
            background: "linear-gradient(180deg, #4FACFE 0%, #66A6FF 100%)",
          }}
        >
          <button
            title="Close"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 sm:right-4 sm:top-4"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-2 flex h-16 w-16 items-center justify-center sm:mb-4 sm:h-20 sm:w-20">
            <span className="text-5xl sm:text-6xl">🔥</span>
          </div>

          <div className="text-center">
            <div className="text-[48px] font-bold leading-[48px] text-white sm:text-[64px] sm:leading-[64px]">
              {streak.currentStreak}
            </div>
            <div className="mt-1 text-[20px] font-semibold leading-[30px] text-white sm:text-[24px] sm:leading-[36px]">
              Day Streak
            </div>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              {getMessage()}
            </p>
          </div>

          <div className="mt-6 grid w-full grid-cols-3 gap-2 sm:mt-8 sm:gap-3 sm:px-4">
            <div className="flex flex-col items-center justify-center gap-[6px] rounded-[16px] bg-white/20 px-2 py-3 sm:px-4 sm:py-4">
              <span className="text-xl font-bold text-white sm:text-2xl">
                {streak.longestStreak}
              </span>
              <span className="text-center text-[10px] text-white/80 sm:text-xs">
                Longest Streak
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-[6px] rounded-[16px] bg-white/20 px-2 py-3 sm:px-4 sm:py-4">
              <span className="text-xl font-bold text-white sm:text-2xl">
                {streak.totalActiveDays}
              </span>
              <span className="text-center text-[10px] text-white/80 sm:text-xs">
                Total Active Days
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-[6px] rounded-[16px] bg-white/20 px-2 py-3 sm:px-4 sm:py-4">
              <span className="text-xl font-bold text-white sm:text-2xl">
                {formatRank(streak.globalRankPercentile)}
              </span>
              <span className="text-center text-[10px] text-white/80 sm:text-xs">
                Global Rank
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B] px-4 py-3 text-center">
          <p className="text-xs text-gray-300 sm:text-sm">
            Pro tip: Complete today&apos;s challenge to extend your streak!
          </p>
        </div>
      </div>
    </>
  );
}
