import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

const baseSettingsSchema = z.object({
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  weeklySummary: z.boolean(),
  language: z.string().min(2),
  currency: z.string().min(2),
  dashboardDensity: z.string().min(2),
});

const settingsSchema = baseSettingsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "Nenhuma configuração fornecida.",
  }
);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const prefs = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (prefs) {
    return NextResponse.json(prefs);
  }

  const created = await prisma.userPreference.create({
    data: {
      userId: session.user.id,
    },
  });

  return NextResponse.json(created);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const existing = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "Usuário não encontrado para salvar as preferências." },
        { status: 404 }
      );
    }
  }

  const merged = {
    emailAlerts: parsed.data.emailAlerts ?? existing?.emailAlerts ?? true,
    smsAlerts: parsed.data.smsAlerts ?? existing?.smsAlerts ?? false,
    weeklySummary: parsed.data.weeklySummary ?? existing?.weeklySummary ?? true,
    language: parsed.data.language ?? existing?.language ?? "Português (Brasil)",
    currency: parsed.data.currency ?? existing?.currency ?? "Real (BRL)",
    dashboardDensity:
      parsed.data.dashboardDensity ?? existing?.dashboardDensity ?? "Confortável",
  } satisfies z.infer<typeof baseSettingsSchema>;

  const updated = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: merged,
    create: {
      userId: session.user.id,
      ...merged,
    },
  });

  return NextResponse.json(updated);
}
