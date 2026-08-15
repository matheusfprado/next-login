import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120).optional(),
  email: z.string().nonempty("Email e obrigatorio").email("Email invalido"),
  password: z
    .string()
    .nonempty("Senha e obrigatoria")
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(100, "Senha deve ter no maximo 100 caracteres")
    .regex(/[A-Z]/, "Senha deve conter uma letra maiuscula")
    .regex(/[a-z]/, "Senha deve conter uma letra minuscula")
    .regex(/[0-9]/, "Senha deve conter um numero")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter um caractere especial"),
});

export async function POST(req: NextRequest) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { name, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Usuario ja existe" }, { status: 409 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error || !data.user?.id) {
    return NextResponse.json(
      { error: error?.message ?? "Nao foi possivel criar a conta" },
      { status: 400 }
    );
  }

  const user = await prisma.user.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      name,
      email,
      emailVerified: data.user.email_confirmed_at
        ? new Date(data.user.email_confirmed_at)
        : null,
    },
    update: {
      name,
      email,
      emailVerified: data.user.email_confirmed_at
        ? new Date(data.user.email_confirmed_at)
        : undefined,
    },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, verificationRequired: true },
    { status: 201 }
  );
}
