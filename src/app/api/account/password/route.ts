import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/src/modules/auth/auth.schemas";
import { sendPasswordChangedEmail } from "@/src/modules/auth/auth-emails.service";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) {
    return NextResponse.json({ error: "Conta sem senha local." }, { status: 422 });
  }
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  if (user.email) {
    try {
      await sendPasswordChangedEmail(user.email);
    } catch (error) {
      console.error("Erro ao enviar alerta de alteração de senha:", error);
    }
  }
  return NextResponse.json({ success: true });
}
