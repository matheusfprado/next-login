import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/authOptions";
import { metamaskSyncSchema } from "@/src/modules/integrations/integration.schemas";
import { listIntegrations, syncIntegration } from "@/src/modules/integrations/integration.service";

export async function POST(request: Request, { params }: { params: Promise<{ integrationId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const parsed = metamaskSyncSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Saldos inválidos" }, { status: 400 });
  try {
    await syncIntegration(session.user.id, (await params).integrationId, parsed.data.holdings);
    return NextResponse.json(await listIntegrations(session.user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao sincronizar" }, { status: 422 });
  }
}
