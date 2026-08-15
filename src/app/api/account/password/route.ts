import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getCurrentSession,
} from "@/lib/supabase";
import { changePasswordSchema } from "@/src/modules/auth/auth.schemas";
import { sendPasswordChangedEmail } from "@/src/modules/auth/auth-emails.service";

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const parsed = changePasswordSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "Conta nao encontrada." }, { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: parsed.data.newPassword,
  });
  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel alterar a senha." },
      { status: 400 }
    );
  }

  try {
    await sendPasswordChangedEmail(user.email);
  } catch (error) {
    console.error("Erro ao enviar alerta de alteracao de senha:", error);
  }

  return NextResponse.json({ success: true });
}
