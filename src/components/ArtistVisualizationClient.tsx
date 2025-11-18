"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArtistBarChart } from "./ArtistBarChart";
import { MobileArtistBlock } from "./MobileArtistBlock";
import { getTopArtistsPage } from "@/app/actions";

type Artist = {
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  play_count: number;
  estimated_payout: number;
  gradientStart: string | null;
  gradientEnd: string | null;
};

type ArtistVisualizationClientProps = {
  initialArtists: Artist[];
  totalPayout: number;
};

const LoadingBar = ({ index }: { index: number }) => {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px] shrink-0 h-full">
      <div className="relative w-20 flex-1 bg-muted rounded-t-xl overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/40 to-transparent animate-shimmer"
          style={{ animationDelay: `${-index * 0.08}s` }}
        />
      </div>
      <div className="w-full h-4 bg-muted rounded relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/40 to-transparent animate-shimmer"
          style={{ animationDelay: `${-index * 0.08}s` }}
        />
      </div>
    </div>
  );
};

const MobileLoadingBlock = ({ index }: { index: number }) => {
  return (
    <div className="w-full h-40 rounded-xl bg-muted relative overflow-hidden">
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/40 to-transparent animate-shimmer"
        style={{ animationDelay: `${-index * 0.05}s` }}
      />
      
      {/* Rank badge skeleton */}
      <div className="absolute top-3 right-3 w-7 h-7 bg-background/40 rounded-full" />
      
      {/* Stats skeleton - top left */}
      <div className="absolute top-3 left-3 space-y-2">
        <div className="h-5 w-16 bg-background/40 rounded" />
        <div className="h-4 w-12 bg-background/40 rounded" />
      </div>
      
      {/* Bottom content skeleton */}
      <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="h-6 w-32 bg-background/40 rounded" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-background/40 shrink-0" />
      </div>
    </div>
  );
};

export function ArtistVisualizationClient({
  initialArtists,
  totalPayout,
}: ArtistVisualizationClientProps) {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [offset, setOffset] = useState(initialArtists.length);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArtists.length >= 20);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mobileSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const maxPlayCount = artists.length > 0 ? artists[0].play_count : 1;
  const maxPayout =
    artists.length > 0
      ? Math.max(...artists.map((a) => a.estimated_payout))
      : 1;

  // Load more artists when sentinel is visible
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await getTopArtistsPage(20, offset);
      const newArtists = result.artists;

      if (newArtists.length === 0) {
        setHasMore(false);
      } else {
        // Deduplicate by artist_id
        setArtists((prev) => {
          const existingIds = new Set(prev.map((a) => a.artist_id));
          const uniqueNew = newArtists.filter(
            (a) => !existingIds.has(a.artist_id)
          );
          return [...prev, ...uniqueNew];
        });
        setOffset((prev) => prev + newArtists.length);
        setHasMore(newArtists.length >= 20);
      }
    } catch (error) {
      console.error("Failed to load more artists:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset]);

  // IntersectionObserver for desktop sentinel (horizontal scroll)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      {
        root: container,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  // IntersectionObserver for mobile sentinel (vertical scroll)
  useEffect(() => {
    const sentinel = mobileSentinelRef.current;
    if (!sentinel || !hasMore) return;

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

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  if (artists.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-foreground/60">No plays yet</p>
        <p className="text-sm text-foreground/40 mt-2">
          Start listening and sync your data to see insights
        </p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 mb-8">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {/* View Toggle */}
          <div className="mb-6 flex items-center justify-between shrink-0">
            <div>
              <p className="text-sm text-foreground/60">
                Your most listened to artists and their estimated payouts from
                your streams
              </p>
            </div>
          </div>

          {/* Mobile: Vertical blocks */}
          <div className="sm:hidden space-y-4 flex-1">
            {artists.map((artist, index: number) => (
              <MobileArtistBlock
                key={artist.artist_id}
                artistName={artist.artist_name}
                artistId={artist.artist_id}
                artistImage={artist.artist_image}
                playCount={artist.play_count}
                estimatedPayout={artist.estimated_payout}
                maxPayout={maxPayout}
                rank={index + 1}
                gradientStart={artist.gradientStart}
                gradientEnd={artist.gradientEnd}
              />
            ))}

            {/* Ghost placeholders for mobile */}
            {hasMore &&
              Array.from({ length: 3 }).map((_, i) => (
                <MobileLoadingBlock key={`mobile-ghost-${i}`} index={i} />
              ))}

            {/* Mobile sentinel */}
            {hasMore && <div ref={mobileSentinelRef} className="h-1" />}
          </div>

          {/* Desktop: Horizontal bar chart */}
          <div className="hidden sm:block relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex-1 min-h-0">
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto pb-4 scrollbar-hide h-full"
            >
              <div
                className="
                flex gap-6 min-w-min h-full
                pl-4 md:pl-6 lg:pl-8
                xl:pl-[calc((100vw-80rem)/2)]
                pr-4 md:pr-6 lg:pr-8
                xl:pr-[calc((100vw-80rem)/2)]
              "
              >
                {artists.map((artist, index: number) => (
                  <ArtistBarChart
                    key={artist.artist_id}
                    artistName={artist.artist_name}
                    artistHref={
                      "https://open.spotify.com/artist/" + artist.artist_id
                    }
                    artistImage={artist.artist_image}
                    playCount={artist.play_count}
                    estimatedPayout={artist.estimated_payout}
                    maxPlayCount={maxPlayCount}
                    rank={index + 1}
                    gradientStart={artist.gradientStart}
                    gradientEnd={artist.gradientEnd}
                  />
                ))}

                {/* Ghost bar placeholder when loading or has more */}
                {hasMore &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <LoadingBar key={`loading-bar-${i}`} index={i} />
                  ))}

                {/* Desktop sentinel element for intersection observer */}
                {hasMore && <div ref={sentinelRef} className="w-1 h-1 shrink-0" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-border shrink-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Total estimated payout</span>
          <span className="text-xl font-bold text-primary">
            ${totalPayout.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-foreground/40 mt-2">
          *Estimated at $0.004 per stream (Spotify average)
        </p>
      </div>
    </section>
  );
}

