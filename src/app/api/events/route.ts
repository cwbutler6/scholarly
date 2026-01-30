import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export type EventType =
  | "career_viewed"
  | "career_saved"
  | "career_unsaved"
  | "career_liked"
  | "assessment_started"
  | "assessment_partial_complete"
  | "assessment_completed"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "profile_updated"
  | "chat_opened"
  | "chat_message_sent"
  | "search_performed"
  | "explore_filter_changed"
  | "qotd_opened"
  | "qotd_answered"
  | "crossword_opened"
  | "crossword_hint_used"
  | "crossword_reset"
  | "crossword_completed"
  | "streak_modal_opened"
  | "page_view";

interface EventPayload {
  type: EventType;
  careerId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Store user activity events for AI context and analytics
 * Supports both JSON and sendBeacon (text/plain) requests
 */
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let body: EventPayload | EventPayload[];

    if (contentType.includes("text/plain")) {
      const text = await request.text();
      body = JSON.parse(text);
    } else {
      body = await request.json();
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const events = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return NextResponse.json(
        { error: "At least one event is required" },
        { status: 400 }
      );
    }

    for (const event of events) {
      if (!event.type) {
        return NextResponse.json(
          { error: "Event type is required" },
          { status: 400 }
        );
      }
    }

    const created = await db.event.createMany({
      data: events.map((event) => ({
        userId: user.id,
        type: event.type,
        careerId: event.careerId || null,
        metadata: event.metadata || null,
      })),
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error("Event tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

/**
 * Get user's recent events (for AI context or debugging)
 */
export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const careerId = searchParams.get("careerId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const since = searchParams.get("since");

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const events = await db.event.findMany({
      where: {
        userId: user.id,
        ...(type && { type }),
        ...(careerId && { careerId }),
        ...(since && { createdAt: { gte: new Date(since) } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
