"use server";

import { withSpotifyApiRefresh } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { getTopArtistsData, getTotalEstimatedPayout, type TopArtist } from "@/server/plays/top-artists";

export async function getSpotifyData() {
    try {
        const data = await withSpotifyApiRefresh(async (spotifyApi) => {
            return await spotifyApi.player.getRecentlyPlayedTracks(50);
        });
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getTopArtistsPage(limit = 20, offset = 0): Promise<{ artists: TopArtist[] }> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const artists = await getTopArtistsData(user.id, limit, offset);
    return { artists };
}

export async function getTotalPayout(): Promise<number> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    return await getTotalEstimatedPayout(user.id);
}
