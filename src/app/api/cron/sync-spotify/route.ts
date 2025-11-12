import { syncAllUsers } from "@/server/spotify/sync-all";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }
  
    const authHeader = request.headers.get("authorization");
    const xCron = request.headers.get("x-cron-secret");           
    const xVercel = request.headers.get("x-vercel-cron-secret");  
  
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      xCron === cronSecret ||
      xVercel === cronSecret ||
      new URL(request.url).searchParams.get("token") === cronSecret; 
  
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  
    const run = async () => {
      const start = Date.now();
      const result = await syncAllUsers();
      return NextResponse.json(
        { success: true, duration_ms: Date.now() - start, result },
        { headers: { "Cache-Control": "no-store" } }
      );
    };
  
    return run();
  }
  