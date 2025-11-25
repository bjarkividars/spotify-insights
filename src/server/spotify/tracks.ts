import { SpotifyApi, type Track } from "@spotify/web-api-ts-sdk";

import type { PlaylistTrack } from "@/app/(authenticated)/playlists/generate/types";

import { tokenManager } from "./token-manager";

type SpotifyTrackMatch = {
    id: string;
    uri: string;
    name: string;
    artist: string;
    image?: string | null;
};

export async function enrichTracksWithSpotifyData(
    userId: string,
    tracks: PlaylistTrack[]
): Promise<PlaylistTrack[]> {
    if (tracks.length === 0) {
        return [];
    }

    const spotifyApi = await createSpotifyClient(userId);
    const resolved = await Promise.all(tracks.map((track) => hydrateTrack(spotifyApi, track)));

    // Drop any entries we couldn't find on Spotify so the UI only shows playable tracks.
    return resolved.filter((track): track is PlaylistTrack => Boolean(track));
}

export async function hydrateTracksSequentially(
    userId: string,
    tracks: PlaylistTrack[],
    onTrack: (track: PlaylistTrack, index: number) => void | Promise<void>
) {
    if (!tracks.length) return;

    const spotifyApi = await createSpotifyClient(userId);

    for (const [index, track] of tracks.entries()) {
        const hydrated = await hydrateTrack(spotifyApi, track);
        if (!hydrated) continue;
        await onTrack(hydrated, index);
    }
}

async function createSpotifyClient(userId: string) {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
        throw new Error("NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not configured");
    }

    const accessToken = await tokenManager.getAccessToken(userId);
    return SpotifyApi.withAccessToken(clientId, {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "",
    });
}

async function findSpotifyMatch(
    spotifyApi: Awaited<ReturnType<typeof createSpotifyClient>>,
    track: PlaylistTrack
): Promise<SpotifyTrackMatch | null> {
    try {
        const query = buildSearchQuery(track);
        const result = await spotifyApi.search(query, ["track"], undefined, 5);
        const items = result.tracks?.items ?? [];
        const best = selectBestTrack(items, track);
        if (!best) {
            return null;
        }

        return {
            id: best.id,
            uri: best.uri,
            name: best.name,
            artist: best.artists?.[0]?.name ?? track.artist,
            image: best.album?.images?.[0]?.url ?? null,
        };
    } catch (error) {
        console.error("Failed to search Spotify for", track, error);
        return null;
    }
}

function buildSearchQuery(track: PlaylistTrack) {
    const artist = track.artist ? ` artist:${track.artist}` : "";
    return `track:${track.name}${artist}`;
}

async function hydrateTrack(
    spotifyApi: Awaited<ReturnType<typeof createSpotifyClient>>,
    track: PlaylistTrack
): Promise<PlaylistTrack | null> {
    const match = await findSpotifyMatch(spotifyApi, track);
    if (!match) {
        return null;
    }

    return {
        ...track,
        name: match.name,
        artist: match.artist,
        image: match.image ?? track.image ?? null,
        spotifyId: match.id,
        uri: match.uri,
    };
}

function selectBestTrack(items: Track[], desired: PlaylistTrack): Track | null {
    if (!items.length) {
        return null;
    }

    const normalizedDesiredArtist = normalize(desired.artist);
    const normalizedDesiredName = normalize(desired.name);

    const exactMatch = items.find((item) => {
        const itemArtist = normalize(item.artists?.[0]?.name ?? "");
        const itemName = normalize(item.name);
        return itemArtist.includes(normalizedDesiredArtist) && itemName === normalizedDesiredName;
    });

    if (exactMatch) {
        return exactMatch;
    }

    const looseMatch = items.find((item) => {
        const itemArtist = normalize(item.artists?.[0]?.name ?? "");
        const itemName = normalize(item.name);
        return itemArtist.includes(normalizedDesiredArtist) || itemName.includes(normalizedDesiredName);
    });

    return looseMatch ?? items[0] ?? null;
}

function normalize(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
