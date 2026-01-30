"use client";

import { useEffect, useRef } from "react";

interface CareerTrackerProps {
  occupationId: string;
}

export function CareerTracker({ occupationId }: CareerTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedPageViewRef = useRef(false);

  useEffect(() => {
    if (hasTrackedPageViewRef.current) return;
    hasTrackedPageViewRef.current = true;

    fetch("/api/careers/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occupationId }),
    }).catch(console.error);

    startTimeRef.current = Date.now();

    const trackTimeSpent = () => {
      const timeSpentSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      if (timeSpentSeconds > 5) {
        navigator.sendBeacon(
          "/api/careers/engagement",
          JSON.stringify({ occupationId, timeSpentSeconds })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        trackTimeSpent();
        startTimeRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      trackTimeSpent();
    };
  }, [occupationId]);

  return null;
}
