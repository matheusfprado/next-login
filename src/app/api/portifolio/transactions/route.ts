import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { portfolioTransactionsQuerySchema } from "@/src/modules/portfolio/portfolio.schemas";
import { serializePortfolioTransaction } from "@/src/modules/portfolio/portfolio.serializers";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = portfolioTransactionsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta inválida" }, { status: 400 });
  }

  const { coinId, type, page, pageSize } = parsed.data;
  const where = { userId: session.user.id, coinId, type };
  const [items, total] = await prisma.$transaction([
    prisma.portfolioTransaction.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.portfolioTransaction.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(serializePortfolioTransaction),
    total,
    page,
    pageSize,
  });
}
