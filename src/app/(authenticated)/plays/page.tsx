import { getUserPlays } from "./actions";
import { PlaysGrid } from "@/components/PlaysGrid";

export default async function PlaysPage() {
  const plays = await getUserPlays(30);

  return (
    <>
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
    </>
  );
}
