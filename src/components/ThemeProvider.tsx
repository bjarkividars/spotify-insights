"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "system" to avoid hydration mismatch
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const mountedRef = useRef(false);

  // Read from localStorage after mount to avoid hydration mismatch
  // Use useLayoutEffect to apply theme before paint to avoid flash
  useLayoutEffect(() => {
    mountedRef.current = true;
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
      // Use a microtask to avoid cascading renders
      queueMicrotask(() => {
        setThemeState(stored);
      });
    }
  }, []);

  useEffect(() => {
    // Only run after mount to avoid hydration issues
    if (!mountedRef.current) return;

    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    function updateTheme() {
      // Remove existing theme classes
      root.classList.remove("light", "dark");
      
      let effectiveTheme: "light" | "dark";
      
      if (theme === "system") {
        effectiveTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        effectiveTheme = theme;
      }
      
      // Apply theme
      root.classList.add(effectiveTheme);
      
      // Update resolved theme in a separate microtask to avoid cascading render
      queueMicrotask(() => {
        setResolvedTheme(effectiveTheme);
      });
    }
    
    // Initial update
    updateTheme();
    
    // Listen for system theme changes if theme is "system"
    if (theme === "system") {
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

