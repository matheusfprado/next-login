import { NextResponse } from "next/server";

import { fetchTopCryptoMarkets } from "@/src/modules/crypto/coingecko.service";
import type { CryptoMarket } from "@/src/modules/crypto/types";

const CACHE_TTL_MS = 30_000;

let memoryCache: {
  data: CryptoMarket[];
  expiresAt: number;
} | null = null;

export async function GET() {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return NextResponse.json(memoryCache.data);
  }

  try {
    const data = await fetchTopCryptoMarkets();

    memoryCache = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar criptos:", error);

    if (memoryCache) {
      return NextResponse.json(memoryCache.data);
    }

    return NextResponse.json(
      { error: "Não foi possível carregar criptomoedas" },
      { status: 500 }
    );
  }
}
