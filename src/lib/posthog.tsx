"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useUser } from "@clerk/nextjs";
import { useEffect, Suspense, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type AnalyticsEvent =
  | { name: "career_viewed"; properties: { careerId: string; careerTitle: string; matchPercent?: number; source?: string } }
  | { name: "career_saved"; properties: { careerId: string; careerTitle: string } }
  | { name: "career_unsaved"; properties: { careerId: string; careerTitle: string } }
  | { name: "career_liked"; properties: { careerId: string; careerTitle: string; rating: number } }
  | { name: "assessment_started"; properties: { type: string } }
  | { name: "assessment_partial_complete"; properties: { type: string; questionsAnswered: number } }
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

interface InternalEvent {
  type: string;
  careerId?: string;
  metadata?: Record<string, unknown>;
}

const EVENT_BATCH_SIZE = 10;
const EVENT_FLUSH_INTERVAL_MS = 5000;

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

function extractCareerIdFromProperties(
  properties: Record<string, unknown>
): string | undefined {
  if (typeof properties.careerId === "string") {
    return properties.careerId;
  }
  return undefined;
}

async function flushEventsToServer(events: InternalEvent[]) {
  if (events.length === 0) return;

  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      console.warn("Failed to flush events to server:", response.status);
    }
  } catch (error) {
    console.warn("Failed to flush events to server:", error);
  }
}

export function useAnalytics() {
  const ph = usePostHog();
  const eventQueueRef = useRef<InternalEvent[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushEvents = useCallback(() => {
    if (eventQueueRef.current.length > 0) {
      const eventsToFlush = [...eventQueueRef.current];
      eventQueueRef.current = [];
      flushEventsToServer(eventsToFlush);
    }
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventQueueRef.current.length > 0) {
        const eventsToFlush = [...eventQueueRef.current];
        eventQueueRef.current = [];
        navigator.sendBeacon(
          "/api/events",
          JSON.stringify(eventsToFlush)
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushEvents();
    };
  }, [flushEvents]);

  const queueInternalEvent = useCallback(
    (event: InternalEvent) => {
      eventQueueRef.current.push(event);

      if (eventQueueRef.current.length >= EVENT_BATCH_SIZE) {
        flushEvents();
      } else if (!flushTimeoutRef.current) {
        flushTimeoutRef.current = setTimeout(flushEvents, EVENT_FLUSH_INTERVAL_MS);
      }
    },
    [flushEvents]
  );

  const track = useCallback(
    <T extends AnalyticsEvent["name"]>(
      eventName: T,
      properties: Extract<AnalyticsEvent, { name: T }>["properties"]
    ) => {
      if (ph) {
        ph.capture(eventName, properties);
      }

      const careerId = extractCareerIdFromProperties(
        properties as Record<string, unknown>
      );
      queueInternalEvent({
        type: eventName,
        careerId,
        metadata: properties as Record<string, unknown>,
      });
    },
    [ph, queueInternalEvent]
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
