import { Prisma, type EmailNotificationType } from "@prisma/client";

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const configuredVariationThreshold = Number(
  process.env.ABRUPT_VARIATION_PERCENT ?? 10
);
const variationThreshold =
  Number.isFinite(configuredVariationThreshold) &&
  configuredVariationThreshold > 0
    ? configuredVariationThreshold
    : 10;

async function claimNotification(
  userId: string,
  type: EmailNotificationType,
  key: string
) {
  try {
    return await prisma.emailNotification.create({
      data: { userId, type, key },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}

async function releaseNotification(id: string) {
  await prisma.emailNotification.delete({ where: { id } }).catch(() => undefined);
}

export async function processGoalAlerts() {
  const goals = await prisma.investmentGoal.findMany({
    where: {
      achievedNotifiedAt: null,
      user: { email: { not: null } },
    },
    include: {
      user: {
        select: {
          email: true,
          preferences: { select: { emailAlerts: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const goal of goals) {
    if (
      !goal.user.email ||
      goal.user.preferences?.emailAlerts === false ||
      Number(goal.currentAmount) < Number(goal.targetAmount)
    ) {
      continue;
    }

    const notification = await claimNotification(
      goal.userId,
      "GOAL_ACHIEVED",
      `${goal.id}:${goal.targetAmount.toString()}`
    );
    if (!notification) continue;

    try {
      await sendEmail({
        to: goal.user.email,
        subject: `Meta atingida: ${goal.title}`,
        text: `Parabéns! Sua meta "${goal.title}" atingiu ${Number(goal.currentAmount).toLocaleString("pt-BR")} de ${Number(goal.targetAmount).toLocaleString("pt-BR")}.`,
      });
      const now = new Date();
      await prisma.$transaction([
        prisma.investmentGoal.update({
          where: { id: goal.id },
          data: { achievedNotifiedAt: now },
        }),
        prisma.emailNotification.update({
          where: { id: notification.id },
          data: { sentAt: now },
        }),
      ]);
      sent += 1;
    } catch (error) {
      await releaseNotification(notification.id);
      console.error(`[goal-alert] goal=${goal.id} failed`, error);
    }
  }

  return { checked: goals.length, sent };
}

export async function processAbruptVariationAlerts(now = new Date()) {
  const positions = await prisma.portfolio.findMany({
    where: { amount: { gt: 0 }, user: { email: { not: null } } },
    select: {
      userId: true,
      coinId: true,
      coinName: true,
      user: {
        select: {
          email: true,
          preferences: { select: { emailAlerts: true } },
        },
      },
    },
  });

  const latestByCoin = new Map<
    string,
    { change24h: number; priceUsd: number } | null
  >();
  let sent = 0;

  for (const position of positions) {
    if (!position.user.email || position.user.preferences?.emailAlerts === false) {
      continue;
    }

    if (!latestByCoin.has(position.coinId)) {
      const latest = await prisma.cryptoPriceHistory.findFirst({
        where: { coinId: position.coinId },
        orderBy: { createdAt: "desc" },
        select: { change24h: true, priceUsd: true },
      });
      latestByCoin.set(
        position.coinId,
        latest?.change24h !== null && latest?.change24h !== undefined
          ? {
              change24h: Number(latest.change24h),
              priceUsd: Number(latest.priceUsd),
            }
          : null
      );
    }

    const latest = latestByCoin.get(position.coinId);
    if (!latest || Math.abs(latest.change24h) < variationThreshold) continue;

    const direction = latest.change24h >= 0 ? "UP" : "DOWN";
    const day = now.toISOString().slice(0, 10);
    const notification = await claimNotification(
      position.userId,
      "ABRUPT_VARIATION",
      `${position.coinId}:${day}:${direction}`
    );
    if (!notification) continue;

    try {
      await sendEmail({
        to: position.user.email,
        subject: `Variação brusca: ${position.coinName}`,
        text: `${position.coinName} variou ${latest.change24h.toFixed(2)}% nas últimas 24 horas e está cotado a ${latest.priceUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })}.`,
      });
      await prisma.emailNotification.update({
        where: { id: notification.id },
        data: { sentAt: now },
      });
      sent += 1;
    } catch (error) {
      await releaseNotification(notification.id);
      console.error(
        `[variation-alert] user=${position.userId} coin=${position.coinId} failed`,
        error
      );
    }
  }

  return { checked: positions.length, sent };
}
