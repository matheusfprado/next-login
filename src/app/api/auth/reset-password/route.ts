import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/src/modules/auth/auth.schemas";
import { hashToken } from "@/src/modules/auth/tokens.service";
import { sendPasswordChangedEmail } from "@/src/modules/auth/auth-emails.service";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(parsed.data.token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: { select: { email: true } } },
  });
  if (!token) {
    return NextResponse.json(
      { error: "Token inválido ou expirado." },
      { status: 400 }
    );
  }

  const password = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { password } }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  if (token.user.email) {
    try {
      await sendPasswordChangedEmail(token.user.email);
    } catch (error) {
      console.error("Erro ao enviar alerta de alteração de senha:", error);
    }
  }

  return NextResponse.json({ success: true });
}
