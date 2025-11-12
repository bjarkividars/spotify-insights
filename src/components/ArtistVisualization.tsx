"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

type ArtistVisualizationProps = {
  artists: Artist[];
};

export function ArtistVisualization({
  artists: initialArtists,
}: ArtistVisualizationProps) {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [offset, setOffset] = useState(initialArtists.length);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArtists.length >= 20);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mobileSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const maxPlayCount = artists.length > 0 ? artists[0].play_count : 1;
  const maxPayout = artists.length > 0 
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

  return (
    <div>
      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground/60">
            Your most listened to artists and their estimated payouts from your
            streams
          </p>
        </div>
      </div>

      {/* Mobile: Vertical blocks */}
      <div className="sm:hidden space-y-4">
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
            <div
              key={`mobile-ghost-${i}`}
              className="w-full h-40 rounded-xl bg-muted/50 animate-pulse"
            />
          ))}

        {/* Mobile sentinel */}
        {hasMore && <div ref={mobileSentinelRef} className="h-1" />}
      </div>

      {/* Desktop: Horizontal bar chart */}
      <div className="hidden sm:block relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 scrollbar-hide"
        >
          <div
            className="
                flex gap-6 min-w-min
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
            {hasMore && (
              <div className="flex flex-col items-center gap-2 min-w-[100px] shrink-0">
                <div className="relative w-20 h-96 bg-muted/50 rounded-t-xl flex flex-col justify-end overflow-hidden animate-pulse">
                  <div className="w-full h-full bg-gradient-to-b from-muted/30 to-muted/60 rounded-t-xl" />
                </div>
                <div className="w-full h-4 bg-muted/50 rounded animate-pulse" />
              </div>
            )}

            {/* Desktop sentinel element for intersection observer */}
            {hasMore && <div ref={sentinelRef} className="w-1 h-1 shrink-0" />}
          </div>
        </div>
      </div>
    </div>
  );
}
