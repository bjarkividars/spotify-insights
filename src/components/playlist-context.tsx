"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PlaylistTrack, StreamStatus } from "@/app/(authenticated)/playlists/generate/types";
import { createSpotifyPlaylistAction } from "@/app/(authenticated)/playlists/generate/create-spotify-playlist";

type StreamEvent =
  | { type: "status"; status: Exclude<StreamStatus, "error" | "streaming"> }
  | { type: "playlist"; name: string }
  | { type: "track"; track: PlaylistTrack; index: number }
  | { type: "error"; message: string };

type PlaylistContextValue = {
  input: string;
  setInput: (value: string) => void;
  playlistName: string | null;
  tracks: PlaylistTrack[];
  status: StreamStatus;
  error: string | null;
  isStreaming: boolean;
  showSuggestions: boolean;
  isSaving: boolean;
  saveError: string | null;
  saveSuccessUrl: string | null;
  overlayVisible: boolean;
  statusMessage: string | undefined;
  startGeneration: (value: string) => Promise<void>;
  reset: () => void;
  saveToSpotify: () => Promise<void>;
};

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistGenerationProvider({ children }: { children: React.ReactNode }) {
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

  const startGeneration = useCallback(
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
        const message = err instanceof Error ? err.message : "Failed to generate playlist";
        setError(message);
        setStatus("error");
        setIsStreaming(false);
      }
    },
    [handleEvent, reset]
  );

  const saveToSpotify = useCallback(async () => {
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
      const message = err instanceof Error ? err.message : "Failed to save to Spotify";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }, [playlistName, tracks]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const statusMessage = useStatusMessage(status);
  const overlayVisible = useMemo(() => {
    const showResult = !!playlistName || tracks.length > 0;
    return showResult || status === "streaming";
  }, [playlistName, status, tracks.length]);

  const value: PlaylistContextValue = {
    input,
    setInput,
    playlistName,
    tracks,
    status,
    error,
    isStreaming,
    showSuggestions,
    isSaving,
    saveError,
    saveSuccessUrl,
    overlayVisible,
    statusMessage,
    startGeneration,
    reset,
    saveToSpotify,
  };

  return <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>;
}

export function usePlaylistGeneration() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) {
    throw new Error("usePlaylistGeneration must be used within PlaylistGenerationProvider");
  }
  return ctx;
}

export function useStatusMessage(status: StreamStatus) {
  const map: Record<StreamStatus, string | string[] | undefined> = {
    idle: "Waiting for your prompt",
    planning: [
      "Exploring your listening history...",
      "Gathering ideas from your recent plays...",
      "Finding themes in what you love...",
      "Looking for the best tracks...",
      "Building your playlist...",
    ],
    finalizing: [
      "Pulling it all together...",
      "Locking in the perfect mix...",
      "Naming and sequencing the vibes...",
    ],
    hydrating: undefined,
    streaming: undefined,
    done: undefined,
    error: "Something went wrong",
  };

  const options = map[status];
  return Array.isArray(options) ? randomFrom(options) : options;
}

function randomFrom(options: string[]) {
  return options[Math.floor(Math.random() * options.length)];
}
