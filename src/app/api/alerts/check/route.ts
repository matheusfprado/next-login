import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/supabase";
import { processPriceAlerts } from "@/src/modules/alerts/alerts.job";

export async function POST() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await processPriceAlerts(session.user.id);

    if (result.failed > 0 && result.triggered === 0) {
      return NextResponse.json(
        { error: "O preço alvo foi atingido, mas o e-mail não pôde ser enviado." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message:
        result.triggered > 0
          ? `${result.triggered} alerta(s) enviado(s) por e-mail.${result.failed > 0 ? ` ${result.failed} envio(s) falharam.` : ""}`
          : "Alertas verificados. Nenhum preço alvo foi atingido.",
      checked: result.checked,
      triggered: result.triggeredAlerts,
    });
  } catch (error) {
    console.error("Erro ao verificar alertas:", error);
    return NextResponse.json(
      { error: "Não foi possível verificar os alertas agora." },
      { status: 500 }
    );
  }
}


