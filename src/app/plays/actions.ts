import { createClient } from "@/utils/supabase/server";
import { fetchUserPlaysWithJoins } from "@/server/plays/db";
import { hydrateArtistsByIdsUsingUser } from "@/server/spotify/hydrate";

type JoinedPlayRow = {
    played_at: string;
    track_id: string;
    tracks: {
        id: string;
        name: string;
        artist_id: string;
        artists: {
            id: string;
            name: string;
            primary_image_url: string | null;
            details_status: string | null;
        };
    };
};

export type PlayWithDetails = {
    played_at: string;
    track: {
        id: string;
        name: string;
        artist: {
            id: string;
            name: string;
            image_url: string | null;
        };
    };
};

export async function getUserPlays(limit = 50): Promise<PlayWithDetails[]> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error("Not authenticated");
    }

    // First fetch
    const plays: JoinedPlayRow[] = await fetchUserPlaysWithJoins(user.id, limit) as JoinedPlayRow[];

    // Determine which artists need hydration
    const artistsNeedingHydration: string[] = Array.from(new Set(
        plays.map((p) => p.tracks.artists)
            .filter((a) => a?.details_status === "partial")
            .map((a) => a.id)
    ));

    // Hydrate and get image map for immediate use
    let hydratedImageMap = new Map<string, string | null>();
    if (artistsNeedingHydration.length > 0) {
        const result = await hydrateArtistsByIdsUsingUser(user.id, artistsNeedingHydration);
        hydratedImageMap = result.imageMap;
    }

    // Map plays, using hydrated images if available, otherwise fall back to DB value
    return plays.map((p) => {
        const artistId = p.tracks.artists.id;
        const imageUrl = hydratedImageMap.has(artistId)
            ? hydratedImageMap.get(artistId)!
            : p.tracks.artists.primary_image_url;

        return {
            played_at: p.played_at,
            track: {
                id: p.tracks.id,
                name: p.tracks.name,
                artist: {
                    id: artistId,
                    name: p.tracks.artists.name,
                    image_url: imageUrl,
                },
            },
        };
    });
}