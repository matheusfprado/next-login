import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getCachedCoinPrice } from "@/src/modules/crypto/crypto-cache.service";

const summaryDay = Number(process.env.WEEKLY_SUMMARY_DAY_UTC ?? 1);
const summaryHour = Number(process.env.WEEKLY_SUMMARY_HOUR_UTC ?? 12);

export async function processWeeklySummaries(now = new Date()) {
  if (now.getUTCDay() !== summaryDay || now.getUTCHours() !== summaryHour) {
    return { eligible: 0, sent: 0 };
  }

  const startOfWeek = new Date(now);
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  startOfWeek.setUTCDate(now.getUTCDate() - daysSinceMonday);
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const preferences = await prisma.userPreference.findMany({
    where: {
      weeklySummary: true,
      OR: [
        { lastWeeklySummaryAt: null },
        { lastWeeklySummaryAt: { lt: startOfWeek } },
      ],
      user: { email: { not: null } },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          portfolios: { where: { amount: { gt: 0 } } },
          investmentGoals: { orderBy: { updatedAt: "desc" } },
          priceAlerts: {
            where: { triggeredAt: { gte: startOfWeek } },
            orderBy: { triggeredAt: "desc" },
          },
          emailNotifications: {
            where: {
              type: "ABRUPT_VARIATION",
              sentAt: { gte: startOfWeek },
            },
          },
        },
      },
    },
  });

  let sent = 0;
  for (const preference of preferences) {
    if (!preference.user.email) continue;

    try {
      let invested = 0;
      let current = 0;
      let realized = 0;

      for (const position of preference.user.portfolios) {
        const amount = Number(position.amount);
        const averagePrice = Number(position.buyPrice);
        const currentPrice =
          (await getCachedCoinPrice(position.coinId)) ?? averagePrice;
        invested += amount * averagePrice;
        current += amount * currentPrice;
        realized += Number(position.realizedProfit);
      }

      const unrealized = current - invested;
      const performance = invested > 0 ? (unrealized / invested) * 100 : 0;
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      });
      const goals = preference.user.investmentGoals.map((goal) => {
        const progress =
          Number(goal.targetAmount) > 0
            ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
            : 0;
        return `- ${goal.title}: ${Math.min(progress, 100).toFixed(1)}%`;
      });
      const relevantAlerts = preference.user.priceAlerts.map(
        (alert) => `- ${alert.coinName} atingiu ${Number(alert.targetPrice)} USD`
      );
      if (preference.user.emailNotifications.length > 0) {
        relevantAlerts.push(
          `- ${preference.user.emailNotifications.length} alerta(s) de variação brusca`
        );
      }
      await sendEmail({
        to: preference.user.email,
        subject: "Seu resumo semanal InvestHub",
        text: [
          `Olá${preference.user.name ? `, ${preference.user.name}` : ""}!`,
          `Patrimônio atual: ${formatter.format(current)}`,
          `Total investido: ${formatter.format(invested)}`,
          `Resultado não realizado: ${formatter.format(unrealized)}`,
          `Desempenho da carteira: ${performance.toFixed(2)}%`,
          `Lucro realizado: ${formatter.format(realized)}`,
          "",
          "Metas:",
          ...(goals.length > 0 ? goals : ["- Nenhuma meta cadastrada"]),
          "",
          "Alertas relevantes:",
          ...(relevantAlerts.length > 0
            ? relevantAlerts
            : ["- Nenhum alerta disparado nesta semana"]),
        ].join("\n"),
      });

      await prisma.userPreference.update({
        where: { id: preference.id },
        data: { lastWeeklySummaryAt: now },
      });
      sent += 1;
    } catch (error) {
      console.error(
        `[weekly-summary] user=${preference.userId} failed`,
        error
      );
    }
  }

  return { eligible: preferences.length, sent };
}
