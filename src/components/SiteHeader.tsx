"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Home, ListMusic } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const isPlaysPage = pathname === "/plays";
  const title = isPlaysPage ? "Listening History" : "Top Artists by Plays";

  return (
    <div className="sticky top-0 z-50">
      <header
        className="mb-8 pb-4 -mx-4 px-4 relative bg-background z-10 after:pointer-events-none after:content-[''] after:absolute after:inset-x-0 after:-bottom-8 after:h-8 after:bg-linear-to-b after:from-background after:to-transparent"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 mt-12">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {isPlaysPage ? (
              <Link
                href="/"
                className="btn-ghost flex items-center gap-2 p-2 sm:px-4 sm:py-2"
                aria-label="Home"
              >
                <Home className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            ) : (
              <Link
                href="/plays"
                className="btn-primary flex items-center gap-2 p-2 sm:px-4 sm:py-2"
                aria-label="View History"
              >
                <ListMusic className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">View History</span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

