import { createAdminClient } from "@/utils/supabase/server";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { tokenManager } from "./token-manager";
import type { HydrateArtistUpdate } from "@/lib/spotify-payloads";
import { Json } from "@/lib/database.types";

/**
 * Hydrate artist details (images, etc.) for artists with partial data
 * Uses the first available Spotify token to fetch artist details
 */
export async function hydrateArtists(limit = 50): Promise<{ updated: number }> {
  const supabase = createAdminClient();

  // Get artists that need hydration
  const { data: artists, error: artistsError } = await supabase
    .from("artists")
    .select("id, name")
    .eq("details_status", "partial")
    .limit(limit);

  if (artistsError) {
    throw new Error(`Failed to fetch artists: ${artistsError.message}`);
  }

  if (!artists || artists.length === 0) {
    console.log("[Hydrate] No artists to hydrate");
    return { updated: 0 };
  }

  console.log(`[Hydrate] Found ${artists.length} artists to hydrate`);

  // Get any user to use their token (just need one for metadata)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1,
  });

  if (authError || !authData?.users || authData.users.length === 0) {
    throw new Error("No users available for hydration");
  }

  const userId = authData.users[0].id;

  // Get access token from token manager
  const accessToken = await tokenManager.getAccessToken(userId);

  // Create Spotify API client
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_SPOTIFY_CLIENT_ID not configured");
  }

  const spotifyApi = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: "",
  });

  // Fetch artist details in batches (Spotify API allows up to 50 at a time)
  const artistIds = artists.map((a) => a.id);
  const updates: HydrateArtistUpdate[] = [];

  try {
    // Fetch in batches of 50
    for (let i = 0; i < artistIds.length; i += 50) {
      const batch = artistIds.slice(i, i + 50);
      const artistDetails = await spotifyApi.artists.get(batch);

      for (const artist of artistDetails) {
        updates.push({
          id: artist.id,
          href: artist.href || null,
          uri: artist.uri || null,
          images: artist.images.map((img) => ({
            url: img.url,
            width: img.width || null,
            height: img.height || null,
          })),
        });
      }
    }

    // Call hydrate RPC
    const { error: hydrateError } = await supabase.rpc("hydrate_artists", {
      p_updates: updates as unknown as Json,
    });

    if (hydrateError) {
      throw new Error(`Failed to hydrate artists: ${hydrateError.message}`);
    }

    console.log(`[Hydrate] Successfully hydrated ${updates.length} artists`);
    return { updated: updates.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Hydrate] Failed to hydrate artists:", errorMessage);
    throw error;
  }
}

