import { getUserPlays } from "@/app/(authenticated)/plays/actions";
import { PlaysGridClient } from "./PlaysGridClient";

export async function PlaysGrid() {
  const plays = await getUserPlays(30);

  return <PlaysGridClient initialPlays={plays} />;
}
