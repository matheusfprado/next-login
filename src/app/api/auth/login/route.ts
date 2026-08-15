import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createSupabaseAdminClient,
  createSupabaseRouteClient,
} from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { supabase, applyCookies } = createSupabaseRouteClient(req);
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
    const migrated = await migrateLegacyUserToSupabase(email, password).catch((error: unknown) => {
      console.error("Erro ao migrar usuario legado para Supabase Auth:", error);
      return false;
    });
    if (migrated) {
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (!retry.error) {
        return applyCookies(NextResponse.json({
          success: true,
          authenticated: Boolean(retry.data.user?.id || retry.data.session?.access_token),
        }));
      }
    }

    return NextResponse.json(
      { error: "E-mail ou senha invalidos" },
      { status: 401 }
    );
  }

  return applyCookies(NextResponse.json({
    success: true,
    authenticated: Boolean(data.user?.id || data.session?.access_token),
  }));
}

async function migrateLegacyUserToSupabase(email: string, password: string) {
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

  const validLegacyPassword = await bcrypt.compare(password, user.password);
  if (!validLegacyPassword) return false;

  const admin = createSupabaseAdminClient();
  const attributes = {
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { name: user.name },
  };

  const created = await admin.auth.admin.createUser({
    ...attributes,
    ...(isUuid(user.id) ? { id: user.id } : {}),
  });

  let supabaseUserId = created.data.user?.id ?? null;

  if (created.error) {
    if (created.error.code !== "email_exists") {
      console.error("Falha ao criar usuario legado no Supabase Auth:", {
        status: created.error.status,
        code: created.error.code,
        message: created.error.message,
      });
    }

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
  const [dbUser] = await prisma
    .$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id::text AS id
        FROM auth.users
        WHERE lower(email) = lower(${email})
        LIMIT 1
      `
    )
    .catch((error: unknown) => {
      console.error("Falha ao consultar usuario no schema auth:", error);
      return [];
    });

  if (dbUser?.id) return dbUser.id;

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
