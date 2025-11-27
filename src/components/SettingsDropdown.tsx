"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Sun, Monitor, Moon, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function SettingsDropdown() {
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

  const handleLogout = () => {
    setOpen(false);
    window.location.href = "/logout";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-2 rounded-xl transition-colors cursor-pointer ${
          open
            ? "bg-muted text-foreground"
            : "bg-background/70 backdrop-blur-xl text-foreground/60 hover:text-foreground"
        }`}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-40 rounded-xl bg-card border border-border p-1.5 shadow-lg z-50"
          role="menu"
        >
          {/* Theme section */}
          <div className="px-2 py-1.5 text-xs font-medium text-foreground/50 uppercase tracking-wider">
            Theme
          </div>
          <button
            onClick={() => {
              setTheme("light");
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-muted text-foreground"
                : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
            role="menuitem"
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>
          <button
            onClick={() => {
              setTheme("system");
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              theme === "system"
                ? "bg-muted text-foreground"
                : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
            role="menuitem"
          >
            <Monitor className="w-4 h-4" />
            <span>System</span>
          </button>
          <button
            onClick={() => {
              setTheme("dark");
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-muted text-foreground"
                : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
            }`}
            role="menuitem"
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          {/* Divider */}
          <div className="my-1.5 border-t border-border" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            role="menuitem"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

