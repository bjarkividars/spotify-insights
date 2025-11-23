"use server";

import OpenAI from "openai";
import type {
    EasyInputMessage,
    FunctionTool,
    ResponseFunctionToolCallItem,
    ResponseFunctionToolCallOutputItem,
    ResponseOutputItem,
    ResponseOutputMessage,
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
    'After exploring the user\'s listening history and running any helpful Last.fm tools (artist info, tag clusters, top charts), respond only with a JSON object of the form {"name": string, "tracks":[{ "name": string, "artist": string, "image"?: string }]}. Give the playlist a fun, descriptive title.';
const LOG_PREFIX = "[playlist-generation]";

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

    logPlaylistDebug("Starting playlist generation", {
        userId: user.id,
        userInput,
    });

    const topArtists = await getTopArtistsData(user.id, 50);
    const toolset = createPlaylistToolset({ userId: user.id, topArtists });

    const conversation: ConversationItem[] = [
        createMessage("system", buildSystemPrompt()),
        createMessage("user", buildUserPrompt(userInput)),
    ];

    const { updatedConversation, toolLog } = await runPlanningStep(
        conversation,
        toolset
    );

    if (toolLog.length === 0) {
        logPlaylistDebug("Model did not call any tools during planning.");
    } else {
        toolLog.forEach((log, index) => {
            logPlaylistDebug(`Tool call #${index + 1}: ${log.call.name}`, {
                args: log.call.args,
                result: log.result,
            });
        });
    }

    const { playlist, rawText } = await requestFinalPlaylist(
        updatedConversation,
        toolset
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
    logPlaylistDebug("Requesting planning step from model", {
        conversationLength: baseConversation.length,
        toolCount: toolset.tools.length,
    });

    const conversation = [...baseConversation];
    const response = await openai.responses.create({
        model: "gpt-5.1",
        reasoning: {
            effort: "medium",
        },
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
        logPlaylistDebug("Executing tool requested by model", {
            callId: item.call_id,
            tool: toolName,
            args,
        });
        const result = await executeTool(toolName, args, toolset);
        logPlaylistDebug("Tool execution completed", {
            callId: item.call_id,
            tool: toolName,
            result,
        });

        toolLog.push({
            call: {
                name: item.name,
                args,
            },
            result,
        });

        conversation.push(createFunctionResult(item, JSON.stringify(result)));
    }

    logPlaylistDebug("Finished planning step", { toolCallCount: toolLog.length });

    return { updatedConversation: conversation, toolLog };
}

async function requestFinalPlaylist(
    conversation: ConversationItem[],
    toolset: PlaylistToolset,
    attempt = 1,
    toolIteration = 0
): Promise<{ playlist: { name: string; tracks: PlaylistTrack[] }; rawText: string }> {
    logPlaylistDebug("Requesting final playlist from model", {
        attempt,
        toolIteration,
        conversationLength: conversation.length,
    });

    const response = await openai.responses.create({
        model: "gpt-5.1",
        instructions: FINAL_RESPONSE_INSTRUCTION,
        input: conversation,
        tools: toolset.tools,
    });

    if (response.output?.length) {
        conversation.push(...response.output);
    }

    const functionCalls =
        response.output?.filter((item): item is ResponseFunctionToolCallItem =>
            isFunctionCallItem(item)
        ) ?? [];

    if (functionCalls.length) {
        const nextConversation: ConversationItem[] = [...conversation];
        const MAX_TOOL_ITERATIONS = 3;

        if (toolIteration >= MAX_TOOL_ITERATIONS) {
            throw new Error("Exceeded tool call iterations while requesting final playlist.");
        }

        for (const call of functionCalls) {
            if (!isKnownTool(call.name, toolset)) {
                throw new Error(`Unhandled function call during final request: ${call.name}`);
            }

            const args = parseFunctionArgs(call, call.name);
            logPlaylistDebug("Executing tool during final request", {
                callId: call.call_id,
                tool: call.name,
                args,
            });

            const result = await executeTool(call.name, args, toolset);
            logPlaylistDebug("Tool during final request completed", {
                callId: call.call_id,
                tool: call.name,
                result,
            });

            nextConversation.push(createFunctionResult(call, JSON.stringify(result)));
        }

        return requestFinalPlaylist(nextConversation, toolset, attempt, toolIteration + 1);
    }

    const text = extractTextResponse(response).trim();

    if (!text) {
        return retryFinalPlaylist(
            conversation,
            toolset,
            attempt,
            "Model did not return playlist output."
        );
    }

    try {
        return {
            playlist: parsePlaylistResponse(text),
            rawText: text,
        };
    } catch (error) {
        return retryFinalPlaylist(
            conversation,
            toolset,
            attempt,
            error instanceof Error ? error.message : String(error)
        );
    }
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

function extractTextResponse(response: {
    output_text?: string | null;
    output?: ResponseOutputItem[];
}): string {
    if (response.output_text?.trim()) {
        return response.output_text.trim();
    }

    if (!response.output?.length) {
        return "";
    }

    const textSegments: string[] = [];
    for (const item of response.output) {
        if (item.type === "message") {
            const message = item as ResponseOutputMessage;
            for (const content of message.content) {
                if (content.type === "output_text" && content.text) {
                    textSegments.push(content.text);
                }
            }
        }
    }

    return textSegments.join("\n");
}

async function retryFinalPlaylist(
    conversation: ConversationItem[],
    toolset: PlaylistToolset,
    attempt: number,
    reason: string
) {
    const MAX_ATTEMPTS = 2;
    if (attempt >= MAX_ATTEMPTS) {
        throw new Error(`Model did not return playlist output. Last error: ${reason}`);
    }

    const retryConversation: ConversationItem[] = [
        ...conversation,
        createMessage(
            "system",
            `Reminder: respond ONLY with valid JSON {"name": string, "tracks": [{ "name": string, "artist": string, "image"?: string }]}. Previous attempt failed because: ${reason}`
        ),
    ];

    return requestFinalPlaylist(retryConversation, toolset, attempt + 1);
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

function logPlaylistDebug(message: string, details?: unknown) {
    if (typeof details === "undefined") {
        console.info(LOG_PREFIX, message);
        return;
    }

    console.info(LOG_PREFIX, message, details);
}
