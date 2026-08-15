import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseServerClient, getCurrentSession } from "@/lib/supabase";

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  if (debug) {
    const cookieStore = await cookies();
    const cookieNames = cookieStore.getAll().map((cookie) => cookie.name);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    return NextResponse.json({
      authenticated: Boolean(data.user?.id),
      userId: data.user?.id ?? null,
      email: data.user?.email ?? null,
      error: error
        ? {
            name: error.name,
            message: error.message,
            status: error.status,
          }
        : null,
      cookieCount: cookieNames.length,
      supabaseCookieNames: cookieNames.filter((name) => name.startsWith("sb-")),
    });
  }

  const session = await getCurrentSession();
  return NextResponse.json(session);
}
