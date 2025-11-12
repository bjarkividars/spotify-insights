import { getUserPlays } from "@/app/actions";
import { PlayCard } from "@/components/PlayCard";
import Link from "next/link";

export default async function PlaysPage() {
  const plays = await getUserPlays(50);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Listening History
              </h1>
              <p className="text-foreground/60">
                Your {plays.length} most recent plays
              </p>
            </div>
            <Link href="/" className="btn-ghost">
              ← Home
            </Link>
          </div>
        </header>

        {plays.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-foreground/60">No plays yet</p>
            <p className="text-sm text-foreground/40 mt-2">
              Your listening history will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plays.map((play, idx) => (
              <PlayCard
                key={`${play.track.id}-${play.played_at}-${idx}`}
                trackName={play.track.name}
                artistName={play.track.artist.name}
                artistImage={play.track.artist.image_url}
                playedAt={play.played_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


