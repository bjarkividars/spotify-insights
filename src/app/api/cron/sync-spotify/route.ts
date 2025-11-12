import { NextResponse } from "next/server";
import { syncAllUsers } from "@/server/spotify/sync-all";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

export async function GET() {
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

