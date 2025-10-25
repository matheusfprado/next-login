import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/authOptions";
import { fetchCoinPrice } from "@/lib/coingecko";
import { sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";

const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (alerts.length === 0) {
    return NextResponse.json({ triggered: [], message: "Nenhum alerta ativo." });
  }

  const priceCache = new Map<string, number>();
  const triggeredAlerts: Array<{ id: string; price: number }> = [];

  for (const alert of alerts) {
    if (!priceCache.has(alert.coinId)) {
      const price = await fetchCoinPrice(alert.coinId);
      if (price === null) continue;
      priceCache.set(alert.coinId, price);
    }

    const currentPrice = priceCache.get(alert.coinId)!;
    const condition =
      alert.direction === "ABOVE"
        ? currentPrice >= alert.targetPrice
        : currentPrice <= alert.targetPrice;

    if (condition) {
      triggeredAlerts.push({ id: alert.id, price: currentPrice });

      if (alert.deliveryMethod === "EMAIL" && user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: `Alerta InvestHub: ${alert.coinName}`,
            text: `O preço de ${alert.coinName} atingiu ${currentPrice} USD (meta ${alert.direction === "ABOVE" ? "acima" : "abaixo"} de ${alert.targetPrice}).`,
          });
        } catch (error) {
          console.error("Falha ao enviar email de alerta:", error);
        }
      }

      if (alert.deliveryMethod === "SMS" && user.phone) {
        if (!messagingServiceSid) {
          console.warn("TWILIO_MESSAGING_SERVICE_SID não configurado. Não foi possível enviar SMS.");
        } else {
          const to = normalizePhone(user.phone);
          try {
            await twilioClient.messages.create({
              messagingServiceSid,
              to,
              body: `InvestHub: ${alert.coinName} chegou a ${currentPrice} USD (meta ${alert.direction === "ABOVE" ? "acima" : "abaixo"} de ${alert.targetPrice}).`,
            });
          } catch (error) {
            console.error("Falha ao enviar SMS de alerta:", error);
          }
        }
      }
    }
  }

  if (triggeredAlerts.length > 0) {
    const now = new Date();
    await prisma.priceAlert.updateMany({
      where: { id: { in: triggeredAlerts.map((a) => a.id) } },
      data: {
        status: "TRIGGERED",
        triggeredAt: now,
      },
    });
  }

  return NextResponse.json({
    triggered: triggeredAlerts,
    message:
      triggeredAlerts.length > 0
        ? "Alertas processados."
        : "Nenhum alerta atingiu a meta.",
  });
}
