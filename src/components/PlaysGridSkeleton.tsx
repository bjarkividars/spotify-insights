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

export function PlaysGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 30 }).map((_, i) => (
        <PlayCardSkeleton key={`play-skeleton-${i}`} index={i} />
      ))}
    </div>
  );
}

