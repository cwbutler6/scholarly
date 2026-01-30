"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useUser } from "@clerk/nextjs";
import { useEffect, Suspense, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type AnalyticsEvent =
  | { name: "career_viewed"; properties: { careerId: string; careerTitle: string; matchPercent?: number; source?: string } }
  | { name: "career_saved"; properties: { careerId: string; careerTitle: string } }
  | { name: "career_unsaved"; properties: { careerId: string; careerTitle: string } }
  | { name: "career_liked"; properties: { careerId: string; careerTitle: string; rating: number } }
  | { name: "assessment_started"; properties: { type: string } }
  | { name: "assessment_completed"; properties: { type: string; scores?: Record<string, number> } }
  | { name: "onboarding_step_completed"; properties: { step: string; stepNumber: number } }
  | { name: "onboarding_completed"; properties: Record<string, never> }
  | { name: "profile_updated"; properties: { section: string; fields?: string[] } }
  | { name: "chat_opened"; properties: Record<string, never> }
  | { name: "chat_message_sent"; properties: { messageLength: number } }
  | { name: "search_performed"; properties: { query: string; resultsCount?: number } }
  | { name: "explore_filter_changed"; properties: { filterType: string; value: string } }
  | { name: "qotd_opened"; properties: { questionId: string } }
  | { name: "qotd_answered"; properties: { questionId: string; selectedAnswer: number; isCorrect: boolean } }
  | { name: "crossword_opened"; properties: { crosswordId: string } }
  | { name: "crossword_hint_used"; properties: { crosswordId: string; hintsRemaining: number } }
  | { name: "crossword_reset"; properties: { crosswordId: string } }
  | { name: "crossword_completed"; properties: { crosswordId: string; hintsUsed: number; timeSpentSeconds?: number } }
  | { name: "streak_modal_opened"; properties: { currentStreak: number } };

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") {
            ph.debug();
          }
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogUserIdentifier() {
  const { user, isLoaded } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (!isLoaded || !ph) return;

    if (user) {
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        imageUrl: user.imageUrl,
      });
    } else {
      ph.reset();
    }
  }, [user, isLoaded, ph]);

  return null;
}

function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      ph.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogPageview() {
  return (
    <Suspense fallback={null}>
      <PostHogPageviewTracker />
    </Suspense>
  );
}

export function useAnalytics() {
  const ph = usePostHog();

  const track = useCallback(
    <T extends AnalyticsEvent["name"]>(
      eventName: T,
      properties: Extract<AnalyticsEvent, { name: T }>["properties"]
    ) => {
      if (ph) {
        ph.capture(eventName, properties);
      }
    },
    [ph]
  );

  const setUserProperties = useCallback(
    (properties: Record<string, unknown>) => {
      if (ph) {
        ph.people.set(properties);
      }
    },
    [ph]
  );

  return { track, setUserProperties, posthog: ph };
}
