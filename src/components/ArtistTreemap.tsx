"use client";

import Image from "next/image";
import { useTreemapLayout, useContainerDimensions } from "@/hooks/useTreemapLayout";
import { useThemeBackground, adjustColorsForContrast } from "@/utils/client-color-contrast";
import { useMemo } from "react";

type ArtistData = {
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  play_count: number;
  estimated_payout: number;
  gradientStart: string | null;
  gradientEnd: string | null;
};

type ArtistTreemapProps = {
  artists: ArtistData[];
};

export function ArtistTreemap({ artists }: ArtistTreemapProps) {
  const { ref, dimensions } = useContainerDimensions();
  const nodes = useTreemapLayout(artists, dimensions.width, dimensions.height);
  const backgroundColor = useThemeBackground();

  return (
    <div ref={ref} className="relative w-full h-[700px] bg-muted/30 rounded-lg">
      {nodes.map((node) => (
        <TreemapNode
          key={node.artist_id}
          node={node}
          backgroundColor={backgroundColor}
        />
      ))}
    </div>
  );
}

type TreemapNodeProps = {
  node: {
    artist_id: string;
    artist_name: string;
    artist_image: string | null;
    play_count: number;
    estimated_payout: number;
    gradientStart: string | null;
    gradientEnd: string | null;
    rank: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  backgroundColor: string;
};

function TreemapNode({ node, backgroundColor }: TreemapNodeProps) {
  // Adjust gradient colors for contrast
  const adjustedColors = useMemo(() => {
    if (!node.gradientStart || !node.gradientEnd) {
      return null;
    }
    return adjustColorsForContrast(node.gradientStart, node.gradientEnd, backgroundColor);
  }, [node.gradientStart, node.gradientEnd, backgroundColor]);

  // Determine if we have enough space to show various elements
  const showFullStats = node.width > 120 && node.height > 120;
  const showImage = node.width > 80 && node.height > 80;
  const imageSize = Math.min(node.width * 0.35, node.height * 0.35, 80);

  // Background style
  const backgroundStyle = adjustedColors
    ? {
        background: `linear-gradient(to bottom, ${adjustedColors.gradientStart}, ${adjustedColors.gradientEnd})`,
      }
    : {
        background: "hsl(var(--primary))",
      };

  return (
    <div
      className="absolute rounded-lg overflow-hidden border border-background/20 transition-all duration-300 hover:scale-[1.02] hover:z-10"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        ...backgroundStyle,
      }}
    >
      {/* Rank badge - top right */}
      <div className="absolute top-2 right-2 bg-background/80 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
        {node.rank}
      </div>

      {/* Stats - top left or center */}
      <div className={`absolute top-2 left-2 ${showFullStats ? "" : "text-center left-1/2 -translate-x-1/2"}`}>
        <div className="text-white font-bold" style={{ fontSize: showFullStats ? "1rem" : "0.75rem" }}>
          {node.play_count}
        </div>
        {showFullStats && (
          <>
            <div className="text-white/80 text-xs">plays</div>
            <div className="text-white font-semibold text-sm mt-1">
              {node.estimated_payout < 0.01 ? ">$0.01" : `$${node.estimated_payout.toFixed(2)}`}
            </div>
          </>
        )}
      </div>

      {/* Artist name - center or top */}
      {showFullStats && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-4">
          <p className="text-white font-bold text-sm truncate">{node.artist_name}</p>
        </div>
      )}

      {/* Artist image - bottom right corner */}
      {showImage && (
        <div
          className="absolute bottom-2 right-2 rounded-full overflow-hidden bg-background/20 border-2 border-background/30"
          style={{
            width: imageSize,
            height: imageSize,
          }}
        >
          {node.artist_image ? (
            <Image
              src={node.artist_image}
              alt={node.artist_name}
              width={imageSize}
              height={imageSize}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              <span className="text-lg">♪</span>
            </div>
          )}
        </div>
      )}

      {/* Artist name for small boxes - bottom */}
      {!showFullStats && node.height > 60 && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <p className="text-white text-xs font-medium truncate">{node.artist_name}</p>
        </div>
      )}
    </div>
  );
}

