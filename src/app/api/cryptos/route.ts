// app/api/cryptos/route.ts
import { NextResponse } from "next/server";

import { getCryptoMarketsCache } from "@/src/modules/crypto/crypto-cache.service";

export async function GET() {
  try {
    const data = await getCryptoMarketsCache();

    if (!data) {
      return NextResponse.json(
        { error: "Cache de criptomoedas ainda não carregado" },
        { status: 503 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao ler cache de criptos:", error);
    return NextResponse.json([], { status: 500 });
  }
}
