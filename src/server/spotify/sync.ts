import { createAdminClient } from "@/utils/supabase/server";

export type UserToSync = {
  user_id: string;
  last_played_at: string | null;
};

/**
 * Get all users who need syncing from Spotify
 * Returns users with their last played_at timestamp
 */
export async function getUsersToSync(): Promise<UserToSync[]> {
  const supabase = createAdminClient();

  // Get all auth users (all are Spotify users)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    throw new Error(`Failed to fetch users: ${authError.message}`);
  }

  if (!authData?.users || authData.users.length === 0) {
    return [];
  }

  // Get last played_at for each user
  const usersToSync: UserToSync[] = [];

  for (const user of authData.users) {
    // Get last play for this user
    const { data: lastPlay, error: playError } = await supabase
      .from("plays")
      .select("played_at")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(1)
      .single();

    // If error is "PGRST116" (no rows), user has no plays yet
    const lastPlayedAt = playError?.code === "PGRST116" ? null : lastPlay?.played_at || null;

    usersToSync.push({
      user_id: user.id,
      last_played_at: lastPlayedAt,
    });
  }

  return usersToSync;
}

