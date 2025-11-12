import { createAdminClient } from "@/utils/supabase/server";
import { refreshSpotifyToken } from "@/utils/auth";

type TokenCache = {
  access_token: string;
  expires_at: number; // timestamp when to invalidate
};

class SpotifyTokenManager {
  private cache: Map<string, TokenCache>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get access token for a user (from cache or by refreshing)
   */
  async getAccessToken(userId: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && Date.now() < cached.expires_at) {
      console.log(`[TokenManager] Using cached token for user ${userId}`);
      return cached.access_token;
    }

    // Not in cache or expired, refresh
    console.log(`[TokenManager] Refreshing token for user ${userId}`);
    const refreshToken = await this.getRefreshToken(userId);
    await this.refreshToken(userId, refreshToken);

    // Return from cache (just set by refreshToken)
    const newCached = this.cache.get(userId);
    if (!newCached) {
      throw new Error("Token refresh failed to populate cache");
    }

    return newCached.access_token;
  }

  /**
   * Refresh token and update cache/DB
   */
  async refreshToken(userId: string, currentRefreshToken: string): Promise<void> {
    // Call Spotify API to refresh
    const newTokens = await refreshSpotifyToken(currentRefreshToken);

    // If Spotify returned a new refresh token, update DB
    if (newTokens.refresh_token !== currentRefreshToken) {
      console.log(`[TokenManager] Rotating refresh token for user ${userId}`);
      await this.updateRefreshToken(userId, newTokens.refresh_token);
    }

    // Cache the access token for this run (55 minutes)
    this.cache.set(userId, {
      access_token: newTokens.access_token,
      expires_at: Date.now() + 55 * 60 * 1000, // 55 minutes
    });

    console.log(`[TokenManager] Cached access token for user ${userId}`);
  }

  /**
   * Clear cache (call at end of cron run)
   */
  clearCache(): void {
    console.log(`[TokenManager] Clearing cache (${this.cache.size} entries)`);
    this.cache.clear();
  }

  /**
   * Get refresh token from DB
   */
  private async getRefreshToken(userId: string): Promise<string> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("user_tokens")
      .select("refresh_token")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new Error(`No refresh token found for user ${userId}: ${error?.message}`);
    }

    return data.refresh_token;
  }

  /**
   * Update refresh token in DB if rotated
   */
  private async updateRefreshToken(userId: string, newToken: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("user_tokens")
      .update({
        refresh_token: newToken,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(`[TokenManager] Failed to update refresh token for user ${userId}:`, error);
      throw new Error(`Failed to update refresh token: ${error.message}`);
    }
  }
}

// Export singleton instance
export const tokenManager = new SpotifyTokenManager();

