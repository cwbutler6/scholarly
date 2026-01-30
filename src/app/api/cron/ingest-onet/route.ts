import { NextRequest, NextResponse } from "next/server";
import { ingestOnetData, getIngestionStats } from "@/lib/onet";

/**
 * O*NET data ingestion endpoint.
 * Secured by CRON_SECRET for Vercel Cron Jobs.
 *
 * This endpoint fetches occupation data from O*NET and updates the database.
 * Runs weekly (Sunday at midnight) to keep career data current.
 *
 * Query params:
 * - limit: Number of occupations to process (for testing)
 * - skipRelations: Skip related occupations (faster for testing)
 * - stats: Just return current stats without running ingestion
 */
export const maxDuration = 300; // 5 minutes for Vercel Pro

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const statsOnly = searchParams.get("stats") === "true";
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!, 10)
    : undefined;
  const skipRelations = searchParams.get("skipRelations") === "true";

  try {
    if (statsOnly) {
      const stats = await getIngestionStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    if (!process.env.ONET_API_KEY) {
      return NextResponse.json(
        {
          error: "ONET_API_KEY not configured",
          message:
            "Get an API key at https://services.onetcenter.org/ and add it to environment variables",
        },
        { status: 500 }
      );
    }

    const logs: string[] = [];
    const result = await ingestOnetData({
      limit,
      skipRelations,
      onProgress: (msg) => {
        console.log(msg);
        logs.push(msg);
      },
    });

    return NextResponse.json({
      success: result.success,
      occupationsProcessed: result.occupationsProcessed,
      durationMs: result.duration,
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      logs: logs.slice(-20),
    });
  } catch (error) {
    console.error("O*NET ingestion error:", error);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(error) },
      { status: 500 }
    );
  }
}
