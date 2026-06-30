import { NextResponse } from "next/server";
import { z } from "zod";

import { findCryptoPriceHistory } from "@/src/modules/crypto/crypto-history.repository";

const querySchema = z.object({
  range: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
  points: z.coerce.number().int().min(50).max(1000).default(300),
});

const rangeHours = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  "90d": 24 * 90,
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ coinId: string }> }
) {
  const { coinId } = await params;
  if (!coinId || coinId.length > 100) {
    return NextResponse.json({ error: "Moeda inválida" }, { status: 400 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta inválida" }, { status: 400 });
  }

  const hours = rangeHours[parsed.data.range];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const bucketSeconds = Math.max(
    60,
    Math.ceil((hours * 60 * 60) / parsed.data.points)
  );
  const points = await findCryptoPriceHistory({
    coinId,
    since,
    bucketSeconds,
  });

  return NextResponse.json({ coinId, range: parsed.data.range, points });
}
