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
          preferences: {
            select: {
              emailAlerts: true,
              smsAlerts: true,
            },
          },
        },
      },
    },
  });

  const triggeredAlerts: Array<{ id: string; price: number }> = [];

  for (const alert of alerts) {
    const deliveryEnabled =
      alert.deliveryMethod === "EMAIL"
        ? alert.user.preferences?.emailAlerts ?? true
        : alert.user.preferences?.smsAlerts ?? false;
    if (!deliveryEnabled) continue;

    const currentPrice = await getCachedCoinPrice(alert.coinId);

    if (currentPrice === null) continue;
    if (!isAlertTriggered(alert.direction, currentPrice, Number(alert.targetPrice))) continue;

    try {
      if (alert.deliveryMethod === "EMAIL" && alert.user.email) {
        await sendEmail({
          to: alert.user.email,
          subject: `Alerta InvestHub: ${alert.coinName}`,
          text: `O preço de ${alert.coinName} atingiu ${currentPrice} USD.`,
        });
        triggeredAlerts.push({ id: alert.id, price: currentPrice });
      } else if (
        alert.deliveryMethod === "SMS" &&
        alert.user.phone &&
        messagingServiceSid
      ) {
        await twilioClient.messages.create({
          messagingServiceSid,
          to: normalizePhone(alert.user.phone),
          body: `InvestHub: ${alert.coinName} chegou a ${currentPrice} USD.`,
        });
        triggeredAlerts.push({ id: alert.id, price: currentPrice });
      }
    } catch (error) {
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
