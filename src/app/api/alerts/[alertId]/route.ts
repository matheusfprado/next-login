import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["ACTIVE", "TRIGGERED", "DISABLED"]).optional(),
});

type RouteContext = {
  params: { alertId: string };
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const { alertId } = params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const result = await prisma.priceAlert.updateMany({
    where: { id: alertId, userId: session.user.id },
    data: {
      status: parsed.data.status,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 });
  }

  const updated = await prisma.priceAlert.findUnique({
    where: { id: alertId },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { alertId } = params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const result = await prisma.priceAlert.deleteMany({
    where: { id: alertId, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
