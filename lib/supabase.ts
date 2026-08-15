import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { profileAvatarUrl } from "@/src/modules/auth/avatar";

export type AppSession = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
};

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

function supabaseSecretKey() {
  const value = process.env.SUPABASE_SECRET_KEY;
  if (!value) throw new Error("SUPABASE_SECRET_KEY is required");
  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot write cookies. Route handlers can.
        }
      },
    },
  });
}

export function createSupabaseRouteClient(request: NextRequest) {
  const cookiesToSet: {
    name: string;
    value: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookiesToSet) {
        cookiesToSet.push(...nextCookiesToSet);
      },
    },
  });

  return {
    supabase,
    applyCookies(response: NextResponse) {
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    },
  };
}

export function createSupabaseAdminClient() {
  return createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentSession(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.id) return null;

  const authUserId = data.user.id;
  const authEmail = data.user.email?.toLowerCase() ?? null;
  const emailVerified = data.user.email_confirmed_at
    ? new Date(data.user.email_confirmed_at)
    : null;
  const metadataName = readName(data.user.user_metadata);

  let dbUser =
    (await prisma.user.findUnique({
      where: { id: authUserId },
      select: userSessionSelect,
    })) ??
    (authEmail
      ? await prisma.user.findUnique({
          where: { email: authEmail },
          select: userSessionSelect,
        })
      : null);

  if (dbUser) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        id: authUserId,
        email: authEmail ?? undefined,
        name: dbUser.name ?? metadataName,
        emailVerified: emailVerified ?? undefined,
      },
      select: userSessionSelect,
    });
  } else {
    dbUser = await prisma.user.create({
      data: {
        id: authUserId,
        email: authEmail,
        name: metadataName,
        emailVerified,
      },
      select: userSessionSelect,
    });
  }

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.avatar ? profileAvatarUrl(dbUser.updatedAt) : null,
    },
  };
}

const userSessionSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  updatedAt: true,
} as const;

export async function getCurrentUserId() {
  const session = await getCurrentSession();
  return session?.user.id ?? null;
}

function readName(metadata: unknown) {
  if (
    metadata &&
    typeof metadata === "object" &&
    "name" in metadata &&
    typeof metadata.name === "string"
  ) {
    return metadata.name;
  }

  return null;
}
