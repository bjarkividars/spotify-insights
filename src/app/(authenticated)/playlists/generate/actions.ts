"use server";

import OpenAI from "openai";
import type {
    EasyInputMessage,
    FunctionTool,
    ResponseFunctionToolCallItem,
    ResponseFunctionToolCallOutputItem,
    ResponseOutputItem,
} from "openai/resources/responses/responses";

import { getTopArtistsData } from "@/server/plays/top-artists";
import { enrichTracksWithSpotifyData } from "@/server/spotify/tracks";
import { createClient } from "@/utils/supabase/server";

import { createPlaylistToolset } from "./toolset";
import { buildSystemPrompt, buildUserPrompt, summarizeTopArtists } from "./prompts";
import type {
    PlaylistGenerationResult,
    PlaylistTrack,
    PlaylistToolset,
    ToolArgsMap,
    ToolLogEntry,
    ToolName,
} from "./types";

export type { PlaylistGenerationResult } from "./types";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const FINAL_RESPONSE_INSTRUCTION =
    'Respond only with a JSON object of the form {"name": string, "tracks":[{ "name": string, "artist": string, "image"?: string }]}. Give the playlist a fun, descriptive title.';

type ConversationItem =
    | EasyInputMessage
    | ResponseOutputItem
    | ResponseFunctionToolCallOutputItem;

export async function generatePlaylistAction(
    userInput: string
): Promise<PlaylistGenerationResult> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
    }

    const topArtists = await getTopArtistsData(user.id, 50);
    const toolset = createPlaylistToolset({ userId: user.id, topArtists });

    const conversation: ConversationItem[] = [
        createMessage("system", buildSystemPrompt()),
        createMessage("user", buildUserPrompt(userInput, summarizeTopArtists(topArtists))),
    ];

    const { updatedConversation, toolLog } = await runPlanningStep(
        conversation,
        toolset
    );

    const { playlist, rawText } = await requestFinalPlaylist(
        updatedConversation,
        toolset.tools
    );

    let hydratedTracks = playlist.tracks;
    try {
        hydratedTracks = await enrichTracksWithSpotifyData(user.id, playlist.tracks);
    } catch (error) {
        console.error("Failed to enrich tracks with Spotify metadata", error);
    }

    return {
        name: playlist.name,
        tracks: hydratedTracks,
        debug: {
            toolLog,
            rawResponse: rawText,
        },
    };
}

async function runPlanningStep(
    baseConversation: ConversationItem[],
    toolset: PlaylistToolset
): Promise<{
    updatedConversation: ConversationItem[];
    toolLog: ToolLogEntry[];
}> {
    const conversation = [...baseConversation];
    const response = await openai.responses.create({
        model: "gpt-5.1",
        input: conversation,
        tools: toolset.tools,
    });

    if (response.output?.length) {
        conversation.push(...response.output);
    }

    const toolLog: ToolLogEntry[] = [];
    if (!response.output?.length) {
        return { updatedConversation: conversation, toolLog };
    }

    for (const item of response.output) {
        if (!isFunctionCallItem(item)) {
            continue;
        }

        if (!isKnownTool(item.name, toolset)) {
            throw new Error(`Unhandled function call: ${item.name}`);
        }

        const toolName = item.name;
        const args = parseFunctionArgs(item, toolName);
        const result = await executeTool(toolName, args, toolset);

        toolLog.push({
            call: {
                name: item.name,
                args,
            },
            result,
        });

        conversation.push(createFunctionResult(item, JSON.stringify(result)));
    }

    return { updatedConversation: conversation, toolLog };
}

async function requestFinalPlaylist(
    conversation: ConversationItem[],
    tools: FunctionTool[]
): Promise<{ playlist: { name: string; tracks: PlaylistTrack[] }; rawText: string }> {
    const response = await openai.responses.create({
        model: "gpt-5.1",
        instructions: FINAL_RESPONSE_INSTRUCTION,
        input: conversation,
        tools,
    });

    const text = response.output_text?.trim();

    if (!text) {
        throw new Error("Model did not return playlist output.");
    }

    return {
        playlist: parsePlaylistResponse(text),
        rawText: text,
    };
}

function parsePlaylistResponse(payload: string): { name: string; tracks: PlaylistTrack[] } {
    let parsed: unknown;
    try {
        parsed = JSON.parse(payload);
    } catch (error) {
        throw new Error(
            `Unable to parse model response as JSON. Received: ${payload}`
        );
    }

    if (!parsed || typeof parsed !== "object") {
        throw new Error("Model response missing body.");
    }

    const { name, tracks } = parsed as { name?: unknown; tracks?: unknown[] };

    if (typeof name !== "string" || !name.trim()) {
        throw new Error("Model response did not include a playlist name.");
    }

    if (!Array.isArray(tracks)) {
        throw new Error("Model response did not contain a tracks array.");
    }

    const sanitizedTracks = tracks.map((track, index) => {
        if (
            !track ||
            typeof track !== "object" ||
            typeof (track as { name?: unknown }).name !== "string" ||
            typeof (track as { artist?: unknown }).artist !== "string"
        ) {
            throw new Error(`Track at index ${index} is missing required fields.`);
        }

        const candidate = track as {
            name: string;
            artist: string;
            image?: unknown;
        };

        const sanitized: PlaylistTrack = {
            name: candidate.name,
            artist: candidate.artist,
        };

        if (typeof candidate.image === "string") {
            sanitized.image = candidate.image;
        } else if (candidate.image === null) {
            sanitized.image = null;
        }

        return sanitized;
    });

    if (sanitizedTracks.length === 0) {
        throw new Error("Model response did not include any tracks.");
    }

    return {
        name: name.trim(),
        tracks: sanitizedTracks,
    };
}

function isFunctionCallItem(
    item: ResponseOutputItem
): item is ResponseFunctionToolCallItem {
    return item.type === "function_call";
}

function isKnownTool(name: string, toolset: PlaylistToolset): name is ToolName {
    return name in toolset.executors;
}

function parseFunctionArgs<TName extends ToolName>(
    item: ResponseFunctionToolCallItem,
    name: TName
): ToolArgsMap[TName] {
    if (!item.arguments?.length) {
        throw new Error(`Missing arguments for ${name}`);
    }

    try {
        const parsed = JSON.parse(item.arguments) as ToolArgsMap[TName];
        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse arguments for ${name}: ${item.arguments}`);
    }
}

async function executeTool<TName extends ToolName>(
    name: TName,
    args: ToolArgsMap[TName],
    toolset: PlaylistToolset
) {
    return toolset.executors[name](args);
}

function createMessage(role: EasyInputMessage["role"], content: string): EasyInputMessage {
    return {
        role,
        content,
        type: "message",
    };
}

function createFunctionResult(
    call: ResponseFunctionToolCallItem,
    output: string
): ResponseFunctionToolCallOutputItem {
    return {
        id: `fc_${call.call_id}`,
        type: "function_call_output",
        call_id: call.call_id,
        output,
    };
}
