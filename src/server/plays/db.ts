import { createClient } from "@/utils/supabase/server";

export async function fetchUserPlaysWithJoins(userId: string, limit = 50, offset = 0) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plays")
    .select(`
      played_at,
      track_id,
      tracks!inner (
        id,
        name,
        artist_id,
        artists!inner (
          id,
          name,
          primary_image_url,
          details_status
        )
      )
    `)
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .range(offset, Math.max(offset, offset + limit - 1));

  if (error) {
    throw new Error(`Failed to fetch plays: ${error.message}`);
  }

  return data || [];
}


