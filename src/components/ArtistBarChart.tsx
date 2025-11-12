import Image from "next/image";

type ArtistBarChartProps = {
  artistName: string;
  artistImage: string | null;
  playCount: number;
  estimatedPayout: number;
  maxPlayCount: number; // for relative sizing
  rank: number;
};

export function ArtistBarChart({
  artistName,
  artistImage,
  playCount,
  estimatedPayout,
  maxPlayCount,
  rank,
}: ArtistBarChartProps) {
  // Calculate height as percentage of max (min 20% for visibility)
  const heightPercent = Math.max((playCount / maxPlayCount) * 100, 20);

  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px]">
      {/* Bar */}
      <div className="relative w-20 h-64 bg-muted rounded-t-xl flex flex-col justify-end overflow-hidden">
        <div
          className="bg-primary transition-all duration-300 rounded-t-xl flex flex-col items-center justify-end p-2 gap-1"
          style={{ height: `${heightPercent}%` }}
        >
          {/* Rank badge */}
          <div className="absolute top-2 right-2 bg-background text-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {rank}
          </div>
          
          {/* Stats */}
          <div className="text-center">
            <div className="text-xs text-primary-foreground font-bold">
              {playCount}
            </div>
            <div className="text-[10px] text-primary-foreground/80">
              plays
            </div>
            <div className="text-xs text-primary-foreground font-semibold mt-1">
              ${estimatedPayout.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Artist Image */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0">
        {artistImage ? (
          <Image
            src={artistImage}
            alt={artistName}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/40">
            <span className="text-xl">♪</span>
          </div>
        )}
      </div>

      {/* Artist Name */}
      <p className="text-sm text-center text-foreground font-medium max-w-[100px] truncate">
        {artistName}
      </p>
    </div>
  );
}
