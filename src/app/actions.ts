"use server";

import { withSpotifyApiRefresh } from "@/utils/auth";

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