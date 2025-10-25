import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const goalSchema = z.object({
  title: z.string().min(3, "Título muito curto."),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive("Meta deve ser positiva."),
  currentAmount: z.number().min(0).optional(),
  deadline: z
    .string()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Data inválida.")
    .optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const goals = await prisma.investmentGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, targetAmount, currentAmount, deadline } =
    parsed.data;

  const goal = await prisma.investmentGoal.create({
    data: {
      userId: session.user.id,
      title,
      description,
      targetAmount,
      currentAmount: currentAmount ?? 0,
      deadline: deadline ? new Date(deadline) : undefined,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
