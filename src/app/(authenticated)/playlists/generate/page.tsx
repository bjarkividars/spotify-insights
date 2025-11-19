"use client";

import { ArrowRight, Send, Loader2, Music } from "lucide-react";
import { useState, useTransition } from "react";
import { generatePlaylistAction, PlaylistGenerationResult } from "./actions";
import type { PlaylistTrack } from "./types";

export default function GeneratePlaylistPage() {
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PlaylistGenerationResult | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    startTransition(async () => {
      try {
        const data = await generatePlaylistAction(input);
        setResult(data);
      } catch (error) {
        console.error("Failed to generate playlist", error);
        // TODO: Handle error state
      }
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Optional: auto-submit on suggestion click?
    // For now, just fill the input so user can edit or submit.
    // Actually, let's auto-submit for better UX.
    startTransition(async () => {
      try {
        const data = await generatePlaylistAction(suggestion);
        setResult(data);
      } catch (error) {
        console.error("Failed to generate playlist", error);
      }
    });
  };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-start flex-1 max-w-4xl mx-auto w-full py-8 px-4">
        <div className="w-full mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{result.name}</h2>
          <button 
            onClick={() => setResult(null)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Start Over
          </button>
        </div>

        <div className="w-full grid gap-4">
          {result.tracks.map((track: PlaylistTrack, i: number) => (
            <div key={`${track.spotifyId ?? track.name}-${i}`} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden">
                {track.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.image} alt={track.artist} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>
              {track.uri && (
                <a
                  href={track.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Open
                </a>
              )}
            </div>
          ))}
        </div>
        
        {result.tracks.length === 0 && (
           <div className="text-center py-12 text-muted-foreground">
             No tracks found. Try a different prompt!
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 max-w-2xl mx-auto w-full">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Generate from Your History
        </h1>
        <p className="text-muted-foreground text-lg">
          Create unique playlists based on your listening habits. Describe what
          you want, and we&apos;ll curate it from your data.
        </p>
      </div>

      <div className="w-full card p-2 shadow-soft bg-background border-primary/10 focus-within:border-primary/30 transition-colors duration-200">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="flex-1 w-full resize-none bg-transparent px-4 py-2 text-base placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Rediscover songs I haven't played in a while"
            rows={1}
            disabled={isPending}
          />
          <div className="pb-1 pr-2">
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="btn-primary h-8 w-8 p-0 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Generate playlist"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 transform translate-y-px -translate-x-px" />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        {[
          "Only my top artists",
          "Complete discovery",
          "Rediscover old favorites",
          "My top genres mix",
          "High energy favorites",
          "Chill vibes",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isPending}
            className="group cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 py-2 px-3 rounded-md transition-colors text-left border border-transparent hover:border-border flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
            <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
