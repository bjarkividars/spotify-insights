import { getUsersToSync } from "./sync";
import { fetchUserPlays } from "./fetch";
import { ingestPlaysBatch } from "./ingest";
import { tokenManager } from "./token-manager";

export type SyncResult = {
  totalUsers: number;
  successful: number;
  failed: number;
  playsSynced: number;
  errors: Array<{ userId: string; error: string }>;
};

/**
 * Sync recently played tracks for all users
 */
export async function syncAllUsers(): Promise<SyncResult> {
  const startTime = Date.now();
  console.log("[Spotify Sync] Starting sync for all users...");

  const result: SyncResult = {
    totalUsers: 0,
    successful: 0,
    failed: 0,
    playsSynced: 0,
    errors: [],
  };

  try {
    // Get all users to sync
    const users = await getUsersToSync();
    result.totalUsers = users.length;

    console.log(`[Spotify Sync] Found ${users.length} users to sync`);

    if (users.length === 0) {
      console.log("[Spotify Sync] No users to sync");
      return result;
    }

    // Process each user
    for (const user of users) {
      try {
        console.log(`[Spotify Sync] Syncing user ${user.user_id}...`);

        // Get access token from token manager (handles refresh/caching)
        let accessToken: string;
        try {
          accessToken = await tokenManager.getAccessToken(user.user_id);
        } catch (tokenError) {
          console.log(`[Spotify Sync] User ${user.user_id} has no valid tokens, skipping`);
          result.failed++;
          result.errors.push({
            userId: user.user_id,
            error: tokenError instanceof Error ? tokenError.message : "No valid tokens",
          });
          continue;
        }

        // Fetch new plays
        const plays = await fetchUserPlays(
          user.user_id,
          accessToken,
          user.last_played_at
        );

        console.log(`[Spotify Sync] Found ${plays.length} new plays for user ${user.user_id}`);

        // Ingest plays if any
        if (plays.length > 0) {
          try {
            await ingestPlaysBatch(plays);
            result.playsSynced += plays.length;
            console.log(`[Spotify Sync] Ingested ${plays.length} plays for user ${user.user_id}`);
          } catch (ingestError) {
            // Debug: Check for duplicates only on error
            const playKeys = plays.map(p => `${p.user_id}:${p.played_at}`);
            const uniquePlayKeys = new Set(playKeys);
            const duplicatePlays = playKeys.filter((key, index) => playKeys.indexOf(key) !== index);
            
            console.error(`[Spotify Sync] Ingest error for user ${user.user_id}:`, ingestError);
            console.error(`[Spotify Sync] Total plays: ${plays.length}, Unique (user_id, played_at): ${uniquePlayKeys.size}`);
            
            if (duplicatePlays.length > 0) {
              console.error(`[Spotify Sync] DUPLICATE PLAYS found:`, [...new Set(duplicatePlays)]);
            }

            // Check for duplicate track IDs
            const trackIds = plays.map(p => p.track.id);
            const trackIdCounts = new Map<string, number>();
            trackIds.forEach(id => {
              trackIdCounts.set(id, (trackIdCounts.get(id) || 0) + 1);
            });
            const duplicateTracks = Array.from(trackIdCounts.entries())
              .filter(([_, count]) => count > 1)
              .map(([id, count]) => ({ id, count }));
            
            if (duplicateTracks.length > 0) {
              console.error(`[Spotify Sync] DUPLICATE TRACK IDs (appearing multiple times):`, duplicateTracks);
            }

            // Check for duplicate artist IDs
            const artistIdCounts = new Map<string, number>();
            plays.forEach(p => {
              p.track.artists.forEach(a => {
                artistIdCounts.set(a.id, (artistIdCounts.get(a.id) || 0) + 1);
              });
            });
            const duplicateArtists = Array.from(artistIdCounts.entries())
              .filter(([_, count]) => count > 1)
              .map(([id, count]) => ({ id, count }));
            
            if (duplicateArtists.length > 0) {
              console.error(`[Spotify Sync] DUPLICATE ARTIST IDs (appearing multiple times):`, duplicateArtists.slice(0, 10)); // Limit to first 10
            }

            // Show sample of tracks with duplicate IDs
            if (duplicateTracks.length > 0) {
              const sampleTrackId = duplicateTracks[0].id;
              const sampleTracks = plays.filter(p => p.track.id === sampleTrackId);
              console.error(`[Spotify Sync] Sample duplicate track (${sampleTrackId}):`, JSON.stringify({
                id: sampleTracks[0].track.id,
                name: sampleTracks[0].track.name,
                href: sampleTracks.map(t => t.track.href),
                uri: sampleTracks.map(t => t.track.uri),
                appearances: sampleTracks.length
              }, null, 2));
            }

            // Show sample of artists with duplicate IDs
            if (duplicateArtists.length > 0) {
              const sampleArtistId = duplicateArtists[0].id;
              const sampleArtists: Array<{ id: string; name: string; href: string | null; uri: string | null }> = [];
              plays.forEach(p => {
                p.track.artists.forEach(a => {
                  if (a.id === sampleArtistId) {
                    sampleArtists.push({ id: a.id, name: a.name, href: a.href || null, uri: a.uri || null });
                  }
                });
              });
              console.error(`[Spotify Sync] Sample duplicate artist (${sampleArtistId}):`, JSON.stringify({
                id: sampleArtists[0].id,
                name: sampleArtists[0].name,
                href: [...new Set(sampleArtists.map(a => a.href))],
                uri: [...new Set(sampleArtists.map(a => a.uri))],
                appearances: sampleArtists.length
              }, null, 2));
            }
            
            throw ingestError;
          }
        }

        result.successful++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Spotify Sync] Failed to sync user ${user.user_id}:`, errorMessage);

        result.failed++;
        result.errors.push({
          userId: user.user_id,
          error: errorMessage,
        });
      }
    }

    // Clear token cache at end of sync
    tokenManager.clearCache();

    const duration = Date.now() - startTime;
    console.log(
      `[Spotify Sync] Completed in ${duration}ms. Success: ${result.successful}, Failed: ${result.failed}, Plays: ${result.playsSynced}`
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Spotify Sync] Fatal error during sync:", errorMessage);
    
    // Clear cache even on error
    tokenManager.clearCache();
    
    throw error;
  }
}

