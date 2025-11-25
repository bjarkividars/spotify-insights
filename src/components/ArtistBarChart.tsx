"use client";

import styles from "./s.module.css";

import Image from "next/image";
import {
  useThemeBackground,
  adjustColorsForContrast,
  makeModernGradient,
} from "@/utils/client-color-contrast";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

type ArtistBarChartProps = {
  artistName: string;
  artistHref: string;
  artistImage: string | null;
  playCount: number;
  estimatedPayout: number;
  maxPlayCount: number; // for relative sizing
  rank: number;
  gradientStart: string | null;
  gradientEnd: string | null;
};

export function ArtistBarChart({
  artistName,
  artistHref,
  artistImage,
  playCount,
  estimatedPayout,
  maxPlayCount,
  rank,
  gradientStart,
  gradientEnd,
}: ArtistBarChartProps) {
  // Calculate height as percentage of max (min 30% for visibility)
  const heightPercent = Math.max((playCount / maxPlayCount) * 100, 30);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entry animation on mount
    const t = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Get current theme background color
  const backgroundColor = useThemeBackground();

  // Adjust gradient colors for contrast if available
  const adjustedColors = useMemo(() => {
    if (!gradientStart || !gradientEnd) {
      return null;
    }

    return adjustColorsForContrast(gradientStart, gradientEnd, backgroundColor);
  }, [gradientStart, gradientEnd, backgroundColor]);

  // Modernize the gradient to be more subtle and refined
  const modernColors = useMemo(() => {
    if (!adjustedColors) return null;
    return makeModernGradient(
      adjustedColors.gradientStart,
      adjustedColors.gradientEnd,
      backgroundColor
    );
  }, [adjustedColors, backgroundColor]);

  // Determine gradient style or fallback to primary
  const gradientStyle = modernColors
    ? {
        // Layer a subtle dark overlay to add depth without looking dated
        background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%), linear-gradient(to bottom, ${modernColors.gradientStart}, ${modernColors.gradientEnd})`,
        backgroundBlendMode: "multiply",
        height: `${isVisible ? heightPercent : 0}%`,
        opacity: isVisible ? 1 : 0.6,
        transition: "height 600ms cubic-bezier(0.18, 0.85, 0.25, 1), opacity 500ms ease-out",
      }
    : {
        height: `${isVisible ? heightPercent : 0}%`,
        opacity: isVisible ? 1 : 0.6,
        transition: "height 600ms cubic-bezier(0.18, 0.85, 0.25, 1), opacity 500ms ease-out",
      };

  const barClassName = modernColors
    ? "transition-all duration-300 flex flex-col items-center justify-end p-2 gap-1"
    : "bg-primary transition-all duration-300 flex flex-col items-center justify-end p-2 gap-1";

  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px]">
      {/* Bar */}
      <div className="relative w-20 h-full bg-muted rounded-t-xl flex flex-col justify-end overflow-hidden">
        <div className={barClassName} style={gradientStyle}>
          {/* Rank badge */}
          <div className="absolute top-2 right-2 bg-background text-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
            {rank}
          </div>

          {/* Stats - positioned above the image */}
          <div className="text-center mb-2">
            <div
              className={`text-xs font-bold ${
                adjustedColors ? "text-white" : "text-primary-foreground"
              }`}
            >
              {playCount}
            </div>
            <div
              className={`text-[10px] ${
                adjustedColors ? "text-white/80" : "text-primary-foreground/80"
              }`}
            >
              {playCount > 1 ? "plays" : "play"}
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${
                adjustedColors ? "text-white" : "text-primary-foreground"
              }`}
            >
              {estimatedPayout < 0.01
                ? "<$0.01"
                : `$${estimatedPayout.toFixed(2)}`}
            </div>
          </div>

          {/* Artist Image - inside bar at bottom with padding */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-background/20 shrink-0 shadow-soft">
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
                <span className="text-lg">♪</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Artist Name */}
      <div className={styles.container}>
        <a
          href={artistHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.clip}
        >
          {artistName}
        </a>
        <a
          href={artistHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.full}
        >
          {artistName}
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
