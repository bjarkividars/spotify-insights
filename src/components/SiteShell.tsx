import { SiteHeader } from "./SiteHeader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-12 px-4">
      <div className="mx-auto max-w-7xl">
        <SiteHeader />
        {children}
      </div>
    </div>
  );
}

