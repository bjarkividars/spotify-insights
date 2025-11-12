"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserPlaysPage } from "@/app/(authenticated)/plays/actions";
import type { PlayWithDetails } from "@/types/plays";
import { PlayCard } from "./PlayCard";

type PlaysGridProps = {
  initialPlays: PlayWithDetails[];
};

export function PlaysGrid({ initialPlays }: PlaysGridProps) {
  const [plays, setPlays] = useState<PlayWithDetails[]>(initialPlays);
  const [offset, setOffset] = useState(initialPlays.length);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPlays.length >= 30);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const next = await getUserPlaysPage(30, offset);
      if (next.length === 0) {
        setHasMore(false);
      } else {
        // Deduplicate by (track.id, played_at)
        setPlays((prev) => {
          const existingKeys = new Set(
            prev.map((p) => `${p.track.id}:${p.played_at}`)
          );
          const uniqueNew = next.filter(
            (p) => !existingKeys.has(`${p.track.id}:${p.played_at}`)
          );
          return [...prev, ...uniqueNew];
        });
        setOffset((prev) => prev + next.length);
        setHasMore(next.length >= 30);
      }
    } catch (e) {
      console.error("Failed to load more plays", e);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "400px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, isLoading]);

  const ghostVis = ["block", "hidden sm:flex", "hidden xl:flex"];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {plays.map((play, idx) => (
          <PlayCard
            key={`${play.track.id}-${play.played_at}-${idx}`}
            trackId={play.track.id}
            trackName={play.track.name}
            artistName={play.track.artist.name}
            artistImage={play.track.artist.image_url}
            playedAt={play.played_at}
          />
        ))}

        {/* Ghost placeholders when loading or hasMore to hint continuation */}

        {hasMore &&
          ghostVis.map((vis, i) => (
            <div
              key={`ghost-${i}`}
              className={`${vis} card items-center gap-4 p-4 animate-pulse`}
            >
              <div className="w-16 h-16 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
      </div>

      {/* Sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </>
  );
}
