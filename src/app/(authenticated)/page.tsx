"use client";

import { ArrowRight, Music } from "lucide-react";
import { usePlaylistGeneration } from "@/components/playlist-context";
import { PlaylistInputGhost } from "@/components/PlaylistInputGhost";
import { CSSProperties } from "react";

const SUGGESTIONS = [
  "Late night drive",
  "Songs I forgot I loved",
  "Sunday morning coffee",
  "Only bangers",
  "Deep focus mode",
  "Feel-good throwbacks",
];

export default function HomePage() {
  const {
    setInput,
    status,
    isStreaming,
    statusMessage,
    startGeneration,
    showSuggestions,
  } = usePlaylistGeneration();

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    void startGeneration(suggestion);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 max-w-4xl mx-auto w-full px-4">
      {/* Title and description */}
      <div className="text-center mb-8 space-y-3 px-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Spin something{" "}
          <span className="bg-linear-to-r from-foreground from-40% via-green-400 via-60% to-teal-600 bg-clip-text text-transparent italic pr-1 animate-gradient-slide">
            new
          </span>
        </h1>
        <p className="text-foreground/60 text-base sm:text-lg">
          Playlists built from your listening history
        </p>
      </div>

      {/* Ghost element for input positioning */}
      <PlaylistInputGhost />

      {/* Suggestions with staggered animation */}
      {showSuggestions && (
        <div
          className=" w-full sm:mt-4 relative fade-top fade-bottom"
          style={{ "--fade-size": "16px" } as CSSProperties}
        >
          <div className=" flex flex-wrap justify-center gap-2 w-190 max-w-full max-h-[130px] h-full overflow-y-auto py-4 scrollbar-hide">
            {SUGGESTIONS.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isStreaming}
                className="group cursor-pointer text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 py-2 px-4 rounded-full transition-colors border border-border/50 hover:border-border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in-up opacity-0 sm:w-auto w-full justify-between"
                style={{
                  animationDelay: `${500 + index * 75}ms`,
                  animationFillMode: "forwards",
                }}
              >
                <span className="sm:translate-x-2 group-hover:translate-x-0 transition-transform duration-200">
                  {suggestion}
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:opacity-0 sm:-translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all " />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading status */}
      {!showSuggestions && (
        <div className="mt-8 w-full flex items-center h-[88px] justify-center gap-2 text-sm text-foreground/70 px-2 text-center">
          {status === "error" && <Music className="w-4 h-4" />}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
