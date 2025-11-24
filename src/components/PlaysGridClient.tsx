"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserPlaysPage } from "@/app/(authenticated)/plays/actions";
import type { PlayWithDetails } from "@/types/plays";
import { PlayCard } from "./PlayCard";

type PlaysGridClientProps = {
  initialPlays: PlayWithDetails[];
};

const PlayCardSkeleton = ({ index }: { index: number }) => {
  return (
    <div className="card flex items-center gap-4 p-4 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/40 to-transparent animate-shimmer"
        style={{ animationDelay: `${-index * 0.05}s` }}
      />
      
      {/* Artist image skeleton */}
      <div className="w-16 h-16 rounded-lg bg-muted shrink-0 relative z-10" />
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2 relative z-10">
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
};

export function PlaysGridClient({ initialPlays }: PlaysGridClientProps) {
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

  if (plays.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-foreground/60">No plays yet</p>
        <p className="text-sm text-foreground/40 mt-2">
          Your listening history will appear here
        </p>
      </div>
    );
  }

  const ghostVis = ["block", "hidden sm:block", "hidden xl:block"];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-28">
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

        {/* Ghost placeholders when loading more */}
        {hasMore &&
          ghostVis.map((vis, i) => (
            <div key={`ghost-${i}`} className={`${vis} w-full`}>
              <PlayCardSkeleton index={i} />
            </div>
          ))}
      </div>

      {/* Sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </>
  );
}
