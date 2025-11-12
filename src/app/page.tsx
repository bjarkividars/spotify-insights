import { getTopArtists } from "./actions";
import { ArtistBarChart } from "@/components/ArtistBarChart";
import Link from "next/link";

export default async function Home() {
  const topArtists = await getTopArtists(10);
  const maxPlayCount = topArtists.length > 0 ? topArtists[0].play_count : 1;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Spotify Payout
              </h1>
              <p className="text-foreground/60">
                Your listening insights and estimated payouts
              </p>
            </div>
            <Link href="/plays" className="btn-primary">
              View History
            </Link>
          </div>
        </header>

        {/* Top Artists Section */}
        {topArtists.length > 0 ? (
          <section className="card mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Top Artists by Plays
              </h2>
              <p className="text-sm text-foreground/60">
                Your most listened to artists and their estimated payouts from your streams
              </p>
            </div>

            {/* Horizontal scrollable container */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-6 min-w-min">
                {topArtists.map((artist, index: number) => (
                  <ArtistBarChart
                    key={artist.artist_id}
                    artistName={artist.artist_name}
                    artistImage={artist.artist_image}
                    playCount={artist.play_count}
                    estimatedPayout={artist.estimated_payout}
                    maxPlayCount={maxPlayCount}
                    rank={index + 1}
                  />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/60">Total estimated payout</span>
                <span className="text-xl font-bold text-primary">
                  ${topArtists.reduce((sum: number, a) => sum + a.estimated_payout, 0).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-foreground/40 mt-2">
                *Estimated at $0.004 per stream (Spotify average)
              </p>
            </div>
          </section>
        ) : (
          <div className="card text-center py-12">
            <p className="text-foreground/60">No plays yet</p>
            <p className="text-sm text-foreground/40 mt-2">
              Start listening and sync your data to see insights
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
