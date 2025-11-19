import type { FunctionTool } from "openai/resources/responses/responses";

import type { LastFmArtist, LastFmTrack } from "@/server/lastfm/client";

export type PlaylistTrack = {
    name: string;
    artist: string;
    image?: string | null;
    spotifyId?: string | null;
    uri?: string | null;
};

export type ToolName =
    | "getSimilarArtists"
    | "getArtistTopTracks"
    | "getTopTracksByTag"
    | "getSimilarTracks"
    | "getUserTopArtists"
    | "queryUserArtists"
    | "queryUserTracks";

export type HistoryDirection = "top" | "bottom" | "recent";

export type SimilarArtist = Pick<LastFmArtist, "name" | "url">;

export type MinimalTrack = {
    name: string;
    artist: string;
    image?: string | null;
};

export type GetSimilarArtistsArgs = {
    artist: string;
    limit: number;
};

export type GetSimilarArtistsResult = {
    artists: SimilarArtist[];
};

export type GetArtistTopTracksArgs = {
    artist: string;
    limit: number;
};

export type GetTopTracksByTagArgs = {
    tag: string;
    limit: number;
};

export type GetSimilarTracksArgs = {
    artist: string;
    track: string;
    limit: number;
};

export type GetTracksResult = {
    tracks: MinimalTrack[];
};

export type GetUserTopArtistsArgs = {
    limit: number;
};

export type UserArtistsQueryArgs = {
    direction?: HistoryDirection;
    limit?: number;
    minPlays?: number;
    offset?: number;
};

export type UserTracksQueryArgs = {
    direction?: HistoryDirection;
    limit?: number;
    minPlays?: number;
    artist?: string;
    offset?: number;
};

export type GetUserTopArtistsResult = {
    artists: {
        name: string;
        playCount: number;
    }[];
};

export type UserArtistsQueryResult = {
    artists: {
        id: string;
        name: string;
        playCount: number;
        lastPlayedAt: string | null;
    }[];
};

export type UserTracksQueryResult = {
    tracks: {
        id: string;
        name: string;
        artist: string;
        playCount: number;
        lastPlayedAt: string | null;
    }[];
};

export type ToolArgsMap = {
    getSimilarArtists: GetSimilarArtistsArgs;
    getArtistTopTracks: GetArtistTopTracksArgs;
    getTopTracksByTag: GetTopTracksByTagArgs;
    getSimilarTracks: GetSimilarTracksArgs;
    getUserTopArtists: GetUserTopArtistsArgs;
    queryUserArtists: UserArtistsQueryArgs;
    queryUserTracks: UserTracksQueryArgs;
};

export type ToolResultMap = {
    getSimilarArtists: GetSimilarArtistsResult;
    getArtistTopTracks: GetTracksResult;
    getTopTracksByTag: GetTracksResult;
    getSimilarTracks: GetTracksResult;
    getUserTopArtists: GetUserTopArtistsResult;
    queryUserArtists: UserArtistsQueryResult;
    queryUserTracks: UserTracksQueryResult;
};

export type FunctionExecutor<TName extends ToolName = ToolName> = (
    args: ToolArgsMap[TName]
) => Promise<ToolResultMap[TName]>;

export type ToolLogEntry<TName extends ToolName = ToolName> = {
    call: {
        name: TName;
        args: ToolArgsMap[TName];
    };
    result: ToolResultMap[TName];
};

export type PlaylistGenerationDebug = {
    toolLog: ToolLogEntry[];
    rawResponse?: unknown;
};

export type PlaylistGenerationResult = {
    name: string;
    tracks: PlaylistTrack[];
    debug?: PlaylistGenerationDebug;
};

export type ToolExecutors = {
    [K in ToolName]: FunctionExecutor<K>;
};

export type PlaylistToolset = {
    tools: FunctionTool[];
    executors: ToolExecutors;
};
