import { SiteShell } from "@/components/SiteShell";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      <SiteShell>{children}</SiteShell>
    </div>
  );
}

