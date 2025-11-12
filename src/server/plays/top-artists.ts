import { createClient } from "@/utils/supabase/server";
import { hydrateArtistsByIdsUsingUser } from "@/server/spotify/hydrate";

export type TopArtist = {
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  play_count: number;
  estimated_payout: number; // in USD
};

export async function getTopArtistsData(userId: string, limit = 10): Promise<TopArtist[]> {
  const supabase = await createClient();

  // Query to get all plays with artist info for the user
  const { data, error } = await supabase
    .from("plays")
    .select(`
      track_id,
      tracks!inner (
        artist_id,
        artists!inner (
          id,
          name,
          primary_image_url,
          details_status
        )
      )
    `)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to fetch plays: ${error.message}`);
  if (!data || data.length === 0) return [];

  // Count plays per artist
  const artistPlayCounts = new Map<string, { name: string; count: number; image: string | null; status: string | null }>();
  
  for (const play of data) {
    const artist = play.tracks.artists;
    const existing = artistPlayCounts.get(artist.id);
    
    if (existing) {
      existing.count++;
    } else {
      artistPlayCounts.set(artist.id, {
        name: artist.name,
        count: 1,
        image: artist.primary_image_url,
        status: artist.details_status,
      });
    }
  }

  // Sort by count and take top N
  const sorted = Array.from(artistPlayCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit);

  // Check for artists needing hydration
  const artistsToHydrate = sorted
    .filter(([_, artistData]) => artistData.status === "partial")
    .map(([id, _]) => id);

  let imageMap = new Map<string, string | null>();
  if (artistsToHydrate.length > 0) {
    const result = await hydrateArtistsByIdsUsingUser(userId, artistsToHydrate);
    imageMap = result.imageMap;
  }

  // Calculate estimated payout (Spotify pays ~$0.004 per stream on average)
  const PAYOUT_PER_STREAM = 0.004;

  return sorted.map(([artistId, artistData]) => ({
    artist_id: artistId,
    artist_name: artistData.name,
    artist_image: imageMap.get(artistId) ?? artistData.image,
    play_count: artistData.count,
    estimated_payout: artistData.count * PAYOUT_PER_STREAM,
  }));
}
