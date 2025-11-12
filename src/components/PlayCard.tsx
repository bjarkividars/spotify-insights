import Image from "next/image";

type PlayCardProps = {
  trackName: string;
  artistName: string;
  artistImage: string | null;
  playedAt: string;
};

export function PlayCard({ trackName, artistName, artistImage, playedAt }: PlayCardProps) {
  const timeAgo = formatTimeAgo(playedAt);

  return (
    <div className="card flex items-center gap-4">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
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
            <span className="text-2xl">♪</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{trackName}</h3>
        <p className="text-sm text-foreground/60 truncate">{artistName}</p>
        <p className="text-xs text-foreground/40 mt-1">{timeAgo}</p>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date().getTime();
  const played = new Date(timestamp).getTime();
  const diffMs = Math.max(0, now - played);

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}


