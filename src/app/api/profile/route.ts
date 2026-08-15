import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, getCurrentSession } from "@/lib/supabase";
import { profileAvatarUrl } from "@/src/modules/auth/avatar";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Nome muito grande."),
  email: z.string().trim().toLowerCase().email("E-mail invalido."),
  currentPassword: z.string().min(1).optional(),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone muito curto.")
    .max(20, "Telefone invalido.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    emailVerified: Boolean(user.emailVerified),
    avatar: user.avatar ? profileAvatarUrl(user.updatedAt) : null,
  });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados invalidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, phone, currentPassword } = parsed.data;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!currentUser?.email) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    const emailChanged = currentUser.email !== email;
    const supabase = await createSupabaseServerClient();

    if (emailChanged) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Confirme sua senha atual para alterar o e-mail." },
          { status: 400 }
        );
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword,
      });
      if (signInError) {
        return NextResponse.json(
          { error: "Confirme sua senha atual para alterar o e-mail." },
          { status: 400 }
        );
      }

      const emailInUse = await prisma.user.findUnique({ where: { email } });
      if (emailInUse) {
        return NextResponse.json(
          { error: "Este e-mail ja esta em uso." },
          { status: 409 }
        );
      }

      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        return NextResponse.json(
          { error: "Nao foi possivel solicitar a troca de e-mail." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      user: updated,
      emailChangePending: emailChanged,
      message: emailChanged
        ? "Enviamos a confirmacao para o novo e-mail."
        : "Perfil atualizado com sucesso.",
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "E-mail ou telefone ja esta em uso." },
        { status: 409 }
      );
    }

    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Nao foi possivel salvar o perfil." },
      { status: 500 }
    );
  }
}
