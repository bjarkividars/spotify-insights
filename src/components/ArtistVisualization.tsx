"use client";

import { useState } from "react";
import { ArtistBarChart } from "./ArtistBarChart";
import { ArtistTreemap } from "./ArtistTreemap";

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

export function ArtistVisualization({ artists }: ArtistVisualizationProps) {
  const [viewMode, setViewMode] = useState<"bar" | "treemap">("bar");
  const maxPlayCount = artists.length > 0 ? artists[0].play_count : 1;

  return (
    <div>
      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Top Artists by Plays
          </h2>
          <p className="text-sm text-foreground/60">
            Your most listened to artists and their estimated payouts from your
            streams
          </p>
        </div>
        <div className="flex gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode("bar")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === "bar"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setViewMode("treemap")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === "treemap"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            Treemap
          </button>
        </div>
      </div>

      {/* Bar Chart View */}
      {viewMode === "bar" && (
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
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
                  artistHref={"https://open.spotify.com/artist/" + artist.artist_id}
                  artistImage={artist.artist_image}
                  playCount={artist.play_count}
                  estimatedPayout={artist.estimated_payout}
                  maxPlayCount={maxPlayCount}
                  rank={index + 1}
                  gradientStart={artist.gradientStart}
                  gradientEnd={artist.gradientEnd}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Treemap View */}
      {viewMode === "treemap" && <ArtistTreemap artists={artists} />}
    </div>
  );
}
