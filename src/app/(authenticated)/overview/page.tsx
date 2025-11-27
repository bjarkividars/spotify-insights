import { Suspense } from "react";
import { ArtistVisualization } from "@/components/ArtistVisualization";
import { ArtistVisualizationSkeleton } from "@/components/ArtistVisualizationSkeleton";

export default function OverviewPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Suspense fallback={<ArtistVisualizationSkeleton />}>
        <ArtistVisualization />
      </Suspense>
    </div>
  );
}

