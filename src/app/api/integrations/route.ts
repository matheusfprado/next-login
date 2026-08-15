import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/supabase";
import { connectIntegrationSchema } from "@/src/modules/integrations/integration.schemas";
import { connectBinance, connectMetaMask, disconnectIntegration, listIntegrations } from "@/src/modules/integrations/integration.service";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await listIntegrations(session.user.id));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const parsed = connectIntegrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try {
    if (parsed.data.provider === "BINANCE") await connectBinance(session.user.id, parsed.data.apiKey, parsed.data.apiSecret);
    else await connectMetaMask(session.user.id, parsed.data.walletAddress, parsed.data.chainId);
    return NextResponse.json(await listIntegrations(session.user.id), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao conectar" }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Conexão inválida" }, { status: 400 });
  await disconnectIntegration(session.user.id, id);
  return new NextResponse(null, { status: 204 });
}


