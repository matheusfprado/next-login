import type { AlertDirection } from "@prisma/client";

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getCachedCoinPrice } from "@/src/modules/crypto/crypto-cache.service";
import { fetchTopCryptoMarkets } from "@/src/modules/crypto/coingecko.service";

export async function processPriceAlerts(userId?: string) {
  const alerts = await prisma.priceAlert.findMany({
    where: { status: "ACTIVE", ...(userId ? { userId } : {}) },
    include: {
      user: {
        select: {
          email: true,
          emailVerified: true,
          preferences: {
            select: {
              emailAlerts: true,
            },
          },
        },
      },
    },
  });

  const prices = await loadCurrentPrices(alerts.map((alert) => alert.coinId));
  const triggeredAlerts: Array<{ id: string; price: number }> = [];
  let failed = 0;

  for (const alert of alerts) {
    if (
      alert.deliveryMethod !== "EMAIL" ||
      !alert.user.email ||
      !alert.user.emailVerified ||
      alert.user.preferences?.emailAlerts === false
    ) continue;

    const currentPrice = prices.get(alert.coinId) ?? null;
    if (currentPrice === null) continue;
    if (!isAlertTriggered(alert.direction, currentPrice, Number(alert.targetPrice))) continue;

    try {
      const direction = alert.direction === "ABOVE" ? "atingiu ou superou" : "atingiu ou ficou abaixo de";
      await sendEmail({
        to: alert.user.email,
        subject: `Alerta de preço: ${alert.coinName}`,
        text: [
          `${alert.coinName} ${direction} o valor definido.`,
          `Preço atual: ${currentPrice} USD.`,
          `Preço alvo: ${Number(alert.targetPrice)} USD.`,
          "Acesse o InvestHub para acompanhar sua carteira.",
        ].join("\n"),
      });
      triggeredAlerts.push({ id: alert.id, price: currentPrice });
    } catch (error) {
      failed += 1;
      console.error(`[price-alert] alert=${alert.id} failed`, error);
    }
  }

  if (triggeredAlerts.length > 0) {
    await prisma.priceAlert.updateMany({
      where: { id: { in: triggeredAlerts.map((alert) => alert.id) } },
      data: {
        status: "TRIGGERED",
        triggeredAt: new Date(),
      },
    });
  }

  return {
    checked: alerts.length,
    triggered: triggeredAlerts.length,
    triggeredAlerts,
    failed,
  };
}

async function loadCurrentPrices(coinIds: string[]) {
  const uniqueCoinIds = [...new Set(coinIds)];
  const prices = new Map<string, number>();

  await Promise.all(
    uniqueCoinIds.map(async (coinId) => {
      try {
        const price = await getCachedCoinPrice(coinId);
        if (price !== null) prices.set(coinId, price);
      } catch {
        // O fallback abaixo mantém a verificação disponível sem Redis.
      }
    })
  );

  if (prices.size < uniqueCoinIds.length) {
    const markets = await fetchTopCryptoMarkets();
    for (const market of markets) {
      if (uniqueCoinIds.includes(market.id)) {
        prices.set(market.id, market.current_price);
      }
    }
  }

  return prices;
}

function isAlertTriggered(
  direction: AlertDirection,
  currentPrice: number,
  targetPrice: number
) {
  return direction === "ABOVE"
    ? currentPrice >= targetPrice
    : currentPrice <= targetPrice;
}
