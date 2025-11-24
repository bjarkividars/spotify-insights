import { createAdminClient } from "@/utils/supabase/server";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { tokenManager } from "./token-manager";
import type { HydrateArtistUpdate } from "@/lib/spotify-payloads";
import { Json } from "@/lib/database.types";
import { extractColorsForArtists } from "@/utils/color-extraction";

/**
 * Hydrate a specific list of artist IDs using the logged-in user's token.
 * Intended for page-level targeted hydration prior to rendering.
 * Returns a map of artistId -> primary_image_url for immediate use without re-fetching.
 */
export async function hydrateArtistsByIdsUsingUser(
  userId: string,
  artistIds: string[]
): Promise<{ updated: number; imageMap: Map<string, string | null> }> {
  const supabase = createAdminClient();

  if (!artistIds.length) {
    return { updated: 0, imageMap: new Map() };
  }

  // Get access token for the requesting user
  const accessToken = await tokenManager.getAccessToken(userId);

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

  const updates: HydrateArtistUpdate[] = [];
  const imageMap = new Map<string, string | null>();

  // Fetch in batches of 50
  for (let i = 0; i < artistIds.length; i += 50) {
    const batch = artistIds.slice(i, i + 50);
    const artistDetails = await spotifyApi.artists.get(batch);

    // Compute colors for this batch (only artists with images)
    const batchForColor = artistDetails.map((artist) => ({
      artist_id: artist.id,
      artist_image: artist.images.length > 0 ? artist.images[0].url : null,
    }));
    const colorMap = await extractColorsForArtists(batchForColor);

    for (const artist of artistDetails) {
      // Extract primary image (first/largest image)
      const primaryImage = artist.images.length > 0 ? artist.images[0].url : null;
      imageMap.set(artist.id, primaryImage);

      const colors = colorMap.get(artist.id);

      updates.push({
        id: artist.id,
        href: artist.href || null,
        uri: artist.uri || null,
        gradient_start: colors?.gradientStart ?? null,
        gradient_end: colors?.gradientEnd ?? null,
        images: artist.images.map((img) => ({
          url: img.url,
          width: img.width || null,
          height: img.height || null,
        })),
      });
    }
  }

  // Persist via RPC (admin client bypasses RLS for metadata tables)
  const { error: hydrateError } = await supabase.rpc("hydrate_artists", {
    p_updates: updates as unknown as Json,
  });
  if (hydrateError) {
    throw new Error(`Failed to hydrate artists: ${hydrateError.message}`);
  }

  return { updated: updates.length, imageMap };
}
