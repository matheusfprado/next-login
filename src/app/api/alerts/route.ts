import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const alertSchema = z.object({
  coinId: z.string().min(1),
  coinName: z.string().min(1),
  targetPrice: z.number().positive(),
  direction: z.enum(["ABOVE", "BELOW"]).default("ABOVE"),
  deliveryMethod: z.literal("EMAIL").default("EMAIL"),
});

function serializeAlert<T extends { targetPrice: unknown }>(alert: T) {
  return { ...alert, targetPrice: Number(alert.targetPrice) };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts.map(serializeAlert));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = alertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "O envio de e-mail ainda não está configurado no servidor." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailVerified: true,
      preferences: { select: { emailAlerts: true } },
    },
  });
  if (!user?.email || !user.emailVerified) {
    return NextResponse.json(
      { error: "Confirme seu e-mail antes de criar alertas." },
      { status: 422 }
    );
  }
  if (user.preferences?.emailAlerts === false) {
    return NextResponse.json(
      { error: "Ative os alertas por e-mail nas configurações." },
      { status: 409 }
    );
  }

  const alert = await prisma.priceAlert.create({
    data: {
      userId: session.user.id,
      coinId: parsed.data.coinId,
      coinName: parsed.data.coinName,
      targetPrice: parsed.data.targetPrice,
      direction: parsed.data.direction,
      deliveryMethod: parsed.data.deliveryMethod,
    },
  });

  return NextResponse.json(serializeAlert(alert), { status: 201 });
}
