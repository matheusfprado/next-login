import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/src/modules/auth/auth-emails.service";
import { createEmailVerificationToken } from "@/src/modules/auth/tokens.service";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120).optional(),
  email: z
    .string()
    .nonempty("Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .nonempty("Senha é obrigatória")
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres")
    .regex(/[A-Z]/, "Senha deve conter uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter um número")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter um caractere especial"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const { name, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Usuário já existe" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  try {
    const token = await createEmailVerificationToken(user.id, email);
    await sendVerificationEmail(email, token);
  } catch (error) {
    console.error("Erro ao enviar verificação de e-mail:", error);
  }

  return NextResponse.json(
    { id: user.id, email: user.email, verificationRequired: true },
    { status: 201 }
  );
}
