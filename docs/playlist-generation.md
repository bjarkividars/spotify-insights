# Playlist Generation Flow


## High-level flow
- User submits a prompt from the global input. The client POSTs to `/api/playlists/generate` with `{ input }`.
- The API builds a conversation with:
  - System prompt (`buildSystemPrompt`) that mandates using history + discovery tools, returning only JSON.
  - User prompt (`buildUserPrompt`) echoing the user request.
- Supabase auth check ensures a signed-in user; fetch top artists (`getTopArtistsData`) to seed context.
- A toolset is instantiated for that user (`createPlaylistToolset`), pairing OpenAI tool definitions with server-side executors.
- **Planning step**: One non-streaming OpenAI call (`responses.create`) may invoke tools to explore history/Last.fm. Tool calls are executed server-side; results are fed back into the conversation and streamed to the client as `tool_call`/`tool_result` events for debug/telemetry.
- **Finalization step**: A streaming OpenAI call (`responses.stream`) with the accumulated conversation + tools:
  - Streams text deltas; if additional tool calls appear, they’re executed, appended, and the model is retried (max 3 tool iterations, 2 parse attempts).
  - The model must return JSON `{ name, tracks[] }`; failures trigger a retry with a system reminder.
  - The playlist name is emitted as a `playlist` event to the client.
- **Hydration**: Tracks are matched against Spotify sequentially (`hydrateTracksSequentially`):
  - Each hydrated track (with `spotifyId`/`uri`/image) is streamed immediately via `track` events.
  - If Spotify lookup fails, raw tracks are still sent with an `error` event noting the fallback.
- **UI**: The client reader appends tracks as events arrive; the overlay shows name + per-track stream. Body scroll is locked while overlay is visible.

## Prompts
- System (`buildSystemPrompt`): Requires querying both user history and Last.fm discovery tools; blend familiarity + discovery; 12–18 tracks typical; fun title; respond only with JSON (no prose/markdown).
- User (`buildUserPrompt`): Simple echo of the user’s request string.

## Event schema sent to the client
- `status`: planning | finalizing | hydrating | done
- `tool_call`: { callId, name, args }
- `tool_result`: { callId, name }
- `playlist`: { name }
- `track`: { track, index } (emitted incrementally during Spotify hydration)
- `error`: { message }

## Available tools (OpenAI function tools)
All are defined in `createPlaylistToolset` and backed by Last.fm plus user history:
- `getSimilarArtists(artist, limit=5)`: Similar artists for discovery.
- `getArtistTopTracks(artist, limit=5)`: Top tracks for an artist.
- `getTopTracksByTag(tag, limit=10)`: Genre/tag top tracks.
- `getSimilarTracks(artist, track, limit=10)`: Similar songs to a seed track.
- `getUserTopArtists(limit=10)`: User’s top artists by play count.
- `queryUserArtists(direction=top|bottom|recent, limit=10, minPlays?, offset?)`: User artist history with filters.
- `queryUserTracks(direction=top|bottom|recent, limit=10, minPlays?, artist?, offset?)`: User track history with filters.
- `getArtistInfo(artist)`: Bio summary + similar artists.
- `getArtistTopTags(artist, limit=10)`: Frequent tags for an artist.
- `getTrackTopTags(artist, track, limit=10)`: Frequent tags for a track.
- `getTagSimilarTags(tag, limit=10)`: Neighboring tags/genres.
- `getTagTopArtists(tag, limit=10)`: Top artists for a tag.
- `getGlobalTopTracks(limit=12)`: Global charting tracks.

## Parsing and safety guards
- JSON is parsed via `parsePlaylistResponse`; missing/invalid fields throw and trigger a retry (max 2 attempts).
- Tool iterations are capped (3) to avoid loops.
- Empty tracklists or names raise errors.

## Hydration details
- Spotify match uses `findSpotifyMatch` search + heuristic best-match selection.
- Only tracks with a Spotify URI/ID are emitted; unmatched entries are dropped.
- Hydration emits tracks as soon as each lookup completes (sequentially) to keep the overlay filling progressively.

## Files to reference
- Prompts: `src/app/(authenticated)/playlists/generate/prompts.ts`
- Tool definitions/executors: `src/app/(authenticated)/playlists/generate/toolset.ts`
- Types: `src/app/(authenticated)/playlists/generate/types.ts`
- Flow helpers: `src/app/(authenticated)/playlists/generate/flow.ts`
- API route (stream + hydration): `src/app/api/playlists/generate/route.ts`
- Spotify hydration helpers: `src/server/spotify/tracks.ts`
