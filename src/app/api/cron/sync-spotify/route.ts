import { NextResponse } from "next/server";
import { syncAllUsers } from "@/server/spotify/sync-all";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

export async function GET(request: Request) {
  // Verify the request is authorized
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not configured");
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Check for Bearer token or Vercel cron secret header
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    request.headers.get("x-vercel-cron-secret") === cronSecret;

  if (!isAuthorized) {
    console.error("[Cron] Unauthorized access attempt");
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    console.log("[Cron] Starting Spotify sync job...");
    const startTime = Date.now();

    const result = await syncAllUsers();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Cron] Spotify sync job failed:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

