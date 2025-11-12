import { createClient } from "@/utils/supabase/server";
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";

export async function getAuthenticatedUser() {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Not authenticated");
    }

    return { user, supabase };
}

async function getSpotifyToken(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.provider_token) {
        throw new Error("No Spotify token found");
    }

    return {
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token || "",
    };
}

export async function refreshSpotifyToken(refreshToken: string) {
    // Refresh Spotify token directly using Spotify's API
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        throw new Error("Spotify client credentials not configured");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to refresh token: ${response.statusText}, ${JSON.stringify(errorData)}`);
    }

    const tokenData = await response.json();
    
    // Update Supabase session with new provider token
    // Note: Supabase stores provider tokens, but we need to update them manually
    // For now, we'll return the new token and let the caller use it
    return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep old one
    };
}

export async function getAuthenticatedSpotifySession() {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Not authenticated");
    }

    const { access_token, refresh_token } = await getSpotifyToken(supabase);

    const token: AccessToken = {
        access_token,
        token_type: "Bearer",
        expires_in: 0,
        refresh_token,
    };

    const spotifyApi = SpotifyApi.withAccessToken(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        token
    );

    return spotifyApi;
}

export async function withSpotifyApiRefresh<T>(
    apiCall: (spotifyApi: Awaited<ReturnType<typeof getAuthenticatedSpotifySession>>) => Promise<T>
): Promise<T> {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("Not authenticated");
    }

    // Get initial token
    let { access_token, refresh_token } = await getSpotifyToken(supabase);
    
    const createSpotifyApi = (token: string) => {
        const accessToken: AccessToken = {
            access_token: token,
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token,
        };
        return SpotifyApi.withAccessToken(
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
            accessToken
        );
    };

    let spotifyApi = createSpotifyApi(access_token);

    try {
        return await apiCall(spotifyApi);
    } catch (error: unknown) {
        // Check if it's a 401 error
        const is401 = 
            (error && typeof error === 'object' && 'status' in error && error.status === 401) ||
            (error && typeof error === 'object' && 'response' in error && 
             error.response && typeof error.response === 'object' && 
             'status' in error.response && error.response.status === 401);
        
        if (is401) {
            // Try refreshing the token once
            try {
                const refreshed = await refreshSpotifyToken(refresh_token);
                access_token = refreshed.access_token;
                refresh_token = refreshed.refresh_token;
                spotifyApi = createSpotifyApi(access_token);
                
                // Retry the API call once
                return await apiCall(spotifyApi);
            } catch (refreshError) {
                throw new Error(`Failed to refresh token and retry request: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
            }
        }
        // If it's not a 401, throw the original error
        throw error;
    }
}

