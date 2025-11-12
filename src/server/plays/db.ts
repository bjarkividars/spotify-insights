import { createClient } from "@/utils/supabase/server";

export async function fetchUserPlaysWithJoins(userId: string, limit = 50) {
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
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch plays: ${error.message}`);
  }

  return data || [];
}


