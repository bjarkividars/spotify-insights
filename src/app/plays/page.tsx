import { getUserPlays } from "./actions";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeftIcon } from "lucide-react";
import { PlaysGrid } from "@/components/PlaysGrid";

export default async function PlaysPage() {
  const plays = await getUserPlays(30);

  return (
    <div className="min-h-screen bg-background pb-12 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="sticky top-0">
          <header
            className="mb-8 pb-4 -mx-4 px-4 relative bg-background z-10
                        after:pointer-events-none
                        after:content-['']
                        after:absolute after:inset-x-0
                        after:-bottom-8 after:h-8
                        after:bg-linear-to-b
                        after:from-background
                        after:to-transparent"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 mt-12">
                  Listening History
                </h1>
                <p className="text-foreground/60">Your most recent plays</p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link href="/" className="btn-ghost flex items-center gap-2">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Home
                </Link>
              </div>
            </div>
          </header>
        </div>

        {plays.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-foreground/60">No plays yet</p>
            <p className="text-sm text-foreground/40 mt-2">
              Your listening history will appear here
            </p>
          </div>
        ) : (
          <PlaysGrid initialPlays={plays} />
        )}
      </div>
    </div>
  );
}
