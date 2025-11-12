import { getTopArtists } from "./actions";
import { ArtistVisualization } from "@/components/ArtistVisualization";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  const topArtists = await getTopArtists(50);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Spotify Payout
              </h1>
              <p className="text-foreground/60">
                Your listening insights and estimated payouts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/plays" className="btn-primary">
                View History
              </Link>
            </div>
          </div>
        </header>

        {/* Top Artists Section */}
        {topArtists.length > 0 ? (
          <section className="mb-8">
            <ArtistVisualization artists={topArtists} />

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/60">
                  Total estimated payout
                </span>
                <span className="text-xl font-bold text-primary">
                  $
                  {topArtists
                    .reduce((sum: number, a) => sum + a.estimated_payout, 0)
                    .toFixed(2)}
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
