import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import type { IngestPlayItem, PlayArtistMinimal, PlayTrackMinimal } from "@/lib/spotify-payloads";

/**
 * Fetch recently played tracks for a single user
 * Token refresh is handled by the token manager
 */
export async function fetchUserPlays(
  userId: string,
  accessToken: string,
  lastPlayedAt: string | null
): Promise<IngestPlayItem[]> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_SPOTIFY_CLIENT_ID not configured");
  }

  const tokenObj: AccessToken = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: "", // Not needed, token manager handles refresh
  };

  const spotifyApi = SpotifyApi.withAccessToken(clientId, tokenObj);

  // Fetch up to 50 most recent tracks
  const response = await spotifyApi.player.getRecentlyPlayedTracks(50);

  // Filter to only include plays after lastPlayedAt
  let items = response.items;
  if (lastPlayedAt) {
    const lastPlayedTimestamp = new Date(lastPlayedAt).getTime();
    items = items.filter((item) => {
      const playedTimestamp = new Date(item.played_at).getTime();
      return playedTimestamp > lastPlayedTimestamp;
    });
  }

  // Transform to IngestPlayItem format
  const ingestItems: IngestPlayItem[] = items.map((item) => {
    const track = item.track;
    const artists: PlayArtistMinimal[] = track.artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      href: artist.href || null,
      uri: artist.uri || null,
    }));

    const trackMinimal: PlayTrackMinimal = {
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      explicit: track.explicit,
      artists,
      href: track.href || null,
      uri: track.uri || null,
    };

    return {
      user_id: userId,
      played_at: item.played_at,
      track: trackMinimal,
      context: item.context,
    };
  });

  return ingestItems;
}

