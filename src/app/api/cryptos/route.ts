// app/api/cryptos/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true"
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar criptos" }, { status: res.status });
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar criptos:", error);
    return NextResponse.json([], { status: 500 });
  }
}
