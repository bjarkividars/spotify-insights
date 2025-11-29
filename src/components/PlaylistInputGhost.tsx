"use client";

import { useEffect, useRef } from "react";
import { usePlaylistGeneration } from "./playlist-context";

/**
 * An invisible placeholder element that reserves space for the floating
 * playlist input bar. Reports its position to the playlist context so
 * the GlobalPlaylistInput can animate to match this location.
 */
export function PlaylistInputGhost() {
  const ref = useRef<HTMLDivElement>(null);
  const { setGhostRef } = usePlaylistGeneration();

  useEffect(() => {
    setGhostRef(ref.current);
    return () => setGhostRef(null);
  }, [setGhostRef]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      // Match suggestions container width: w-190 max-w-full
      className="w-190 max-w-full pointer-events-none"
      style={{ height: 56 }}
    />
  );
}

