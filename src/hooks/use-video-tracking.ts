"use client";

import { useCallback, useRef } from "react";

interface VideoTrackingOptions {
  occupationId: string;
  videoId: string;
  videoTitle?: string;
  videoUrl?: string;
  duration?: number;
}

export function useVideoTracking(options: VideoTrackingOptions) {
  const { occupationId, videoId, videoTitle, videoUrl, duration } = options;
  const lastTrackedTimeRef = useRef<number>(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const trackProgress = useCallback(
    async (watchedSeconds: number, completed: boolean = false) => {
      if (watchedSeconds <= lastTrackedTimeRef.current && !completed) {
        return;
      }

      lastTrackedTimeRef.current = watchedSeconds;

      try {
        await fetch("/api/careers/video-watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occupationId,
            videoId,
            videoTitle,
            videoUrl,
            duration,
            watchedSeconds,
            completed,
          }),
        });
      } catch (error) {
        console.error("Failed to track video progress:", error);
      }
    },
    [occupationId, videoId, videoTitle, videoUrl, duration]
  );

  const startTracking = useCallback(
    (getCurrentTime: () => number) => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }

      trackingIntervalRef.current = setInterval(() => {
        const currentTime = Math.floor(getCurrentTime());
        trackProgress(currentTime);
      }, 10000);
    },
    [trackProgress]
  );

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const onVideoEnd = useCallback(
    (finalTime: number) => {
      stopTracking();
      trackProgress(finalTime, true);
    },
    [stopTracking, trackProgress]
  );

  const onVideoPause = useCallback(
    (currentTime: number) => {
      stopTracking();
      trackProgress(currentTime);
    },
    [stopTracking, trackProgress]
  );

  const onVideoPlay = useCallback(
    (getCurrentTime: () => number) => {
      startTracking(getCurrentTime);
    },
    [startTracking]
  );

  return {
    trackProgress,
    startTracking,
    stopTracking,
    onVideoEnd,
    onVideoPause,
    onVideoPlay,
  };
}
