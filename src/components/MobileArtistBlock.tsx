"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useThemeBackground,
  adjustColorsForContrast,
  makeModernGradient,
} from "@/utils/client-color-contrast";
import { useMemo } from "react";

type MobileArtistBlockProps = {
  artistName: string;
  artistId: string;
  artistImage: string | null;
  playCount: number;
  estimatedPayout: number;
  maxPayout: number;
  rank: number;
  gradientStart: string | null;
  gradientEnd: string | null;
};

export function MobileArtistBlock({
  artistName,
  artistId,
  artistImage,
  playCount,
  estimatedPayout,
  maxPayout,
  rank,
  gradientStart,
  gradientEnd,
}: MobileArtistBlockProps) {
  // Calculate height based on payout (clamp between 96px and 280px)
  const payoutRatio = maxPayout > 0 ? estimatedPayout / maxPayout : 0;
  const height = Math.max(96, Math.min(280, 96 + payoutRatio * 184));

  // Get current theme background color
  const backgroundColor = useThemeBackground();

  // Adjust gradient colors for contrast if available
  const adjustedColors = useMemo(() => {
    if (!gradientStart || !gradientEnd) {
      return null;
    }

    return adjustColorsForContrast(gradientStart, gradientEnd, backgroundColor);
  }, [gradientStart, gradientEnd, backgroundColor]);

  // Modernize the gradient
  const modernColors = useMemo(() => {
    if (!adjustedColors) return null;
    return makeModernGradient(
      adjustedColors.gradientStart,
      adjustedColors.gradientEnd,
      backgroundColor
    );
  }, [adjustedColors, backgroundColor]);

  // Background style
  const backgroundStyle = modernColors
    ? {
        background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%), linear-gradient(to bottom, ${modernColors.gradientStart}, ${modernColors.gradientEnd})`,
        backgroundBlendMode: "multiply",
        height: `${height}px`,
      }
    : {
        background: "hsl(var(--primary))",
        height: `${height}px`,
      };

  return (
    <Link
      href={`https://open.spotify.com/artist/${artistId}`}
      className="block w-full rounded-xl overflow-hidden relative group"
      style={backgroundStyle}
    >
      {/* Rank badge */}
      <div className="absolute top-3 right-3 bg-background/80 text-foreground rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold z-10">
        {rank}
      </div>

      {/* Stats - top left */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-end gap-1">
          <span className="text-white font-bold text-lg leading-none">
            {playCount}
          </span>
          <span className="text-white/80 text-xs">plays</span>
        </div>
        <div className="text-white font-semibold text-sm mt-2 leading-none">
          {estimatedPayout < 0.01 ? ">$0.01" : `$${estimatedPayout.toFixed(2)}`}
        </div>
      </div>

      <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
        <p className="text-white font-bold text-xl">{artistName}</p>
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-background/20 border-2 border-background/30 shrink-0">
          {artistImage ? (
            <Image
              src={artistImage}
              alt={artistName}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              <span className="text-xl">♪</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
