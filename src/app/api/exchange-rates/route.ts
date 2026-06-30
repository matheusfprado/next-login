import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  currency: z.enum(["BRL", "USD", "EUR", "GBP"]),
});

const cache = new Map<string, { rate: number; expiresAt: number }>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Moeda inválida" }, { status: 400 });
  }

  const { currency } = parsed.data;
  if (currency === "USD") {
    return NextResponse.json({ base: "USD", currency, rate: 1 });
  }

  const cached = cache.get(currency);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ base: "USD", currency, rate: cached.rate });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${currency}`,
      { signal: controller.signal, next: { revalidate: 3600 } }
    ).finally(() => clearTimeout(timeout));
    if (!response.ok) throw new Error(`Câmbio indisponível: ${response.status}`);
    const data: unknown = await response.json();
    const rate = extractRate(data, currency);
    if (rate === null) throw new Error("Resposta de câmbio inválida");

    cache.set(currency, { rate, expiresAt: Date.now() + 60 * 60 * 1000 });
    return NextResponse.json({ base: "USD", currency, rate });
  } catch (error) {
    console.error("Erro ao consultar câmbio:", error);
    return NextResponse.json({ error: "Câmbio indisponível" }, { status: 503 });
  }
}

function extractRate(data: unknown, currency: string) {
  if (!data || typeof data !== "object" || !("rates" in data)) return null;
  const rates = data.rates;
  if (!rates || typeof rates !== "object" || !(currency in rates)) return null;
  const rate = (rates as Record<string, unknown>)[currency];
  return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
}
