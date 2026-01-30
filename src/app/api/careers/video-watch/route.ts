import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Track video watch progress for career exploration
 */
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      occupationId,
      videoId,
      videoTitle,
      videoUrl,
      duration,
      watchedSeconds,
      completed,
    } = body;

    if (!occupationId || !videoId) {
      return NextResponse.json(
        { error: "occupationId and videoId are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const videoWatch = await db.careerVideoWatch.upsert({
      where: {
        userId_occupationId_videoId: {
          userId: user.id,
          occupationId,
          videoId,
        },
      },
      update: {
        watchedSeconds:
          watchedSeconds !== undefined
            ? Math.max(watchedSeconds, 0)
            : undefined,
        completed: completed !== undefined ? completed : undefined,
        videoTitle: videoTitle || undefined,
        videoUrl: videoUrl || undefined,
        duration: duration || undefined,
      },
      create: {
        userId: user.id,
        occupationId,
        videoId,
        videoTitle,
        videoUrl,
        duration,
        watchedSeconds: watchedSeconds || 0,
        completed: completed || false,
      },
    });

    return NextResponse.json({ success: true, videoWatch });
  } catch (error) {
    console.error("Video watch tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track video watch" },
      { status: 500 }
    );
  }
}

/**
 * Get video watch progress for a career
 */
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const occupationId = request.nextUrl.searchParams.get("occupationId");

  if (!occupationId) {
    return NextResponse.json(
      { error: "occupationId is required" },
      { status: 400 }
    );
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const videoWatches = await db.careerVideoWatch.findMany({
      where: {
        userId: user.id,
        occupationId,
      },
      orderBy: { watchedAt: "desc" },
    });

    const stats = {
      totalVideos: videoWatches.length,
      completedVideos: videoWatches.filter((v) => v.completed).length,
      totalWatchTimeSeconds: videoWatches.reduce(
        (sum, v) => sum + v.watchedSeconds,
        0
      ),
    };

    return NextResponse.json({ videoWatches, stats });
  } catch (error) {
    console.error("Video watch fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video watches" },
      { status: 500 }
    );
  }
}
