import { createClient, createAdminClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('DATA', data);

        if (!error && data?.session?.user) {
            // Extract refresh token from identity data
            const refreshToken = data.session.provider_refresh_token;

            if (refreshToken) {
                try {
                    // Store in our tokens table using admin client
                    const adminClient = createAdminClient();
                    await adminClient
                        .from('user_tokens')
                        .upsert({
                            user_id: data.session.user.id,
                            provider: 'spotify',
                            refresh_token: refreshToken,
                            updated_at: new Date().toISOString(),
                        });

                    console.log(`[Auth Callback] Stored refresh token for user ${data.session.user.id}`);
                } catch (tokenError) {
                    console.error('[Auth Callback] Failed to store refresh token:', tokenError);
                    // Don't fail the login if token storage fails
                }
            }

            // Check if this is a new user (no plays yet)
            try {
                const { data: existingPlays, error: playsError } = await supabase
                    .from('plays')
                    .select('played_at')
                    .eq('user_id', data.session.user.id)
                    .limit(1);

                if (!playsError && (!existingPlays || existingPlays.length === 0)) {
                    // New user - redirect to syncing page for initial data load
                    console.log(`[Auth Callback] New user detected, redirecting to syncing page`);
                    return NextResponse.redirect(`${origin}/syncing`);
                }
            } catch (checkError) {
                console.error('[Auth Callback] Error checking for existing plays:', checkError);
                // Continue to normal redirect if check fails
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

