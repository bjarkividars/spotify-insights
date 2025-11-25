"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlaylistGeneration } from "./playlist-context";

const DESKTOP_PLACEHOLDER = "Describe the playlist you want us to make";
const MOBILE_PLACEHOLDER = "Playlist idea";

export function GlobalPlaylistInput() {
  const {
    input,
    setInput,
    isStreaming,
    statusMessage,
    startGeneration,
    showSuggestions,
  } = usePlaylistGeneration();
  const [isActive, setIsActive] = useState(false);
  const [placeholder, setPlaceholder] = useState(DESKTOP_PLACEHOLDER);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () =>
      setPlaceholder(media.matches ? MOBILE_PLACEHOLDER : DESKTOP_PLACEHOLDER);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void startGeneration(input);
  };

  const showStatus = !showSuggestions && !!statusMessage;

  const shouldExpand = useMemo(() => {
    const hasInput = !!input.trim();
    return isActive || hasInput;
  }, [input, isActive]);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 pointer-events-none">
      <div className="flex justify-center">
        <div
          className="pointer-events-auto transition-[width] duration-200 ease-out"
          style={{
            width: shouldExpand
              ? "min(96vw, 700px)"
              : "clamp(260px, 50vw, 420px)",
          }}
        >
          <div className="flex flex-col items-stretch gap-2">
            <div
              className={`transition-[max-height,opacity] duration-200 ease-out flex justify-center ${
                showStatus ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
              }`}
              aria-live="polite"
            >
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md text-center text-xs text-foreground/80 shadow-soft ${
                  showStatus ? "scale-100" : "scale-95"
                } transition-[transform,opacity] duration-200`}
              >
                {showStatus ? statusMessage : null}
              </span>
            </div>
            <div className="rounded-full bg-background/60 backdrop-blur-xl border border-border/60 shadow-xl shadow-black/10 px-3 py-1.5 flex items-center gap-2">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 flex-1"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsActive(true)}
                  onBlur={() => setIsActive(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base placeholder:text-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={placeholder}
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  className="btn-primary sm:h-9 sm:w-9 h-8 w-8 p-0 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                  aria-label="Generate playlist"
                >
                  {isStreaming ? (
                    <Loader2 className="sm:w-4 sm:h-4 w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="sm:w-4 sm:h-4 w-3.5 h-3.5 transform translate-y-px -translate-x-px" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
