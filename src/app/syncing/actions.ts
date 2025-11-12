"use server";

import { createClient } from "@/utils/supabase/server";
import { tokenManager } from "@/server/spotify/token-manager";
import { fetchUserPlays } from "@/server/spotify/fetch";
import { ingestPlaysBatch } from "@/server/spotify/ingest";

type SyncResult = {
  success: boolean;
  playsSynced?: number;
  error?: string;
};

export async function syncUserData(): Promise<SyncResult> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    console.log(`[Initial Sync] Starting sync for user ${user.id}`);

    // Check if user already has plays (avoid double sync)
    const { data: existingPlays, error: checkError } = await supabase
      .from("plays")
      .select("played_at")
      .eq("user_id", user.id)
      .limit(1);

    if (checkError) {
      console.error(`[Initial Sync] Error checking existing plays:`, checkError);
      // Continue anyway
    }

    // Get last played timestamp (null if no plays)
    const lastPlayedAt = existingPlays && existingPlays.length > 0 
      ? existingPlays[0].played_at 
      : null;

    // Get access token
    let accessToken: string;
    try {
      accessToken = await tokenManager.getAccessToken(user.id);
    } catch (tokenError) {
      console.error(`[Initial Sync] Failed to get access token:`, tokenError);
      return { 
        success: false, 
        error: "Unable to connect to Spotify. Please try logging in again." 
      };
    }

    // Fetch plays from Spotify
    const plays = await fetchUserPlays(user.id, accessToken, lastPlayedAt);
    
    console.log(`[Initial Sync] Found ${plays.length} new plays for user ${user.id}`);

    if (plays.length === 0) {
      return { 
        success: true, 
        playsSynced: 0 
      };
    }

    // Ingest plays
    await ingestPlaysBatch(plays);

    console.log(`[Initial Sync] Successfully synced ${plays.length} plays for user ${user.id}`);

    return {
      success: true,
      playsSynced: plays.length,
    };
  } catch (error) {
    console.error("[Initial Sync] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

