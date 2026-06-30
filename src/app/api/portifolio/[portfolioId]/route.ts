import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/authOptions";
import { updatePortfolioEntrySchema } from "@/src/modules/portfolio/portfolio.schemas";
import { serializePortfolioEntry } from "@/src/modules/portfolio/portfolio.serializers";
import {
  PortfolioDomainError,
  removePortfolioPosition,
  updatePortfolioPosition,
} from "@/src/modules/portfolio/portfolio.service";

interface RouteContext {
  params: Promise<{ portfolioId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { portfolioId } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updatePortfolioEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const position = await updatePortfolioPosition(
      session.user.id,
      portfolioId,
      parsed.data
    );
    return NextResponse.json(serializePortfolioEntry(position));
  } catch (error) {
    return handlePortfolioError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { portfolioId } = await params;

  try {
    await removePortfolioPosition(session.user.id, portfolioId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handlePortfolioError(error);
  }
}

function handlePortfolioError(error: unknown) {
  if (error instanceof PortfolioDomainError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Erro ao alterar posição da carteira:", error);
  return NextResponse.json(
    { error: "Não foi possível alterar o ativo." },
    { status: 500 }
  );
}
