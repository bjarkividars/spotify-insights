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
  // Vary heights to match real data (between 96px and 280px)
  const heights = [280, 240, 220, 200, 180, 160, 150, 140, 130, 120, 115, 110, 105, 100, 100, 96, 96, 96, 96, 96];
  const height = heights[index % heights.length];
  
  return (
    <div className="w-full rounded-xl bg-muted relative overflow-hidden" style={{ height: `${height}px` }}>
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

export function ArtistVisualizationSkeleton() {
  return (
    <section className="flex-1 flex flex-col min-h-0 mb-8">
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
          {Array.from({ length: 20 }).map((_, i) => (
            <MobileLoadingBlock key={`mobile-loading-${i}`} index={i} />
          ))}
        </div>

        {/* Desktop: Horizontal bar chart */}
        <div className="hidden sm:block relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex-1 min-h-0">
          <div className="overflow-x-auto pb-4 scrollbar-hide h-full">
            <div
              className="
                flex gap-6 min-w-min h-full
                pl-4 md:pl-6 lg:pl-8
                xl:pl-[calc((100vw-80rem)/2)]
                pr-4 md:pr-6 lg:pr-8
                xl:pr-[calc((100vw-80rem)/2)]
              "
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <LoadingBar key={`desktop-loading-${i}`} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="mt-6 pt-6 border-t border-border shrink-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Total estimated payout</span>
          <div className="h-7 w-24 bg-muted rounded relative overflow-hidden">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/40 to-transparent animate-shimmer"
              style={{ animationDelay: "-1.6s" }}
            />
          </div>
        </div>
        <div className="mt-2 h-3 w-64 bg-muted rounded relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/40 to-transparent animate-shimmer"
            style={{ animationDelay: "-1.65s" }}
          />
        </div>
      </div>
    </section>
  );
}

