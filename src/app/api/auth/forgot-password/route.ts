import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase";
import { emailSchema } from "@/src/modules/auth/auth.schemas";

const genericResponse = {
  message: "Se o e-mail estiver cadastrado, enviaremos as instruções.",
};

export async function POST(request: Request) {
  const parsed = emailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(genericResponse);

  const allowed = await checkRateLimit({
    scope: "forgot-password",
    identifier: parsed.data.email,
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (!allowed) return NextResponse.json(genericResponse, { status: 429 });

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: siteUrl ? new URL("/reset-password", siteUrl).toString() : undefined,
  });

  if (error) {
    console.error("Supabase não enviou o e-mail de reset:", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
  }

  return NextResponse.json(genericResponse);
}
