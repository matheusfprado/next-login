"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CryptoChart from "./components/CryptoChart";
import DollarChart from "./components/DollarChart";
import CryptoTable from "./components/CryptoTable";
import CryptoNews from "./components/CryptoNews";
import { AlertManager } from "./components/AlertManager";
import { GoalsManager } from "./components/GoalsManager";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BellAlertIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { DashboardCrypto } from "./types";
import { dollarInvestmentValues, USD_INVESTMENT_ID } from "@/src/modules/portfolio/investment-assets";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

type AlertStatus = "ACTIVE" | "TRIGGERED" | "DISABLED";

interface PortfolioEntry {
  id: string;
  coinId: string;
  coinName: string;
  amount: number;
  buyPrice: number;
  createdAt: string;
}

interface AlertSummary {
  id: string;
  coinId: string;
  coinName: string;
  targetPrice: number;
  direction: "ABOVE" | "BELOW";
  deliveryMethod: "EMAIL" | "SMS";
  status: AlertStatus;
  triggeredAt?: string | null;
}

interface GoalSummary {
  id: string;
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { status } = useAuth();
  const router = useRouter();
  const { currency, exchangeRate, formatCurrency } = useCurrency();

  const [cryptos, setCryptos] = useState<DashboardCrypto[]>([]);
  const [usdBrlRate, setUsdBrlRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [goals, setGoals] = useState<GoalSummary[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let isMounted = true;

    const loadMarketData = async (prime = false) => {
      if (prime && typeof window !== "undefined") {
        const cachedCryptos = window.localStorage.getItem("cryptos");
        if (cachedCryptos) setCryptos(JSON.parse(cachedCryptos) as DashboardCrypto[]);
      }

      try {
        const [cryptosRes, rateRes] = await Promise.all([
          fetchWithTimeout("/api/cryptos", 8_000),
          fetchWithTimeout("/api/exchange-rates?currency=BRL", 8_000),
        ]);
        if (cryptosRes.ok) {
          const data = await cryptosRes.json();
          if (Array.isArray(data) && isMounted) {
            setCryptos(data as DashboardCrypto[]);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("cryptos", JSON.stringify(data));
            }
          }
        } else {
          console.warn(
            "Não foi possível atualizar as criptomoedas agora:",
            cryptosRes.status,
            cryptosRes.statusText
          );
        }
        if (rateRes.ok) {
          const rateData: unknown = await rateRes.json();
          if (rateData && typeof rateData === "object" && "rate" in rateData && typeof rateData.rate === "number" && isMounted) {
            setUsdBrlRate(rateData.rate);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Erro ao carregar criptomoedas:", error);
      }

    };

    const loadUserData = async () => {
      try {
        const [portfolioRes, alertsRes, goalsRes] = await Promise.all([
          fetch("/api/portifolio"),
          fetch("/api/alerts"),
          fetch("/api/goals"),
        ]);

        if (
          portfolioRes.status === 401 ||
          alertsRes.status === 401 ||
          goalsRes.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (portfolioRes.ok) {
          const data = await portfolioRes.json();
          if (isMounted) {
            setPortfolio(Array.isArray(data) ? data : []);
          }
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          if (isMounted) {
            setAlerts(Array.isArray(data) ? data : []);
          }
        }

        if (goalsRes.ok) {
          const data = await goalsRes.json();
          if (isMounted) {
            setGoals(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    };

    const loadInitial = async () => {
      setLoading(true);
      try {
        await Promise.all([loadMarketData(true), loadUserData()]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitial();
    const interval = setInterval(() => {
      void loadMarketData(false);
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status, router]);

  const cryptoMap = useMemo(() => {
    const map = new Map<string, DashboardCrypto>();
    cryptos.forEach((coin) => {
      map.set(coin.id, coin);
    });
    return map;
  }, [cryptos]);

  const portfolioSummary = useMemo(() => {
    if (portfolio.length === 0) {
      return { invested: 0, current: 0, profit: 0, profitPct: 0, dailyChange: 0 };
    }
    let invested = 0;
    let current = 0;
    let weightedDailyChange = 0;

    for (const asset of portfolio) {
      const market = cryptoMap.get(asset.coinId);
      const dollarValues = asset.coinId === USD_INVESTMENT_ID
        ? dollarInvestmentValues(asset.amount, asset.buyPrice, usdBrlRate)
        : null;
      const marketPrice = market?.current_price ?? asset.buyPrice;
      const marketChange = market?.price_change_percentage_24h ?? 0;
      const investedValue = dollarValues?.investedUsd ?? asset.amount * asset.buyPrice;
      const currentValue = dollarValues?.currentUsd ?? asset.amount * marketPrice;

      invested += investedValue;
      current += currentValue;
      weightedDailyChange += currentValue * marketChange;
    }

    const profit = current - invested;
    const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
    const dailyChange = current > 0 ? weightedDailyChange / current : 0;

    return { invested, current, profit, profitPct, dailyChange };
  }, [portfolio, cryptoMap, usdBrlRate]);

  const alertsSummary = useMemo(() => {
    const active = alerts.filter((alert) => alert.status === "ACTIVE").length;
    const triggered = alerts.filter((alert) => alert.status === "TRIGGERED").length;
    return { active, triggered, total: alerts.length };
  }, [alerts]);

  const goalsProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const total = goals.reduce(
      (acc, goal) => acc + Math.min(goal.currentAmount / goal.targetAmount, 1),
      0
    );
    return total / goals.length;
  }, [goals]);

  const bestPerformer = useMemo(() => {
    if (cryptos.length === 0) return null;
    return [...cryptos].sort(
      (a, b) => (b.price_change_percentage_24h ?? -Infinity) - (a.price_change_percentage_24h ?? -Infinity)
    )[0];
  }, [cryptos]);

  const worstPerformer = useMemo(() => {
    if (cryptos.length === 0) return null;
    return [...cryptos].sort(
      (a, b) => (a.price_change_percentage_24h ?? Infinity) - (b.price_change_percentage_24h ?? Infinity)
    )[0];
  }, [cryptos]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Patrimônio atual",
        icon: BanknotesIcon,
        value: formatCurrency(portfolioSummary.current),
        helper:
          currency === "BRL"
            ? `aprox. ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(portfolioSummary.current)} USD`
            : undefined,
        trend: portfolioSummary.profitPct,
        trendPositive: portfolioSummary.profit >= 0,
        trendLabel: "vs. investido",
      },
      {
        title: "Total investido",
        icon: CircleStackIcon,
        value: formatCurrency(portfolioSummary.invested),
        helper:
          currency === "BRL"
            ? `aprox. ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(portfolioSummary.invested)} USD`
            : undefined,
      },
      {
        title: "Alertas ativos",
        icon: BellAlertIcon,
        value: alertsSummary.active.toString(),
        helper:
          alertsSummary.total > 0
            ? `${alertsSummary.total} alertas cadastrados`
            : "Nenhum alerta cadastrado",
        badge:
          alertsSummary.triggered > 0
            ? `${alertsSummary.triggered} disparados nas últimas verificações`
            : null,
      },
      {
        title: "Metas em andamento",
        icon: ClipboardDocumentCheckIcon,
        value: goals.length.toString(),
        helper:
          goals.length > 0
            ? `${(goalsProgress * 100).toFixed(0)}% de progresso médio`
            : "Defina novas metas para acompanhar",
      },
    ],
    [
      alertsSummary,
      currency,
      formatCurrency,
      goals.length,
      goalsProgress,
      portfolioSummary,
    ]
  );
  if (status === "unauthenticated") return null;
  if (status === "loading" || loading) return <DashboardSkeleton />;

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-6 lg:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card
              key={card.title}
              className="gap-0 bg-gradient-to-t from-primary/5 to-card py-0 shadow-xs"
            >
              <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {card.title}
                  </span>
                </div>
                {typeof card.trend === "number" && (
                  <span
                    className={card.trendPositive
                      ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      : "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"}
                  >
                    {card.trendPositive ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    {Math.abs(card.trend).toFixed(1)}%
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
                {card.helper && (
                  <p className="mt-1 text-xs text-gray-500">
                    {card.helper}
                  </p>
                )}
                {typeof card.trend === "number" && card.trendLabel && (
                  <p className="mt-2 text-xs font-medium text-gray-400">
                    {card.trendLabel}
                  </p>
                )}
              </div>
              {"badge" in card && card.badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-600">
                  {card.badge}
                </span>
              )}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <Card className="gap-0">
            <CardContent className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Desempenho das principais moedas
                </h3>
                <p className="text-sm text-gray-500">
                  Compare evolução de preço e acompanhe variações de curto prazo.
                </p>
              </div>
            </div>
            <CryptoChart
              cryptos={cryptos}
              exchangeRate={exchangeRate}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {bestPerformer && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Maior alta (24h)
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {bestPerformer.name}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    {bestPerformer.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              )}
              {worstPerformer && (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Maior queda (24h)
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {worstPerformer.name}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                    {worstPerformer.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            </CardContent>
          </Card>
          <Card className="self-start gap-0">
            <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Top 10 criptomoedas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ranking por valor de mercado
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {currency}
              </span>
            </div>
            <CryptoTable
              cryptos={cryptos}
              exchangeRate={exchangeRate}
              loading={false}
            />
            </CardContent>
          </Card>
        </section>

        <DollarChart />

        <section className="grid gap-6 xl:grid-cols-2">
          <AlertManager
            cryptos={cryptos}
            initialAlerts={alerts}
            onAlertsChange={setAlerts}
          />
          <GoalsManager initialGoals={goals} onGoalsChange={setGoals} />
        </section>

        <CryptoNews />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-8 px-4 py-6 lg:px-6"
      role="status"
      aria-label="Carregando dados do dashboard"
      aria-busy="true"
    >
      <span className="sr-only">Carregando dados do dashboard...</span>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["portfolio", "resultado", "alertas", "metas"].map((card) => (
          <Card key={card} className="gap-0 py-0 shadow-xs">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-44 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <Card className="gap-0">
          <CardContent className="space-y-6">
            <Skeleton className="h-6 w-72 max-w-full" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="gap-0">
          <CardContent className="space-y-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-[380px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>

      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

async function fetchWithTimeout(input: RequestInfo | URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}



