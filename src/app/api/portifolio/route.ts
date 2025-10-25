import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

// POST - Adicionar ativo na carteira
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { coinId, coinName, amount, buyPrice } = await req.json();

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: session.user.id,
      coinId,
      coinName,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
    },
  });

  return NextResponse.json(portfolio);
}

// GET - Buscar carteira do usuário
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(portfolio);
}
