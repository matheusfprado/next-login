import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const { supabase, applyCookies } = createSupabaseRouteClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return applyCookies(NextResponse.redirect(new URL(next, url.origin)));
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}
