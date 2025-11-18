import { getTopArtistsPage, getTotalPayout } from "@/app/actions";
import { ArtistVisualizationClient } from "./ArtistVisualizationClient";

export async function ArtistVisualization() {
  const [result, totalPayout] = await Promise.all([
    getTopArtistsPage(20, 0),
    getTotalPayout(),
  ]);

  return (
    <ArtistVisualizationClient
      initialArtists={result.artists}
      totalPayout={totalPayout}
    />
  );
}
