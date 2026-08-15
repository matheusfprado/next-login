import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getCurrentSession,
} from "@/lib/supabase";

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1),
  confirmation: z.literal("EXCLUIR"),
});

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const parsed = deleteAccountSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confirme sua senha e digite EXCLUIR." },
      { status: 400 }
    );
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

  await prisma.user.deleteMany({ where: { id: user.id } });

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Conta local removida, mas falhou remover Auth Supabase." },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();
  return NextResponse.json({ success: true, signOutRequired: true });
}
