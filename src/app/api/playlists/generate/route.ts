import OpenAI from "openai";
import type { Response, ResponseFunctionToolCallItem, ResponseOutputItem } from "openai/resources/responses/responses";
import { inspect } from "util";
import type { NextRequest } from "next/server";

import { getTopArtistsData } from "@/server/plays/top-artists";
import { hydrateTracksSequentially } from "@/server/spotify/tracks";
import { createClient } from "@/utils/supabase/server";

import { buildSystemPrompt, buildUserPrompt } from "@/app/(authenticated)/playlists/generate/prompts";
import { createPlaylistToolset } from "@/app/(authenticated)/playlists/generate/toolset";
import {
    ConversationItem,
    FINAL_RESPONSE_INSTRUCTION,
    createFunctionResult,
    createMessage,
    extractTextResponse,
    isFunctionCallItem,
    isKnownTool,
    parseFunctionArgs,
    parsePlaylistResponse,
} from "@/app/(authenticated)/playlists/generate/flow";
import type {
    PlaylistTrack,
    PlaylistToolset,
    ToolArgsMap,
    ToolLogEntry,
    ToolName,
} from "@/app/(authenticated)/playlists/generate/types";

export const runtime = "nodejs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type StreamEvent =
    | { type: "status"; status: "planning" | "finalizing" | "hydrating" | "done" }
    | { type: "tool_call"; callId: string; name: string; args: unknown }
    | { type: "tool_result"; callId: string; name: string }
    | { type: "playlist"; name: string }
    | { type: "track"; track: PlaylistTrack; index: number }
    | { type: "error"; message: string };

export async function POST(req: NextRequest) {
    if (!process.env.OPENAI_API_KEY) {
        return new Response("Missing OpenAI configuration", { status: 500 });
    }

    let input: string | undefined;
    try {
        const body = await req.json();
        input = typeof body?.input === "string" ? body.input.trim() : undefined;
    } catch {
        return new Response("Invalid JSON body", { status: 400 });
    }

    if (!input) {
        return new Response("Missing input", { status: 400 });
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const topArtists = await getTopArtistsData(user.id, 50);
    const toolset = createPlaylistToolset({ userId: user.id, topArtists });

    const conversation: ConversationItem[] = [
        createMessage("system", buildSystemPrompt()),
        createMessage("user", buildUserPrompt(input)),
    ];

    const stream = new ReadableStream({
        start: async (controller) => {
            const encoder = new TextEncoder();
            const send = (event: StreamEvent) => {
                controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            };

            try {
                send({ type: "status", status: "planning" });
                const planning = await runPlanningStepWithEvents(conversation, toolset, send);

                send({ type: "status", status: "finalizing" });
                const { playlist, rawText } = await requestFinalPlaylistStream({
                    conversation: planning.updatedConversation,
                    toolset,
                    send,
                });

                send({ type: "playlist", name: playlist.name });
                send({ type: "status", status: "hydrating" });

                try {
                    await hydrateTracksSequentially(user.id, playlist.tracks, async (track, index) => {
                        send({
                            type: "track",
                            track,
                            index,
                        });
                    });
                } catch (error) {
                    console.error("[playlist-generation-stream] Failed to enrich tracks", error);
                    send({
                        type: "error",
                        message:
                            "Generated playlist, but failed to enrich tracks with Spotify metadata. Showing raw results.",
                    });
                    playlist.tracks.forEach((track, index) =>
                        send({
                            type: "track",
                            track,
                            index,
                        })
                    );
                }

                // Include raw response last for any debuggers listening.
                if (process.env.NODE_ENV !== "production") {
                    console.info("[playlist-generation-stream] raw response", rawText);
                }

                send({ type: "status", status: "done" });
                controller.close();
            } catch (error) {
                console.error("[playlist-generation-stream] Error", error);
                send({
                    type: "error",
                    message: error instanceof Error ? error.message : "Unknown error",
                });
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

async function runPlanningStepWithEvents(
    baseConversation: ConversationItem[],
    toolset: PlaylistToolset,
    send: (event: StreamEvent) => void
): Promise<{
    updatedConversation: ConversationItem[];
    toolLog: ToolLogEntry[];
}> {
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
        conversation.push(...stripParsedArguments(response.output));
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
        send({
            type: "tool_call",
            callId: item.call_id,
            name: toolName,
            args,
        });

        const result = await executeTool(toolName, args, toolset);
        send({
            type: "tool_result",
            callId: item.call_id,
            name: toolName,
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

    return { updatedConversation: conversation, toolLog };
}

async function requestFinalPlaylistStream({
    conversation,
    toolset,
    send,
}: {
    conversation: ConversationItem[];
    toolset: PlaylistToolset;
    send: (event: StreamEvent) => void;
}): Promise<{ playlist: { name: string; tracks: PlaylistTrack[] }; rawText: string }> {
    const MAX_ATTEMPTS = 2;
    const MAX_TOOL_ITERATIONS = 3;
    let attempt = 1;
    let toolIteration = 0;
    let currentConversation: ConversationItem[] = [...conversation];

    while (true) {
        const { response, rawText } = await streamResponseOnce({
            conversation: currentConversation,
            toolset,
        });

        if (response.output?.length) {
            currentConversation.push(...stripParsedArguments(response.output));
        }

        const functionCalls =
            response.output?.filter((item): item is ResponseFunctionToolCallItem =>
                isFunctionCallItem(item)
            ) ?? [];

        if (functionCalls.length) {
            if (toolIteration >= MAX_TOOL_ITERATIONS) {
                throw new Error("Exceeded tool call iterations while requesting final playlist.");
            }

            const nextConversation: ConversationItem[] = [...currentConversation];

            for (const call of functionCalls) {
                if (!isKnownTool(call.name, toolset)) {
                    throw new Error(`Unhandled function call during final request: ${call.name}`);
                }

                const args = parseFunctionArgs(call, call.name);
                send({
                    type: "tool_call",
                    callId: call.call_id,
                    name: call.name,
                    args,
                });

                const result = await executeTool(call.name, args, toolset);
                send({
                    type: "tool_result",
                    callId: call.call_id,
                    name: call.name,
                });

                nextConversation.push(createFunctionResult(call, JSON.stringify(result)));
            }

            toolIteration += 1;
            send({ type: "status", status: "finalizing" });
            currentConversation = nextConversation;
            continue;
        }

        const text = (rawText || extractTextResponse(response)).trim();

        if (text) {
            try {
                return {
                    playlist: parsePlaylistResponse(text),
                    rawText: text,
                };
            } catch (error) {
                if (attempt >= MAX_ATTEMPTS) {
                    throw error instanceof Error ? error : new Error(String(error));
                }
                attempt += 1;
                currentConversation = [
                    ...currentConversation,
                    createMessage(
                        "system",
                        `Reminder: respond ONLY with valid JSON {"name": string, "tracks": [{ "name": string, "artist": string, "image"?: string }]}. Previous attempt failed because: ${error instanceof Error ? error.message : String(error)
                        }`
                    ),
                ];
                send({ type: "status", status: "finalizing" });
                continue;
            }
        }

        if (attempt >= MAX_ATTEMPTS) {
            throw new Error("Model did not return playlist output.");
        }

        attempt += 1;
        currentConversation = [
            ...currentConversation,
            createMessage(
                "system",
                'Reminder: respond ONLY with valid JSON {"name": string, "tracks": [{ "name": string, "artist": string, "image"?: string }]}. Previous attempt failed because the response was empty.'
            ),
        ];
        send({ type: "status", status: "finalizing" });
    }
}

async function streamResponseOnce({
    conversation,
    toolset,
}: {
    conversation: ConversationItem[];
    toolset: PlaylistToolset;
}): Promise<{ response: Response; rawText: string }> {
    const stream = openai.responses.stream({
        model: "gpt-5.1",
        instructions: FINAL_RESPONSE_INSTRUCTION,
        input: conversation,
        tools: toolset.tools,
    });

    let rawText = "";

    for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
            rawText += event.delta;
        } else if (event.type === "response.failed") {
            throw new Error(event.response.error?.message ?? " streaming error");
        }
    }

    const response = await stream.finalResponse();
    return { response, rawText };
}

async function executeTool<TName extends ToolName>(
    name: TName,
    args: ToolArgsMap[TName],
    toolset: PlaylistToolset
) {
    const started = Date.now();
    try {
        const result = await toolset.executors[name](args);
        console.info(
            "[playlist-generation] tool",
            inspect(
                {
                    name,
                    args,
                    result,
                    durationMs: Date.now() - started,
                },
                { depth: null, maxArrayLength: null }
            )
        );
        return result;
    } catch (error) {
        console.error(
            "[playlist-generation] tool error",
            inspect(
                {
                    name,
                    args,
                    error,
                    durationMs: Date.now() - started,
                },
                { depth: null, maxArrayLength: null }
            )
        );
        throw error;
    }
}

function stripParsedArguments(items: ResponseOutputItem[]): ResponseOutputItem[] {
    return items.map((item) => {
        if (item.type === "function_call" && "parsed_arguments" in item) {
            const clone = { ...item } as Record<string, unknown>;
            delete clone.parsed_arguments;
            return clone as unknown as ResponseOutputItem;
        }
        return item;
    });
}
