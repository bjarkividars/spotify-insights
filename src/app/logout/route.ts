import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  // Sign out the user
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[Logout] Failed to sign out:", error);
    // Still redirect even if sign out fails
  }

  // Redirect to login page
  return NextResponse.redirect(`${origin}/login`);
}

