import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().max(500).nullable().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z
    .string()
    .nullable()
    .refine(
      (value) => value === null || value === undefined || !Number.isNaN(Date.parse(value)),
      "Data inválida."
    )
    .optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ goalId: string | string[] | undefined }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { goalId } = await params;
  if (!goalId || Array.isArray(goalId)) {
    return NextResponse.json({ error: "ID da meta inválido" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const result = await prisma.investmentGoal.updateMany({
    where: { id: goalId, userId: session.user.id },
    data: {
      title: data.title ?? undefined,
      description:
        data.description === undefined ? undefined : data.description ?? null,
      targetAmount: data.targetAmount ?? undefined,
      currentAmount: data.currentAmount ?? undefined,
      deadline:
        data.deadline === undefined
          ? undefined
          : data.deadline
          ? new Date(data.deadline)
          : null,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  const updated = await prisma.investmentGoal.findUnique({
    where: { id: goalId },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ goalId: string | string[] | undefined }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { goalId } = await params;
  if (!goalId || Array.isArray(goalId)) {
    return NextResponse.json({ error: "ID da meta inválido" }, { status: 400 });
  }

  const result = await prisma.investmentGoal.deleteMany({
    where: { id: goalId, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
