import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * O*NET data ingestion endpoint.
 * Secured by CRON_SECRET for Vercel Cron Jobs.
 *
 * This endpoint fetches occupation data from O*NET and updates the database.
 * Run weekly to keep career data current.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // TODO: Implement O*NET bulk data download and parsing
    // For MVP, we'll seed data manually via prisma/seed.ts
    // This cron job will be used for periodic updates

    const occupationCount = await db.occupation.count();

    return NextResponse.json({
      success: true,
      message: "O*NET ingestion check complete",
      occupationCount,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error("O*NET ingestion error:", error);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
