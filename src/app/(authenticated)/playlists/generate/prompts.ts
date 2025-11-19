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

1) Call tools as needed to understand the user's taste.
   - Use queryUserArtists/queryUserTracks to inspect top, bottom, or recent history slices.
2) Build a playlist that:
   - Matches the user's request.
   - Blends familiarity (their top artists) with discovery (similar artists, tags).
   - Typically contains 12–18 tracks unless the user specifies otherwise.
   - Has a fun, descriptive title (never something boring like "Playlist #1").
3) Finally, respond ONLY with a single JSON object of the form:
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

export function buildUserPrompt(userInput: string, topArtistSummary: string): string {
    return `
User request: "${userInput}"

User top artists (name (play_count)):
${topArtistSummary}
`.trim();
}
