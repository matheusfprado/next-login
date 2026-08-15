import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase";

const oauthSchema = z.object({
  provider: z.enum(["google"]),
});

function getSiteUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL;
  if (configuredUrl) return configuredUrl;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  const parsed = oauthSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provedor inválido." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data.provider,
    options: {
      redirectTo: new URL("/auth/callback", getSiteUrl(request)).toString(),
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message ?? "Não foi possível iniciar o login social." },
      { status: 400 }
    );
  }

  return NextResponse.json({ url: data.url });
}
