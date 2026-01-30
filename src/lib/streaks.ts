"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "./db";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: Date | null;
  globalRankPercentile: number | null;
}

export async function getStreakData(): Promise<StreakData | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      currentStreak: true,
      longestStreak: true,
      totalActiveDays: true,
      lastActiveDate: true,
    },
  });

  if (!user) return null;

  const globalRankPercentile = await calculateGlobalRankPercentile(
    user.currentStreak
  );

  return {
    ...user,
    globalRankPercentile,
  };
}

async function calculateGlobalRankPercentile(
  currentStreak: number
): Promise<number | null> {
  const [totalUsers, usersWithLowerStreak] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: {
        currentStreak: { lt: currentStreak },
      },
    }),
  ]);

  if (totalUsers === 0) return null;

  const percentile = Math.round(
    ((totalUsers - usersWithLowerStreak) / totalUsers) * 100
  );
  return Math.max(1, percentile);
}

export async function recordDailyActivity(): Promise<StreakData | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      totalActiveDays: true,
      lastActiveDate: true,
    },
  });

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = user.lastActiveDate
    ? new Date(user.lastActiveDate)
    : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  if (lastActive && lastActive.getTime() === today.getTime()) {
    const globalRankPercentile = await calculateGlobalRankPercentile(
      user.currentStreak
    );
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalActiveDays: user.totalActiveDays,
      lastActiveDate: user.lastActiveDate,
      globalRankPercentile,
    };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newCurrentStreak: number;
  if (lastActive && lastActive.getTime() === yesterday.getTime()) {
    newCurrentStreak = user.currentStreak + 1;
  } else {
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(user.longestStreak, newCurrentStreak);
  const newTotalActiveDays = user.totalActiveDays + 1;

  const updatedUser = await db.user.update({
    where: { clerkId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalActiveDays: newTotalActiveDays,
      lastActiveDate: today,
    },
    select: {
      currentStreak: true,
      longestStreak: true,
      totalActiveDays: true,
      lastActiveDate: true,
    },
  });

  const globalRankPercentile = await calculateGlobalRankPercentile(
    updatedUser.currentStreak
  );

  return {
    ...updatedUser,
    globalRankPercentile,
  };
}
