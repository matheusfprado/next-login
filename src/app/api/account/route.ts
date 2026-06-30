import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1),
  confirmation: z.literal("EXCLUIR"),
});

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confirme sua senha e digite EXCLUIR." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }
  if (!user.password) {
    return NextResponse.json(
      { error: "Esta conta não possui senha local para confirmação." },
      { status: 422 }
    );
  }
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const deleted = await prisma.user.deleteMany({
    where: { id: session.user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true, signOutRequired: true });
}
