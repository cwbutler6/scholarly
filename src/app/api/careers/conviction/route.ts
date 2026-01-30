import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getConvictionBreakdown } from "@/lib/careers";

/**
 * Get detailed conviction score breakdown for a career
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

    const breakdown = await getConvictionBreakdown(user.id, occupationId);

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error("Conviction score error:", error);
    return NextResponse.json(
      { error: "Failed to calculate conviction score" },
      { status: 500 }
    );
  }
}
