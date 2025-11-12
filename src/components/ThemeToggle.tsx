"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentIcon =
    theme === "light" ? <Sun className="w-4 h-4" /> : theme === "dark" ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;
  const currentLabel = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <>
      {/* Mobile: dropdown (icon + vertical list) */}
      <div className="relative sm:hidden" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 active:bg-secondary/70 transition-colors"
          aria-label={`Theme: ${currentLabel}`}
        >
          {currentIcon}
        </button>
        {open && (
          <div
            className="absolute right-0 top-0 w-28 rounded-xl bg-secondary p-1 shadow-lg border border-border z-11"
            role="menu"
          >
            <button
              onClick={() => {
                setTheme("light");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                theme === "light" ? "bg-card text-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
              }`}
              role="menuitem"
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                theme === "system" ? "bg-card text-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
              }`}
              role="menuitem"
            >
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-foreground/70 hover:text-foreground"
              }`}
              role="menuitem"
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop: segmented control */}
      <div className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-secondary p-1">
        <button
          onClick={() => setTheme("light")}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
            theme === "light"
              ? "bg-card text-foreground shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
          aria-label="Light theme"
        >
          <Sun className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setTheme("system")}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
            theme === "system"
              ? "bg-card text-foreground shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
          aria-label="System theme"
        >
          <Monitor className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setTheme("dark")}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
            theme === "dark"
              ? "bg-card text-foreground shadow-sm"
              : "text-foreground/60 hover:text-foreground"
          }`}
          aria-label="Dark theme"
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}

