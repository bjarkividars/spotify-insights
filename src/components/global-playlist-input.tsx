"use client";

import { Music } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlaylistGeneration } from "./playlist-context";

const DESKTOP_PLACEHOLDER = "Tell us the mood you want...";
const MOBILE_PLACEHOLDER = "Music for...";

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
                  <TurntableSpinner loading={isStreaming} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TurntableSpinner({ size = "w-12", className = "", loading = true }) {
  return (
    <div className={`${size} ${className}`}>
      {/* Square wrapper using padding trick */}
      <div className="relative w-full" style={{ paddingBottom: "100%" }}>
        <div className="absolute inset-0">
          
          {/* 1. The Spinning Record - sizing container */}
          <div 
            style={{
              position: "absolute",
              top: "5%",
              left: "5%",
              width: "89%",
              paddingBottom: "89%",
            }}
          >
            {/* Record visual - explicitly positioned to fill parent */}
            <div 
              className="rounded-full shadow-lg overflow-hidden"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: loading ? "#262626" : "#171717",
                animation: loading ? "spin 3s linear infinite" : "none",
                transition: "background-color 0.5s ease-out",
              }}
            >
              {/* Vinyl Sheen */}
              <div 
                className="absolute inset-0 bg-[conic-gradient(from_45deg,transparent_0deg,white_70deg,transparent_140deg,white_250deg,transparent_360deg)]"
                style={{
                  opacity: loading ? 0.3 : 0.15,
                  transition: "opacity 0.5s ease-out",
                }}
              />

              {/* Vinyl Grooves */}
              <div 
                className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_2px,#000_3px,#000_4px)]"
                style={{
                  opacity: loading ? 0.5 : 0.7,
                  transition: "opacity 0.5s ease-out",
                }}
              />

              {/* Record Label */}
              <div 
                className="absolute inset-[32%] rounded-full border-4 border-neutral-900/40 shadow-inner flex items-center justify-center"
                style={{
                  backgroundColor: loading ? "#fb7185" : "#e11d48",
                  transition: "background-color 0.5s ease-out",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-neutral-900/90 shadow-sm" />
              </div>
            </div>
          </div>

          {/* 2. The Tonearm */}
          <div className="absolute inset-0 pointer-events-none">
            <div 
              style={{
                position: "absolute",
                top: "-1%",
                right: "-1%",
                width: "18%",
                paddingBottom: "18%",
              }}
            >
              {/* Pivot Base */}
              <div 
                className="rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] border z-20 flex items-center justify-center"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: loading ? "#d4d4d4" : "#e5e5e5",
                  borderColor: loading ? "#a3a3a3" : "#737373",
                  transition: "background-color 0.5s ease-out, border-color 0.5s ease-out",
                }}
              >
                <div 
                  className="w-[40%] h-[40%] rounded-full shadow-inner"
                  style={{
                    backgroundColor: loading ? "#a3a3a3" : "#737373",
                    transition: "background-color 0.5s ease-out",
                  }}
                />
              </div>

              {/* The Arm */}
              <div
                className="z-10"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "35%",
                  paddingBottom: "220%",
                  transformOrigin: "top center",
                  transform: `translate(-50%, 0) rotate(${loading ? "45deg" : "-30deg"})`,
                  transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div 
                  className="rounded-full"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: loading ? "#d4d4d4" : "#e5e5e5",
                    boxShadow: loading 
                      ? "1px 1px 2px rgba(0,0,0,0.4)" 
                      : "1px 1px 3px rgba(0,0,0,0.5)",
                    transition: "background-color 0.5s ease-out, box-shadow 0.5s ease-out",
                  }}
                />

                {/* Headshell */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 rounded-sm border shadow-sm"
                  style={{
                    bottom: "-2%",
                    width: "200%",
                    height: "10%",
                    backgroundColor: loading ? "#d4d4d4" : "#e5e5e5",
                    borderColor: loading ? "#a3a3a3" : "#737373",
                    transition: "background-color 0.5s ease-out, border-color 0.5s ease-out",
                  }}
                >
                  <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-[2px] h-[4px] bg-black/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
