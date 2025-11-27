"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { SettingsDropdown } from "./SettingsDropdown";
import { BarChart3, Clock, Turntable } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Generate", icon: Turntable },
  { href: "/overview", label: "Artist Payouts", icon: BarChart3 },
  { href: "/plays", label: "History", icon: Clock },
];

export function SiteHeader() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeLink = navRef.current.querySelector(
        `a[href="${pathname}"]`
      ) as HTMLElement;
      if (activeLink) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        setIndicator({
          left: linkRect.left - navRect.left,
          width: linkRect.width,
        });
        // Enable transitions after first measurement
        if (!hasInitialized) {
          requestAnimationFrame(() => setHasInitialized(true));
        }
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname, hasInitialized]);

  return (
    <header className="sticky top-0 z-50 mt-6">
      <div className="absolute inset-0" />
      <div className="relative">
        <div className=" flex items-center justify-center h-16 px-2">
          {/* Logo / Brand */}
          {/* Navigation tabs */}
          <nav
            ref={navRef}
            className="flex items-center gap-0.5 p-1 rounded-2xl bg-background/70 backdrop-blur-xl border border-border/50"
          >
            {/* Sliding indicator */}
            <div
              className={`absolute top-1 bottom-1 bg-background rounded-xl shadow-sm ${
                hasInitialized ? "transition-all duration-300 ease-out" : ""
              }`}
              style={{
                left: indicator.left,
                width: indicator.width,
              }}
            />

            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Settings */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <SettingsDropdown />
        </div>
      </div>
    </header>
  );
}
