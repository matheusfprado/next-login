import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import {
  sendEmailChangeRequestedEmail,
  sendEmailChangeVerificationEmail,
} from "@/src/modules/auth/auth-emails.service";
import { createEmailVerificationToken } from "@/src/modules/auth/tokens.service";
import { profileAvatarUrl } from "@/src/modules/auth/avatar";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(120, "Nome muito grande."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  currentPassword: z.string().min(1).optional(),
  phone: z
    .string()
    .trim()
    .min(8, "Telefone muito curto.")
    .max(20, "Telefone inválido.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    emailVerified: Boolean(user.emailVerified),
    avatar: user.avatar ? profileAvatarUrl(user.updatedAt) : null,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, phone, currentPassword } = parsed.data;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, password: true },
    });
    if (!currentUser?.email) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const emailChanged = currentUser.email !== email;
    if (emailChanged) {
      if (
        !currentPassword ||
        !currentUser.password ||
        !(await bcrypt.compare(currentPassword, currentUser.password))
      ) {
        return NextResponse.json(
          { error: "Confirme sua senha atual para alterar o e-mail." },
          { status: 400 }
        );
      }

      const emailInUse = await prisma.user.findUnique({ where: { email } });
      if (emailInUse) {
        return NextResponse.json(
          { error: "Este e-mail já está em uso." },
          { status: 409 }
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

    if (emailChanged) {
      const token = await createEmailVerificationToken(
        session.user.id,
        email,
        "EMAIL_CHANGE"
      );
      await sendEmailChangeVerificationEmail(email, token);
      try {
        await sendEmailChangeRequestedEmail(currentUser.email, email);
      } catch (error) {
        console.error("Erro ao enviar alerta para o e-mail atual:", error);
      }
    }

    return NextResponse.json({
      user: updated,
      emailChangePending: emailChanged,
      message: emailChanged
        ? "Enviamos um link de confirmação para o novo e-mail."
        : "Perfil atualizado com sucesso.",
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error) {
      // Prisma unique constraint violation
      if ((error as { code?: string }).code === "P2002") {
        return NextResponse.json(
          { error: "E-mail ou telefone já está em uso." },
          { status: 409 }
        );
      }
    }

    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o perfil." },
      { status: 500 }
    );
  }
}
