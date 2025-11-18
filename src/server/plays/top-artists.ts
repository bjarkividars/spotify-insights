import { createClient } from "@/utils/supabase/server";
import { hydrateArtistsByIdsUsingUser } from "@/server/spotify/hydrate";
import { extractColorsForArtists } from "@/utils/color-extraction";

export type TopArtist = {
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  play_count: number;
  estimated_payout: number; // in USD
  gradientStart: string | null; // hex color for gradient start
  gradientEnd: string | null; // hex color for gradient end (darker)
};

// Calculate estimated payout (Spotify pays ~$0.004 per stream on average)
const PAYOUT_PER_STREAM = 0.004;

export async function getTotalEstimatedPayout(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get total play count for the user
  const { count, error } = await supabase
    .from("plays")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to fetch play count: ${error.message}`);
  
  const totalPlays = count ?? 0;
  return totalPlays * PAYOUT_PER_STREAM;
}

export async function getTopArtistsData(userId: string, limit = 10, offset = 0): Promise<TopArtist[]> {
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

  // Sort by count and take top N with pagination
  const sorted = Array.from(artistPlayCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(offset, offset + limit);

  // Check for artists needing hydration
  const artistsToHydrate = sorted
    .filter(([, artistData]) => artistData.status === "partial")
    .map(([id]) => id);

  let imageMap = new Map<string, string | null>();
  if (artistsToHydrate.length > 0) {
    const result = await hydrateArtistsByIdsUsingUser(userId, artistsToHydrate);
    imageMap = result.imageMap;
  }

  // Prepare artists for color extraction
  const artistsForColorExtraction = sorted.map(([artistId, artistData]) => ({
    artist_id: artistId,
    artist_image: imageMap.get(artistId) ?? artistData.image,
  }));

  // Extract gradient colors for artists with images
  const colorMap = await extractColorsForArtists(artistsForColorExtraction);

  return sorted.map(([artistId, artistData]) => {
    const colors = colorMap.get(artistId);
    return {
      artist_id: artistId,
      artist_name: artistData.name,
      artist_image: imageMap.get(artistId) ?? artistData.image,
      play_count: artistData.count,
      estimated_payout: artistData.count * PAYOUT_PER_STREAM,
      gradientStart: colors?.gradientStart ?? null,
      gradientEnd: colors?.gradientEnd ?? null,
    };
  });
}
