"use client";

import { useEffect, useRef } from "react";
import { usePlaylistGeneration } from "./playlist-context";
import { TurntableSpinner } from "./TurntableSpinner";

const MOBILE_PLACEHOLDER = "Music for...";

/**
 * On desktop: An invisible placeholder element that reserves space for the floating
 * playlist input bar. Reports its position to the playlist context so
 * the GlobalPlaylistInput can animate to match this location.
 * 
 * On mobile: Renders the actual input inline (in DOM flow) for proper keyboard handling.
 */
export function PlaylistInputGhost() {
  const ref = useRef<HTMLDivElement>(null);
  const { setGhostRef, input, setInput, isStreaming, startGeneration } = usePlaylistGeneration();

  useEffect(() => {
    setGhostRef(ref.current);
    return () => setGhostRef(null);
  }, [setGhostRef]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void startGeneration(input);
  };

  return (
    <div ref={ref} className="w-full max-w-full sm:w-190">
      {/* Mobile: actual input in DOM flow */}
      <div className="sm:hidden">
        <div className="rounded-full bg-background/60 backdrop-blur-xl border border-border/60 px-3 py-1.5 flex items-center gap-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 bg-transparent px-2 py-2 text-sm placeholder:text-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={MOBILE_PLACEHOLDER}
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="btn-primary h-8 w-8 p-0 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Generate playlist"
            >
              <TurntableSpinner loading={isStreaming} />
            </button>
          </form>
        </div>
      </div>

      {/* Desktop: invisible spacer */}
      <div
        aria-hidden="true"
        className="hidden sm:block pointer-events-none"
        style={{ height: 56 }}
      />
    </div>
  );
}

