import type {
    EasyInputMessage,
    ResponseFunctionToolCallItem,
    ResponseFunctionToolCallOutputItem,
    ResponseOutputItem,
    ResponseOutputMessage,
} from "openai/resources/responses/responses";

import type {
    PlaylistToolset,
    PlaylistTrack,
    ToolArgsMap,
    ToolName,
} from "./types";

export type ConversationItem =
    | EasyInputMessage
    | ResponseOutputItem
    | ResponseFunctionToolCallOutputItem;

export const FINAL_RESPONSE_INSTRUCTION =
    'After exploring the user\'s listening history and running any helpful Last.fm tools (artist info, tag clusters, top charts), respond only with a JSON object of the form {"name": string, "tracks":[{ "name": string, "artist": string, "image"?: string }]}. Give the playlist a fun, descriptive title.';

export function createMessage(
    role: EasyInputMessage["role"],
    content: string
): EasyInputMessage {
    return {
        role,
        content,
        type: "message",
    };
}

export function createFunctionResult(
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

export function isFunctionCallItem(
    item: ResponseOutputItem
): item is ResponseFunctionToolCallItem {
    return item.type === "function_call";
}

export function isKnownTool(name: string, toolset: PlaylistToolset): name is ToolName {
    return name in toolset.executors;
}

export function parseFunctionArgs<TName extends ToolName>(
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

export function extractTextResponse(response: {
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

export function parsePlaylistResponse(payload: string): {
    name: string;
    tracks: PlaylistTrack[];
} {
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
