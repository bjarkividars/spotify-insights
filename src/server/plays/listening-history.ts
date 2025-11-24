import { createClient } from "@/utils/supabase/server";

type HistoryDirection = "top" | "bottom" | "recent";

type BaseQuery = {
    userId: string;
    limit?: number;
    minPlays?: number;
    direction?: HistoryDirection;
};

export type ArtistHistoryQuery = BaseQuery & {
    offset?: number;
};

export type TrackHistoryQuery = BaseQuery & {
    artist?: string;
    offset?: number;
};

export type ArtistHistoryEntry = {
    artistId: string;
    artistName: string;
    playCount: number;
    lastPlayedAt: string | null;
};

export type TrackHistoryEntry = {
    trackId: string;
    trackName: string;
    artistId: string;
    artistName: string;
    playCount: number;
    lastPlayedAt: string | null;
};

const DEFAULT_LIMIT = 10;

export async function getArtistHistory(
    params: ArtistHistoryQuery
): Promise<ArtistHistoryEntry[]> {
    const plays = await fetchPlays(params.userId);
    if (plays.length === 0) {
        return [];
    }

    const stats = new Map<
        string,
        {
            name: string;
            count: number;
            lastPlayedAt: string | null;
        }
    >();

    for (const play of plays) {
        const artist = play.tracks.artists;
        const existing = stats.get(artist.id);
        if (existing) {
            existing.count += 1;
            if (!existing.lastPlayedAt || play.played_at > existing.lastPlayedAt) {
                existing.lastPlayedAt = play.played_at;
            }
        } else {
            stats.set(artist.id, {
                name: artist.name,
                count: 1,
                lastPlayedAt: play.played_at ?? null,
            });
        }
    }

    return finalizeArtistHistory(stats, params);
}

export async function getTrackHistory(
    params: TrackHistoryQuery
): Promise<TrackHistoryEntry[]> {
    const plays = await fetchPlays(params.userId);
    if (plays.length === 0) {
        return [];
    }

    const stats = new Map<
        string,
        {
            trackName: string;
            artistId: string;
            artistName: string;
            count: number;
            lastPlayedAt: string | null;
        }
    >();

    for (const play of plays) {
        const track = play.tracks;
        const artist = track.artists;
        const existing = stats.get(track.id);
        if (existing) {
            existing.count += 1;
            if (!existing.lastPlayedAt || play.played_at > existing.lastPlayedAt) {
                existing.lastPlayedAt = play.played_at;
            }
        } else {
            stats.set(track.id, {
                trackName: track.name,
                artistId: artist.id,
                artistName: artist.name,
                count: 1,
                lastPlayedAt: play.played_at ?? null,
            });
        }
    }

    return finalizeTrackHistory(stats, params);
}

async function fetchPlays(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("plays")
        .select(
            `
        played_at,
        tracks!inner (
            id,
            name,
            artist_id,
            artists!inner (
                id,
                name
            )
        )
    `
        )
        .eq("user_id", userId)
        .order("played_at", { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch plays: ${error.message}`);
    }

    return data ?? [];
}

function finalizeArtistHistory(
    stats: Map<
        string,
        {
            name: string;
            count: number;
            lastPlayedAt: string | null;
        }
    >,
    params: ArtistHistoryQuery
): ArtistHistoryEntry[] {
    const direction = params.direction ?? "top";
    const minPlays = params.minPlays ?? 1;
    const offset = params.offset ?? 0;
    const limit = params.limit ?? DEFAULT_LIMIT;

    const entries = Array.from(stats.entries())
        .map(([artistId, info]) => ({
            artistId,
            artistName: info.name,
            playCount: info.count,
            lastPlayedAt: info.lastPlayedAt,
        }))
        .filter((entry) => entry.playCount >= minPlays);

    sortEntries(entries, direction);

    return entries.slice(offset, offset + limit);
}

function finalizeTrackHistory(
    stats: Map<
        string,
        {
            trackName: string;
            artistId: string;
            artistName: string;
            count: number;
            lastPlayedAt: string | null;
        }
    >,
    params: TrackHistoryQuery
): TrackHistoryEntry[] {
    const direction = params.direction ?? "top";
    const minPlays = params.minPlays ?? 1;
    const offset = params.offset ?? 0;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const artistFilter = params.artist?.toLowerCase();

    const entries = Array.from(stats.entries())
        .map(([trackId, info]) => ({
            trackId,
            trackName: info.trackName,
            artistId: info.artistId,
            artistName: info.artistName,
            playCount: info.count,
            lastPlayedAt: info.lastPlayedAt,
        }))
        .filter((entry) => entry.playCount >= minPlays)
        .filter((entry) =>
            artistFilter ? entry.artistName.toLowerCase().includes(artistFilter) : true
        );

    sortEntries(entries, direction);

    return entries.slice(offset, offset + limit);
}

function sortEntries<T extends { playCount: number; lastPlayedAt: string | null }>(
    entries: T[],
    direction: HistoryDirection
) {
    if (direction === "recent") {
        entries.sort((a, b) => {
            if (!a.lastPlayedAt && !b.lastPlayedAt) return 0;
            if (!a.lastPlayedAt) return 1;
            if (!b.lastPlayedAt) return -1;
            return b.lastPlayedAt.localeCompare(a.lastPlayedAt);
        });
        return;
    }

    entries.sort((a, b) => {
        if (direction === "bottom") {
            return a.playCount - b.playCount;
        }
        return b.playCount - a.playCount;
    });
}
