import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(1, "Informe um nome.").max(120, "Nome muito grande."),
  email: z.string().email("E-mail inválido."),
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
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
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
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, email, phone } = parsed.data;

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
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

    return NextResponse.json({ user: updated });
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
