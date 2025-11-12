"use server";

import { withSpotifyApiRefresh } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";
import { getTopArtistsData, type TopArtist } from "@/server/plays/top-artists";

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

export async function getTopArtists(limit = 10): Promise<TopArtist[]> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    return await getTopArtistsData(user.id, limit);
}
