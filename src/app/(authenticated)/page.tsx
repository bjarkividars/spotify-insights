import { getTopArtists } from "../actions";
import { ArtistVisualization } from "@/components/ArtistVisualization";

export default async function Home() {
  const topArtists = await getTopArtists(20);

  return (
    <>
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
    </>
  );
}
