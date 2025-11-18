import { Suspense } from "react";
import { PlaysGrid } from "@/components/PlaysGrid";
import { PlaysGridSkeleton } from "@/components/PlaysGridSkeleton";

export default function PlaysPage() {
  return (
    <Suspense fallback={<PlaysGridSkeleton />}>
      <PlaysGrid />
    </Suspense>
  );
}
