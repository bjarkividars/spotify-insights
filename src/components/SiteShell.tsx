import { SiteHeader } from "./SiteHeader";
import { PlaylistGenerationProvider } from "./playlist-context";
import { GlobalPlaylistInput } from "./global-playlist-input";
import { PlaylistOverlay } from "@/app/(authenticated)/playlists/generate/PlaylistOverlay";
import { PageTransition } from "./PageTransition";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <PlaylistGenerationProvider>
      <div className="h-full flex flex-col bg-background pb-28 px-4">
        <div className="mx-auto max-w-7xl w-full flex flex-col flex-1">
          <SiteHeader />
          <div className="flex-1 flex flex-col min-h-0 pt-6">
            <GlobalPlaylistInput />
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>
      <PlaylistOverlay />
    </PlaylistGenerationProvider>
  );
}
