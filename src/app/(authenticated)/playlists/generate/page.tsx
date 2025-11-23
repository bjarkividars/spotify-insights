"use client";

import { ArrowRight, Loader2, Music, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { PlaylistOverlay } from "./PlaylistOverlay";
import { createSpotifyPlaylistAction } from "./create-spotify-playlist";
import type { PlaylistTrack } from "./types";

export type StreamStatus =
  | "idle"
  | "planning"
  | "finalizing"
  | "hydrating"
  | "streaming"
  | "done"
  | "error";

type StreamEvent =
  | { type: "status"; status: Exclude<StreamStatus, "error" | "streaming"> }
  | { type: "tool_call"; callId: string; name: string; args: unknown }
  | { type: "tool_result"; callId: string; name: string }
  | { type: "playlist"; name: string }
  | { type: "track"; track: PlaylistTrack; index: number }
  | { type: "error"; message: string };

const SUGGESTIONS = [
  "Only my top artists",
  "Complete discovery",
  "Rediscover old favorites",
  "My top genres mix",
  "High energy favorites",
  "Chill vibes",
];

export default function GeneratePlaylistPage() {
  const [input, setInput] = useState("");
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessUrl, setSaveSuccessUrl] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPlaylistName(null);
    setInput("");
    setTracks([]);
    setStatus("idle");
    setError(null);
    setShowSuggestions(true);
    setIsSaving(false);
    setSaveError(null);
    setSaveSuccessUrl(null);
  }, []);

  const handleEvent = useCallback((event: StreamEvent, runId: number) => {
    if (runId !== runIdRef.current) return;

    switch (event.type) {
      case "status":
        setStatus(event.status);
        if (event.status === "done") {
          setIsStreaming(false);
        }
        break;
      case "playlist":
        setPlaylistName(event.name);
        break;
      case "track":
        setStatus("streaming");
        setTracks((prev) => [...prev, event.track]);
        break;
      case "error":
        setError(event.message);
        setStatus("error");
        setIsStreaming(false);
        break;
      default:
        break;
    }
  }, []);

  const streamPlaylist = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      reset();
      setIsStreaming(true);
      setStatus("planning");
      setInput(trimmed);
      setShowSuggestions(false);
      setSaveError(null);
      setSaveSuccessUrl(null);

      const controller = new AbortController();
      abortRef.current = controller;
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;

      try {
        const response = await fetch("/api/playlists/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: trimmed }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const message = await response.text();
          throw new Error(message || "Failed to generate playlist");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value: chunk, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(chunk, { stream: true });

          const parts = buffer.split("\n");
          buffer = parts.pop() ?? "";

          for (const line of parts) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as StreamEvent;
            handleEvent(event, runId);
          }
        }

        if (buffer.trim()) {
          handleEvent(JSON.parse(buffer) as StreamEvent, runId);
        }

        setIsStreaming(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Failed to generate playlist";
        setError(message);
        setStatus("error");
        setIsStreaming(false);
      }
    },
    [handleEvent, reset]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void streamPlaylist(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    void streamPlaylist(suggestion);
  };

  const handleSaveToSpotify = useCallback(async () => {
    if (!playlistName || tracks.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccessUrl(null);
    try {
      const result = await createSpotifyPlaylistAction({
        name: playlistName,
        tracks,
      });
      setSaveSuccessUrl(result.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save to Spotify";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [playlistName, tracks]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const showResult = !!playlistName || tracks.length > 0;
  const overlayVisible = showResult || status === "streaming";

  const statusMessage = useStatusMessage(status);

  return (
    <div className="flex flex-col items-center justify-center flex-1 max-w-4xl mx-auto w-full py-8 px-4">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Generate from Your History
        </h1>
        <p className="text-foreground/70 text-lg">
          Create unique playlists based on your listening habits. Describe what
          you want, and we&apos;ll curate it from your data.
        </p>
      </div>

      <div className="w-full card p-2 shadow-soft bg-background border-primary/10 focus-within:border-primary/30 transition-colors duration-200">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="flex-1 w-full resize-none bg-transparent px-4 py-2 text-base placeholder:text-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="What are the vibes you're feeling..."
            rows={1}
            disabled={isStreaming}
          />
          <div className="pb-1 pr-2">
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="btn-primary h-8 w-8 p-0 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Generate playlist"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 transform translate-y-px -translate-x-px" />
              )}
            </button>
          </div>
        </form>
      </div>

      {showSuggestions && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isStreaming}
              className="group cursor-pointer text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 py-2 px-3 rounded-lg transition-colors text-left border border-transparent hover:border-border flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
              <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          ))}
        </div>
      )}

      {!showSuggestions && (
        <div className="mt-8 w-full flex items-center h-[88px] justify-center gap-2 text-sm text-foreground/70">
          {status === "error" ? (
            <Music className="w-4 h-4" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {overlayVisible && (
        <PlaylistOverlay
          playlistName={playlistName}
          tracks={tracks}
          status={status}
          onClose={reset}
          onSave={handleSaveToSpotify}
          isSaving={isSaving}
          saveError={saveError}
          saveSuccessUrl={saveSuccessUrl}
        />
      )}
    </div>
  );
}

function useStatusMessage(status: StreamStatus) {
  const map: Record<StreamStatus, string | string[]> = {
    idle: "Waiting for your prompt",
    planning: [
      "Exploring your listening history...",
      "Gathering ideas from your recent plays...",
      "Finding themes in what you love...",
    ],
    finalizing: [
      "Pulling it all together...",
      "Locking in the perfect mix...",
      "Naming and sequencing the vibes...",
    ],
    hydrating: [
      "Checking Spotify for the best versions...",
      "Grabbing track details...",
      "Adding artwork and links...",
    ],
    streaming: [
      "Dropping tracks into place...",
      "Building your playlist, one song at a time...",
      "Letting the tracks roll in...",
    ],
    done: "Playlist ready",
    error: "Something went wrong",
  };

  const options = map[status];
  return Array.isArray(options) ? randomFrom(options) : options;
}

function randomFrom(options: string[]) {
  return options[Math.floor(Math.random() * options.length)];
}
