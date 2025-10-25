"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Loading from "../components/Loading";
import CryptoChart from "./components/CryptoChart";
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
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cryptos, setCryptos] = useState<DashboardCrypto[]>([]);
  const [exchangeRate, setExchangeRate] = useState(5.0);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
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
        const cachedRate = window.localStorage.getItem("exchangeRate");
        if (cachedRate) setExchangeRate(Number(cachedRate));
        const cachedCryptos = window.localStorage.getItem("cryptos");
        if (cachedCryptos) setCryptos(JSON.parse(cachedCryptos) as DashboardCrypto[]);
      }

      try {
        const [rateRes, cryptosRes] = await Promise.all([
          fetch("https://api.exchangerate.host/latest?base=USD&symbols=BRL"),
          fetch("/api/cryptos"),
        ]);

        if (rateRes.ok) {
          const jsonRate = await rateRes.json();
          if (jsonRate?.rates?.BRL && isMounted) {
            setExchangeRate(jsonRate.rates.BRL);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("exchangeRate", jsonRate.rates.BRL);
            }
          }
        }

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
      } catch (error) {
        console.error("Erro ao carregar dados do mercado:", error);
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
          setInitialLoad(false);
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

  const currencyBRL = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );
  const currencyUSD = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

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
      const marketPrice = market?.current_price ?? asset.buyPrice;
      const marketChange = market?.price_change_percentage_24h ?? 0;
      const investedValue = asset.amount * asset.buyPrice;
      const currentValue = asset.amount * marketPrice;

      invested += investedValue;
      current += currentValue;
      weightedDailyChange += currentValue * marketChange;
    }

    const profit = current - invested;
    const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
    const dailyChange = current > 0 ? weightedDailyChange / current : 0;

    return { invested, current, profit, profitPct, dailyChange };
  }, [portfolio, cryptoMap]);

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
        value: currencyBRL.format(portfolioSummary.current * exchangeRate),
        helper: `≈ ${currencyUSD.format(portfolioSummary.current)} USD`,
        trend: portfolioSummary.profitPct,
        trendPositive: portfolioSummary.profit >= 0,
        trendLabel: "vs. investido",
      },
      {
        title: "Total investido",
        icon: CircleStackIcon,
        value: currencyBRL.format(portfolioSummary.invested * exchangeRate),
        helper: `≈ ${currencyUSD.format(portfolioSummary.invested)} USD`,
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
      currencyBRL,
      currencyUSD,
      exchangeRate,
      goals.length,
      goalsProgress,
      portfolioSummary,
    ]
  );

  if (status === "loading") {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Carregando painel..." />
      </div>
    );
  }
  if (!session) return null;
  if (initialLoad && loading) {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Preparando dashboard..." />
      </div>
    );
  }

  return (
    <>
      <Header userEmail={session.user?.email || ""} cryptos={cryptos} />
      {loading && !initialLoad && (
        <div className="px-6">
          <Loading fullScreen={false} label="Atualizando dados..." />
        </div>
      )}
      <div className="flex w-full flex-col gap-8 px-6 py-8 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
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
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
            <CryptoChart cryptos={cryptos} exchangeRate={exchangeRate} />
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
          </div>
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Top 10 criptomoedas
              </h3>
              <p className="text-xs text-gray-500">
                Valores convertidos para BRL
              </p>
            </div>
            <CryptoTable
              cryptos={cryptos}
              exchangeRate={exchangeRate}
              loading={loading && cryptos.length === 0}
            />
          </div>
        </section>

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
    </>
  );
}
