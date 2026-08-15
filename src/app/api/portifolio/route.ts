import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { createPortfolioEntrySchema } from "@/src/modules/portfolio/portfolio.schemas";
import { serializePortfolioEntry } from "@/src/modules/portfolio/portfolio.serializers";
import {
  PortfolioDomainError,
  registerPortfolioMovement,
} from "@/src/modules/portfolio/portfolio.service";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createPortfolioEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const position = await registerPortfolioMovement(session.user.id, parsed.data);
    return NextResponse.json(serializePortfolioEntry(position), { status: 201 });
  } catch (error) {
    if (error instanceof PortfolioDomainError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao registrar movimentação:", error);
    return NextResponse.json(
      { error: "Não foi possível registrar a movimentação." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id, amount: { gt: 0 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(portfolio.map(serializePortfolioEntry));
  } catch (error) {
    console.error("Erro ao carregar carteira:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a carteira." },
      { status: 500 }
    );
  }
}


