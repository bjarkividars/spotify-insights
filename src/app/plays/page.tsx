import { getUserPlays } from "./actions";
import { PlayCard } from "@/components/PlayCard";
import Link from "next/link";

export default async function PlaysPage() {
  const plays = await getUserPlays(50);

  return (
    <div className="min-h-screen bg-background pb-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="sticky top-0">
          <header
            className="mb-8 pb-4 -mx-4 px-4 relative bg-background z-10
                        after:pointer-events-none
                        after:content-['']
                        after:absolute after:inset-x-0
                        after:-bottom-8 after:h-8
                        after:bg-linear-to-b
                        after:from-background
                        after:to-transparent"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 mt-12">
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
        </div>

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
