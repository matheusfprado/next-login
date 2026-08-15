import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseRouteClient } from "@/lib/supabase";

const verifyLoginTokenSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().trim().regex(/^\d{6,8}$/),
});

export async function POST(request: NextRequest) {
  const parsed = verifyLoginTokenSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Código inválido ou expirado." },
      { status: 400 }
    );
  }

  const allowed = await checkRateLimit({
    scope: "login-token-verify",
    identifier: parsed.data.email,
    limit: 8,
    windowSeconds: 15 * 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Solicite um novo código em alguns minutos." },
      { status: 429 }
    );
  }

  const { supabase, applyCookies } = createSupabaseRouteClient(request);
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error || !data.user?.id || !data.session?.access_token) {
    console.error("Supabase recusou OTP de login ou não criou sessão:", {
      status: error?.status,
      code: error?.code,
      message: error?.message,
      userId: data.user?.id ?? null,
      hasSession: Boolean(data.session?.access_token),
    });

    return NextResponse.json(
      { error: "Código inválido ou expirado." },
      { status: 400 }
    );
  }

  return applyCookies(
    NextResponse.json({ success: true, authenticated: true })
  );
}
