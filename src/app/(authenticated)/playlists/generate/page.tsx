"use client";

import { ArrowRight, Loader2, Music, Send } from "lucide-react";
import { usePlaylistGeneration } from "@/components/playlist-context";

const SUGGESTIONS = [
  "Only my top artists",
  "Complete discovery",
  "Rediscover old favorites",
  "My top genres mix",
  "High energy favorites",
  "Chill vibes",
];

export default function GeneratePlaylistPage() {
  const {
    input,
    setInput,
    status,
    isStreaming,
    showSuggestions,
    statusMessage,
    startGeneration,
  } = usePlaylistGeneration();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void startGeneration(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    void startGeneration(suggestion);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 max-w-4xl mx-auto w-full py-8 px-4">
      <div className="text-center mb-8 space-y-2 px-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Generate from Your History
        </h1>
        <p className="text-foreground/70 text-base sm:text-lg">
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
            className="flex-1 w-full resize-none bg-transparent px-4 py-2 text-base placeholder:text-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="What are the vibes you're feeling..."
            rows={1}
            disabled={isStreaming}
          />
          <div className="pb-1 pr-2">
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="btn-primary h-8 w-8 p-0 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Generate playlist"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 transform translate-y-px -translate-x-px" />
              )}
            </button>
          </div>
        </form>
      </div>

      {showSuggestions && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isStreaming}
              className="group cursor-pointer text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 py-2 px-3 rounded-lg transition-colors text-left border border-transparent hover:border-border flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
              <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          ))}
        </div>
      )}

      {!showSuggestions && (
        <div className="mt-8 w-full flex items-center h-[88px] justify-center gap-2 text-sm text-foreground/70 px-2 text-center">
          {status === "error" ? (
            <Music className="w-4 h-4" />
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Overlay is rendered globally via SiteShell */}
    </div>
  );
}
