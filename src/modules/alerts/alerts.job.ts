import type { AlertDirection } from "@prisma/client";

import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";
import { getCachedCoinPrice } from "@/src/modules/crypto/crypto-cache.service";

const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

export async function processPriceAlerts() {
  const alerts = await prisma.priceAlert.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
    },
  });

  const triggeredAlerts: Array<{ id: string; price: number }> = [];

  for (const alert of alerts) {
    const currentPrice = await getCachedCoinPrice(alert.coinId);

    if (currentPrice === null) continue;
    if (!isAlertTriggered(alert.direction, currentPrice, alert.targetPrice)) continue;

    triggeredAlerts.push({ id: alert.id, price: currentPrice });

    if (alert.deliveryMethod === "EMAIL" && alert.user.email) {
      await sendEmail({
        to: alert.user.email,
        subject: `Alerta InvestHub: ${alert.coinName}`,
        text: `O preço de ${alert.coinName} atingiu ${currentPrice} USD.`,
      });
    }

    if (alert.deliveryMethod === "SMS" && alert.user.phone && messagingServiceSid) {
      await twilioClient.messages.create({
        messagingServiceSid,
        to: normalizePhone(alert.user.phone),
        body: `InvestHub: ${alert.coinName} chegou a ${currentPrice} USD.`,
      });
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
  };
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
