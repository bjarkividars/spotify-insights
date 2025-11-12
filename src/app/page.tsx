import { getSpotifyData } from "./actions";

export default async function Home() {
  const data = await getSpotifyData();
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Spotify Payout
          </h1>
          <p className="text-lg text-foreground/70">
            Welcome to your dashboard
          </p>
        </header>
        <div className="grid grid-cols-1 gap-6">
          <div className="card">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Recently Played Tracks
            </h2>
            <pre className="text-sm text-foreground/70 whitespace-pre-wrap">
              {data?.items.map((item) => item.track.name).join(", ")}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
