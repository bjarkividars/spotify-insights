import type { FunctionTool } from "openai/resources/responses/responses";

import type {
    LastFmArtist,
    LastFmTrack,
} from "@/server/lastfm/client";
import { lastFm } from "@/server/lastfm/client";
import type { TopArtist } from "@/server/plays/top-artists";
import { getArtistHistory, getTrackHistory } from "@/server/plays/listening-history";

import type {
    GetArtistTopTracksArgs,
    GetSimilarArtistsArgs,
    GetSimilarTracksArgs,
    GetTopTracksByTagArgs,
    GetUserTopArtistsArgs,
    MinimalTrack,
    PlaylistToolset,
    ToolExecutors,
    ToolArgsMap,
    UserArtistsQueryArgs,
    UserTracksQueryArgs,
} from "./types";

const TOOL_DEFINITIONS: FunctionTool[] = [
    {
        type: "function",
        name: "getSimilarArtists",
        description: "Fetch similar artists for discovery.",
        parameters: {
            type: "object",
            properties: {
                artist: {
                    type: "string",
                    description: "Seed artist name.",
                },
                limit: {
                    type: "integer",
                    description: "How many similar artists to fetch (default 5).",
                },
            },
            additionalProperties: false,
            required: ["artist", "limit"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getArtistTopTracks",
        description: "Fetch the top tracks for an artist.",
        parameters: {
            type: "object",
            properties: {
                artist: {
                    type: "string",
                    description: "The artist name.",
                },
                limit: {
                    type: "integer",
                    description: "Max number of tracks to fetch (default 5).",
                },
            },
            additionalProperties: false,
            required: ["artist", "limit"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getTopTracksByTag",
        description: "Fetch top tracks for a Last.fm tag / genre.",
        parameters: {
            type: "object",
            properties: {
                tag: {
                    type: "string",
                    description: "Tag or genre keyword.",
                },
                limit: {
                    type: "integer",
                    description: "Max number of tracks (default 10).",
                },
            },
            additionalProperties: false,
            required: ["tag", "limit"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getSimilarTracks",
        description: "Fetch similar tracks for a seed song.",
        parameters: {
            type: "object",
            properties: {
                artist: {
                    type: "string",
                    description: "Track artist.",
                },
                track: {
                    type: "string",
                    description: "Track name.",
                },
                limit: {
                    type: "integer",
                    description: "Max number of similar tracks (default 10).",
                },
            },
            additionalProperties: false,
            required: ["artist", "track", "limit"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getUserTopArtists",
        description: "Return the user's top artists by play count.",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "integer",
                    description: "How many artists to return (default 10).",
                },
            },
            additionalProperties: false,
            required: ["limit"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "queryUserArtists",
        description:
            "Inspect the user's listening history for artists with flexible sorting and filters.",
        parameters: {
            type: "object",
            properties: {
                direction: {
                    type: "string",
                    enum: ["top", "bottom", "recent"],
                    description: "Sort by top plays, bottom plays, or most recently played.",
                },
                limit: {
                    type: "integer",
                    description: "Number of artists to return (default 10).",
                },
                minPlays: {
                    type: "integer",
                    description: "Minimum play count to include (default 1).",
                },
                offset: {
                    type: "integer",
                    description: "Pagination offset for artist results.",
                },
            },
            additionalProperties: false,
        },
        strict: false,
    },
    {
        type: "function",
        name: "queryUserTracks",
        description:
            "Inspect the user's listening history for tracks with flexible sorting and filters.",
        parameters: {
            type: "object",
            properties: {
                direction: {
                    type: "string",
                    enum: ["top", "bottom", "recent"],
                    description: "Sort by top plays, bottom plays, or most recently played.",
                },
                limit: {
                    type: "integer",
                    description: "Number of tracks to return (default 10).",
                },
                minPlays: {
                    type: "integer",
                    description: "Minimum play count to include (default 1).",
                },
                artist: {
                    type: "string",
                    description: "Optional artist name substring to filter tracks.",
                },
                offset: {
                    type: "integer",
                    description: "Pagination offset for track results.",
                },
            },
            additionalProperties: false,
        },
        strict: false,
    },
    {
        type: "function",
        name: "getArtistInfo",
        description: "Fetch Last.fm biography + similar artists for a given artist.",
        parameters: {
            type: "object",
            properties: {
                artist: {
                    type: "string",
                    description: "Artist name to inspect.",
                },
            },
            additionalProperties: false,
            required: ["artist"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getArtistTopTags",
        description: "Fetch frequently used tags for an artist.",
        parameters: {
            type: "object",
            properties: {
                artist: {
                    type: "string",
                    description: "Artist name.",
                },
                limit: {
                    type: "integer",
                    description: "How many tags to fetch (default 10).",
                },
            },
            additionalProperties: false,
            required: ["artist"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getTrackTopTags",
        description: "Fetch frequently used tags for a track.",
        parameters: {
            type: "object",
            properties: {
                artist: {
                    type: "string",
                    description: "Track artist.",
                },
                track: {
                    type: "string",
                    description: "Track name.",
                },
                limit: {
                    type: "integer",
                    description: "How many tags to fetch (default 10).",
                },
            },
            additionalProperties: false,
            required: ["artist", "track"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getTagSimilarTags",
        description: "Fetch neighboring Last.fm tags to widen genre discovery.",
        parameters: {
            type: "object",
            properties: {
                tag: {
                    type: "string",
                    description: "Seed tag/genre.",
                },
                limit: {
                    type: "integer",
                    description: "How many related tags to fetch (default 10).",
                },
            },
            additionalProperties: false,
            required: ["tag"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getTagTopArtists",
        description: "Fetch top artists for a Last.fm tag / genre.",
        parameters: {
            type: "object",
            properties: {
                tag: {
                    type: "string",
                    description: "Tag or genre keyword.",
                },
                limit: {
                    type: "integer",
                    description: "Max number of artists (default 10).",
                },
            },
            additionalProperties: false,
            required: ["tag"],
        },
        strict: false,
    },
    {
        type: "function",
        name: "getGlobalTopTracks",
        description: "Fetch current global top tracks per Last.fm charts.",
        parameters: {
            type: "object",
            properties: {
                limit: {
                    type: "integer",
                    description: "Max number of tracks (default 10).",
                },
            },
            additionalProperties: false,
        },
        strict: false,
    },
];

const DEFAULT_LIMITS = {
    similarArtists: 5,
    artistTopTracks: 5,
    tagTopTracks: 10,
    similarTracks: 10,
    userTopArtists: 10,
    userArtistHistory: 10,
    userTrackHistory: 10,
    artistTags: 10,
    trackTags: 10,
    tagTopArtists: 10,
    globalTopTracks: 12,
};

type ToolsetOptions = {
    userId: string;
    topArtists: TopArtist[];
};

export function createPlaylistToolset({
    userId,
    topArtists,
}: ToolsetOptions): PlaylistToolset {
    const executors: ToolExecutors = {
        async getSimilarArtists({
            artist,
            limit = DEFAULT_LIMITS.similarArtists,
        }: GetSimilarArtistsArgs) {
            const similar = (await lastFm.getSimilarArtists(artist, limit)) as LastFmArtist[];
            return {
                artists: similar.map((entry) => ({
                    name: entry.name,
                    url: entry.url,
                })),
            };
        },
        async getArtistTopTracks({
            artist,
            limit = DEFAULT_LIMITS.artistTopTracks,
        }: GetArtistTopTracksArgs) {
            const tracks = (await lastFm.getArtistTopTracks(
                artist,
                limit
            )) as LastFmTrack[];
            return {
                tracks: tracks.map((track) => mapTrack(track, artist)),
            };
        },
        async getTopTracksByTag({
            tag,
            limit = DEFAULT_LIMITS.tagTopTracks,
        }: GetTopTracksByTagArgs) {
            const tracks = (await lastFm.getTopTracksByTag(tag, limit)) as LastFmTrack[];
            return {
                tracks: tracks.map((track) => mapTrack(track, track.artist.name)),
            };
        },
        async getSimilarTracks({
            artist,
            track,
            limit = DEFAULT_LIMITS.similarTracks,
        }: GetSimilarTracksArgs) {
            const tracks = (await lastFm.getSimilarTracks(artist, track, limit)) as LastFmTrack[];
            return {
                tracks: tracks.map((similar) => mapTrack(similar, similar.artist.name)),
            };
        },
        async getUserTopArtists({
            limit = DEFAULT_LIMITS.userTopArtists,
        }: GetUserTopArtistsArgs) {
            return {
                artists: topArtists.slice(0, limit).map((artist) => ({
                    name: artist.artist_name,
                    playCount: artist.play_count,
                })),
            };
        },
        async queryUserArtists({
            direction = "top",
            limit = DEFAULT_LIMITS.userArtistHistory,
            minPlays,
            offset,
        }: UserArtistsQueryArgs) {
            const artists = await getArtistHistory({
                userId,
                direction,
                limit,
                minPlays,
                offset,
            });

            return {
                artists: artists.map((artist) => ({
                    id: artist.artistId,
                    name: artist.artistName,
                    playCount: artist.playCount,
                    lastPlayedAt: artist.lastPlayedAt,
                })),
            };
        },
        async queryUserTracks({
            direction = "top",
            limit = DEFAULT_LIMITS.userTrackHistory,
            minPlays,
            artist,
            offset,
        }: UserTracksQueryArgs) {
            const tracks = await getTrackHistory({
                userId,
                direction,
                limit,
                minPlays,
                artist,
                offset,
            });

            return {
                tracks: tracks.map((track) => ({
                    id: track.trackId,
                    name: track.trackName,
                    artist: track.artistName,
                    playCount: track.playCount,
                    lastPlayedAt: track.lastPlayedAt,
                })),
            };
        },
        async getArtistInfo({ artist }: ToolArgsMap["getArtistInfo"]) {
            const info = await lastFm.getArtistInfo(artist);
            return {
                info: info?.bio?.summary ? stripHtml(info.bio.summary) : undefined,
                similar:
                    info?.similar?.artist?.map((entry) => ({
                        name: entry.name,
                        url: entry.url,
                    })) ?? [],
            };
        },
        async getArtistTopTags({
            artist,
            limit = DEFAULT_LIMITS.artistTags,
        }: ToolArgsMap["getArtistTopTags"]) {
            const tags = await lastFm.getArtistTopTags(artist, limit);
            return {
                tags: tags.slice(0, limit).map((tag) => ({
                    name: tag.name,
                    count: tag.count,
                })),
            };
        },
        async getTrackTopTags({
            artist,
            track,
            limit = DEFAULT_LIMITS.trackTags,
        }: ToolArgsMap["getTrackTopTags"]) {
            const tags = await lastFm.getTrackTopTags(artist, track, limit);
            return {
                tags: tags.slice(0, limit).map((tag) => ({
                    name: tag.name,
                    count: tag.count,
                })),
            };
        },
        async getTagSimilarTags({
            tag,
            limit = DEFAULT_LIMITS.artistTags,
        }: ToolArgsMap["getTagSimilarTags"]) {
            const tags = await lastFm.getTagSimilarTags(tag, limit);
            return {
                tags: tags.slice(0, limit).map((entry) => ({
                    name: entry.name,
                })),
            };
        },
        async getTagTopArtists({
            tag,
            limit = DEFAULT_LIMITS.tagTopArtists,
        }: ToolArgsMap["getTagTopArtists"]) {
            const artists = await lastFm.getTagTopArtists(tag, limit);
            return {
                artists: artists.slice(0, limit).map((artist) => ({
                    name: artist.name,
                    url: artist.url,
                })),
            };
        },
        async getGlobalTopTracks({
            limit = DEFAULT_LIMITS.globalTopTracks,
        }: ToolArgsMap["getGlobalTopTracks"]) {
            const tracks = await lastFm.getGlobalTopTracks(limit);
            return {
                tracks: tracks.slice(0, limit).map((track) =>
                    mapTrack(track, track.artist.name)
                ),
            };
        },
    };

    return {
        executors,
        tools: [...TOOL_DEFINITIONS],
    };
}

function mapTrack(track: LastFmTrack, artist: string): MinimalTrack {
    return {
        name: track.name,
        artist,
        image: selectMediumImage(track),
    };
}

function selectMediumImage(track: LastFmTrack): string | undefined {
    return track.image?.find((img) => img.size === "medium")?.["#text"] || undefined;
}

function stripHtml(input: string): string {
    return input.replace(/<[^>]+>/g, "").trim();
}
