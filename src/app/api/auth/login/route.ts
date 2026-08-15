import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

import { prisma } from "@/lib/prisma";
import {
  createSupabaseAdminClient,
} from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: CookieOptions;
  }> = [];
  const supabase = createRouteSupabaseClient(req, cookiesToSet);
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciais invalidas" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const migrated = await migrateLegacyUserToSupabase(email).catch((error: unknown) => {
      console.error("Erro ao migrar usuario legado para Supabase Auth:", error);
      return false;
    });
    if (migrated) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (!retry.error) {
        const response = NextResponse.json({
          success: true,
          authenticated: Boolean(retry.data.user?.id || retry.data.session?.access_token),
          setCookieCount: cookiesToSet.length,
        });
        applySupabaseCookies(response, cookiesToSet);
        return response;
      }
    }

    return NextResponse.json(
      { error: "E-mail ou senha invalidos" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    authenticated: Boolean(data.user?.id || data.session?.access_token),
    setCookieCount: cookiesToSet.length,
  });
  applySupabaseCookies(response, cookiesToSet);
  return response;
}

function createRouteSupabaseClient(
  request: NextRequest,
  pendingCookies: Array<{ name: string; value: string; options: CookieOptions }>
) {
  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
      },
    },
  });
}

function applySupabaseCookies(
  response: NextResponse,
  cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
) {
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
}

function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!value) throw new Error("SUPABASE_URL is required");
  return value;
}

function supabasePublishableKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!value) throw new Error("SUPABASE_PUBLISHABLE_KEY is required");
  return value;
}

async function migrateLegacyUserToSupabase(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      emailVerified: true,
    },
  });

  if (!user?.email || !user.password) return false;

  const admin = createSupabaseAdminClient();
  const attributes = {
    email: user.email,
    password_hash: user.password,
    email_confirm: Boolean(user.emailVerified),
    user_metadata: { name: user.name },
  };

  const created = await admin.auth.admin.createUser({
    ...attributes,
    ...(isUuid(user.id) ? { id: user.id } : {}),
  });

  let supabaseUserId = created.data.user?.id ?? null;

  if (created.error) {
    console.error("Falha ao criar usuario legado no Supabase Auth:", {
      status: created.error.status,
      code: created.error.code,
      message: created.error.message,
    });

    supabaseUserId = await findSupabaseUserIdByEmail(email);
    if (!supabaseUserId) return false;

    const updated = await admin.auth.admin.updateUserById(
      supabaseUserId,
      attributes
    );
    if (updated.error) {
      console.error("Falha ao atualizar usuario legado no Supabase Auth:", {
        status: updated.error.status,
        code: updated.error.code,
        message: updated.error.message,
      });
      return false;
    }
  }

  if (!supabaseUserId) return false;

  if (supabaseUserId !== user.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        id: supabaseUserId,
        emailVerified: user.emailVerified ?? new Date(),
      },
    });
  }

  return true;
}

async function findSupabaseUserIdByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const pageSize = 1000;
  let page = 1;

  while (page <= 10) {
    const result = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (result.error) {
      console.error("Falha ao listar usuarios do Supabase Auth:", {
        status: result.error.status,
        code: result.error.code,
        message: result.error.message,
      });
      return null;
    }

    const found = result.data.users.find(
      (user) => user.email?.toLowerCase() === email
    );
    if (found) return found.id;
    if (result.data.users.length < pageSize) return null;
    page += 1;
  }

  return null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
