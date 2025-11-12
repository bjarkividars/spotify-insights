"use server";

const scopes = [
    "user-top-read",
    "user-read-recently-played",
    "user-read-currently-playing",
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-follow-read",
    "user-read-playback-state",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-modify",
    "user-follow-modify",
    "user-modify-playback-state",
    "ugc-image-upload",
    "streaming",
].join(" ");


import { cookies, headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function handleSpotifyAuth() {
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    // Use localhost:3000 in development, actual origin in production
    const isDevelopment = process.env.NODE_ENV === "development";
    const headerOrigin = (await headers()).get("origin");
    const origin = isDevelopment 
        ? "http://localhost:3000" 
        : (headerOrigin || "http://localhost:3000");

    // Set the returning visitor cookie
    const hasVisited = cookieStore.get("has_visited");

    if (!hasVisited) {
        cookieStore.set("has_visited", "true", {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            httpOnly: true,
            sameSite: "lax",
        });
    }

    console.log("Origin:", origin);

    // Initiate Spotify OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "spotify",
        options: {
            redirectTo: `${origin}/auth/callback`,
            scopes: scopes,
        },
    });

    if (error) {
        console.error("Spotify auth error:", error);
        return { error: error.message };
    }

    if (data?.url) {
        redirect(data.url);
    }

    return null;
}

