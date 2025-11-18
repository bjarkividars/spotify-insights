import { SiteHeader } from "./SiteHeader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-background pb-12 px-4">
      <div className="mx-auto max-w-7xl w-full flex flex-col flex-1">
        <SiteHeader />
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

