"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePlaylistGeneration } from "./playlist-context";
import { TurntableSpinner } from "./TurntableSpinner";

const DESKTOP_PLACEHOLDER = "Tell us the mood you want...";
const MOBILE_PLACEHOLDER = "Music for...";

/**
 * Hook to track visual viewport changes (handles mobile keyboard)
 * Returns the keyboard offset - how much to move the input up when keyboard is visible
 */
function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Calculate the difference between layout viewport and visual viewport
      // This tells us how much the keyboard (or other UI) is covering
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      setOffset(Math.max(0, keyboardHeight));
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return offset;
}

export function GlobalPlaylistInput() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const hasInitialized = useRef(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const keyboardOffset = useKeyboardOffset();

  const {
    input,
    setInput,
    isStreaming,
    statusMessage,
    startGeneration,
    showSuggestions,
    ghostRect,
  } = usePlaylistGeneration();
  const [isActive, setIsActive] = useState(false);
  const [placeholder, setPlaceholder] = useState(DESKTOP_PLACEHOLDER);

  // Detect mobile
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      requestAnimationFrame(() => {
        setShouldAnimate(true);
      });
    }
  }, []);

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
    // When in idle state (showSuggestions true) with no input, always collapse
    // This handles the case where isActive gets "stuck" after modal close
    if (!hasInput && showSuggestions) {
      return false;
    }
    return isActive || hasInput;
  }, [input, isActive, showSuggestions]);

  const transitionClasses = shouldAnimate
    ? "transition-all duration-350 ease-out"
    : "";

  // On mobile + home page, the input is rendered inline by PlaylistInputGhost
  // So we don't render the floating version
  if (isMobile && isHomePage) {
    return null;
  }

  // Position: use ghost rect when on home page, else fixed bottom position
  const useGhostPosition = isHomePage && ghostRect !== null;

  // Calculate input bar width based on state and page
  // When on home page with ghost, use ghost width for perfect alignment
  const inputWidth = useGhostPosition
    ? ghostRect.width
    : shouldExpand
    ? "min(96vw, 760px)"
    : "clamp(260px, 50vw, 420px)";

  // Calculate position styles
  // On home page: position at ghost rect
  // Elsewhere: fixed to bottom, but move up when keyboard is visible
  const getPositionStyles = (): React.CSSProperties => {
    if (useGhostPosition) {
      return {
        top: ghostRect.top,
        willChange: "top, width",
      };
    }

    // Use bottom positioning with transform for keyboard offset
    // This keeps the base position stable while allowing smooth keyboard animation
    return {
      bottom: 20,
      // Move up by keyboard offset when keyboard is visible
      transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
      willChange: "transform",
    };
  };

  return (
    <div
      className={`fixed left-0 right-0 z-40 pointer-events-none ${transitionClasses}`}
      style={getPositionStyles()}
    >
      <div className="flex justify-center px-4">
        <div
          className={`pointer-events-auto relative ${transitionClasses}`}
          style={{ width: inputWidth }}
        >
          {/* Status message - positioned absolutely so it doesn't affect input position */}
          <div
            className={`absolute left-0 right-0 flex justify-center pointer-events-none transition-[opacity,transform] duration-200 ease-out ${
              showStatus && !isHomePage
                ? "opacity-100 -translate-y-full"
                : "opacity-0 -translate-y-[calc(100%-4px)]"
            }`}
            style={{ bottom: "calc(100% - 16px)" }}
            aria-live="polite"
          >
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md text-center text-xs text-foreground/80 shadow-soft transition-transform duration-200 ${
                showStatus && !isHomePage ? "scale-100" : "scale-95"
              }`}
            >
              {showStatus ? statusMessage : null}
            </span>
          </div>

          {/* The input bar */}
          <div
            className={`rounded-full bg-background/60 backdrop-blur-xl border border-border/60 shadow-${
              isHomePage ? "sm" : "xl"
            } shadow-black/10 px-3 py-1.5 flex items-center gap-2`}
          >
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
  );
}
