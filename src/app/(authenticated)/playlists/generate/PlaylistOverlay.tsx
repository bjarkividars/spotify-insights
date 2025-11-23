"use client";

import { ChevronRight, Loader2, Music, Sparkles, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import type { PlaylistTrack } from "./types";
import type { StreamStatus } from "./page";

type PlaylistOverlayProps = {
  playlistName: string | null;
  tracks: PlaylistTrack[];
  status: StreamStatus;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  saveSuccessUrl: string | null;
};

export function PlaylistOverlay({
  playlistName,
  tracks,
  status,
  onClose,
  onSave,
  isSaving,
  saveError,
  saveSuccessUrl,
}: PlaylistOverlayProps) {
  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8 z-50">
      <div className="relative w-full max-w-3xl bg-background border border-border rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold leading-tight">
            {playlistName || "Curating your playlist..."}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="relative w-full h-[72vh] sm:h-[64vh] fade-top fade-bottom"
          style={{ "--fade-size": "14px" } as CSSProperties}
        >
          <div className="grid gap-3 sm:gap-4 h-[72vh] sm:h-[64vh] overflow-y-auto pr-1 py-3 sm:py-4">
            {tracks.map((track, i) => (
              <AnimatedTrackRow
                key={`${track.spotifyId ?? track.name}-${i}`}
                track={track}
                index={i}
              />
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 left-0 w-full bg-card border border-border rounded-xl px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-col text-sm text-foreground/70 w-full sm:w-auto">
            {saveError && <span className="text-red-500">{saveError}</span>}
            {saveSuccessUrl && (
              <a
                href={saveSuccessUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                View on Spotify
              </a>
            )}
            {!saveError && !saveSuccessUrl && (
              <span>Ready to keep this mix?</span>
            )}
          </div>
          <button
            onClick={onSave}
            disabled={isSaving || tracks.length === 0 || !playlistName}
            className="btn-primary px-4 py-2 rounded-full flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{saveSuccessUrl ? "Saved" : "Save to my Spotify"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AnimatedTrackRow({
  track,
  index,
}: {
  track: PlaylistTrack;
  index: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const Wrapper: "a" | "div" = track.uri ? "a" : "div";

  const baseClasses =
    "flex items-center gap-4 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-all duration-500 ease-out group";

  return (
    <Wrapper
      className={`${baseClasses} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 35}ms` }}
      {...(track.uri
        ? { href: track.uri, target: "_blank", rel: "noreferrer" }
        : {})}
    >
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden">
        {track.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.image}
            alt={track.artist}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music className="w-6 h-6 text-foreground/60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-medium truncate">{track.name}</p>
          {track.uri && (
            <ChevronRight className="w-4 h-4 text-foreground/60 hidden group-hover:block" />
          )}
        </div>
        <p className="text-sm text-foreground/70 truncate">{track.artist}</p>
      </div>
    </Wrapper>
  );
}
