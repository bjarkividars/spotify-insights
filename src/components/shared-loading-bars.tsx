"use client";

type LoadingBarProps = { index: number };
type MobileLoadingBlockProps = { index: number };

export const LoadingBar = ({ index }: LoadingBarProps) => {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px] shrink-0 h-full">
      <div className="relative w-20 flex-1 bg-muted rounded-t-xl overflow-hidden">
        <div
          className="absolute inset-[-10%] bg-gradient-to-t from-transparent via-white/28 dark:via-white/18 to-transparent animate-shimmer-vertical"
          style={{ animationDelay: `${-index * 0.12}s` }}
        />
      </div>
      <div className="w-full h-4 bg-muted rounded relative overflow-hidden">
        <div
          className="absolute inset-[-10%] bg-gradient-to-t from-transparent via-white/28 dark:via-white/18 to-transparent"
          style={{ animationDelay: `${-index * 0.12}s` }}
        />
      </div>
    </div>
  );
};

export const MobileLoadingBlock = ({ index }: MobileLoadingBlockProps) => {
  // Vary heights to match real data (between 96px and 280px)
  const heights = [280, 240, 220, 200, 180, 160, 150, 140, 130, 120, 115, 110, 105, 100, 100, 96, 96, 96, 96, 96];
  const height = heights[index % heights.length];

  return (
    <div className="w-full rounded-xl bg-muted relative overflow-hidden" style={{ height: `${height}px` }}>
      {/* Shimmer overlay */}
      <div
        className="absolute inset-[-10%] bg-gradient-to-t from-transparent via-white/28 dark:via-white/18 to-transparent animate-shimmer-vertical"
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
