import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchDollarRateHistory } from "@/src/modules/exchange-rates/dollar-history.service";

const querySchema = z.object({
  range: z.enum(["1d", "5d", "1m", "1y", "5y", "max"]).default("1m"),
});

const rangeDays = {
  "1d": 1,
  "5d": 5,
  "1m": 30,
  "1y": 360,
  "5y": 365 * 5,
  max: 365 * 10,
} as const;

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }

  try {
    const points = await fetchDollarRateHistory(rangeDays[parsed.data.range]);
    return NextResponse.json({ pair: "USD/BRL", range: parsed.data.range, points });
  } catch (error) {
    console.error("Erro ao consultar histórico do dólar:", error);
    return NextResponse.json({ error: "Histórico do dólar indisponível" }, { status: 503 });
  }
}
