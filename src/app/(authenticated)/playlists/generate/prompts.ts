import type { TopArtist } from "@/server/plays/top-artists";

const DEFAULT_TOP_ARTIST_LIMIT = 10;

export function summarizeTopArtists(
    topArtists: TopArtist[],
    limit = DEFAULT_TOP_ARTIST_LIMIT
): string {
    if (!topArtists.length) {
        return "No listening history available.";
    }

    return topArtists
        .slice(0, limit)
        .map((artist) => `${artist.artist_name} (${artist.play_count})`)
        .join(", ");
}

export function buildSystemPrompt(): string {
    return `
You are a playlist generator assistant.

You have access to tools that query Last.fm and the user's listening history.
Your job is to:

1) Always inspect the user's listening history AND Last.fm discovery signals before proposing tracks.
   - Use queryUserArtists/queryUserTracks to understand favorites, deep cuts, and recent plays.
   - Use Last.fm tag/global tools (artist info, tag clusters, top artists/tracks, global charts) when the user asks for something new or broader discovery.
2) Call multiple tools when needed; never guess track data.
3) Build a playlist that:
   - Matches the user's request.
   - Blends familiarity (their top artists) with discovery (similar artists, tags).
   - Typically contains 12–18 tracks unless the user specifies otherwise.
   - Has a fun, descriptive title (never something boring like "Playlist #1").
4) Finally, respond ONLY with a single JSON object of the form:
   {
     "name": string,
     "tracks": [
       { "name": string, "artist": string, "image"?: string },
       ...
     ]
   }

Do not fabricate track data: always use the tools to obtain actual tracks.
No commentary, no markdown – just the JSON object.
`.trim();
}

export function buildUserPrompt(userInput: string): string {
    return `
User request: "${userInput}"
`.trim();
}
