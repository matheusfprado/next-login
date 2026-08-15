import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/supabase";
import { importHoldings } from "@/src/modules/integrations/integration.service";

export async function POST() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await importHoldings(session.user.id));
}


