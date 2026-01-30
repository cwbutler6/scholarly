import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Track career page engagement (page views, time spent)
 * Supports both JSON and sendBeacon (text/plain) requests
 */
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body;

    if (contentType.includes("text/plain")) {
      const text = await request.text();
      body = JSON.parse(text);
    } else {
      body = await request.json();
    }

    const { occupationId, timeSpentSeconds } = body;

    if (!occupationId) {
      return NextResponse.json(
        { error: "occupationId is required" },
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

    const engagement = await db.careerEngagement.upsert({
      where: {
        userId_occupationId: {
          userId: user.id,
          occupationId,
        },
      },
      update: {
        pageViews: { increment: 1 },
        timeSpentSeconds: timeSpentSeconds
          ? { increment: timeSpentSeconds }
          : undefined,
        lastViewedAt: new Date(),
      },
      create: {
        userId: user.id,
        occupationId,
        pageViews: 1,
        timeSpentSeconds: timeSpentSeconds || 0,
      },
    });

    return NextResponse.json({ success: true, engagement });
  } catch (error) {
    console.error("Engagement tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track engagement" },
      { status: 500 }
    );
  }
}

/**
 * Get engagement stats for a career
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

    const engagement = await db.careerEngagement.findUnique({
      where: {
        userId_occupationId: {
          userId: user.id,
          occupationId,
        },
      },
    });

    return NextResponse.json({ engagement });
  } catch (error) {
    console.error("Engagement fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement" },
      { status: 500 }
    );
  }
}
