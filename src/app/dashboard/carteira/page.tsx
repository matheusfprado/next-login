"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loading from "../../components/Loading";
import { Button } from "../../components/Button";
import Header from "../components/Header";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

interface PortfolioItem {
  id: string;
  coinId: string;
  coinName: string;
  amount: number;
  buyPrice: number;
  createdAt: string;
}

interface CryptoMarket {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  [key: string]: unknown;
}

interface EnrichedPortfolio extends PortfolioItem {
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  dailyChange?: number;
  image?: string;
  symbol?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatNumber = (value: number, fractionDigits = 4) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(value) ? value : 0);

export default function CarteiraPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [cryptos, setCryptos] = useState<CryptoMarket[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    coinId: "",
    coinName: "",
    amount: "",
    buyPrice: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadData = async () => {
      setIsFetching(true);
      setError(null);

      try {
        const [portfolioRes, cryptoRes] = await Promise.all([
          fetch("/api/portifolio"),
          fetch("/api/cryptos"),
        ]);

        if (portfolioRes.status === 401) {
          router.replace("/login");
          return;
        }

        const portfolioData = await portfolioRes.json();
        const cryptoData = await cryptoRes.json();

        setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
        setCryptos(Array.isArray(cryptoData) ? cryptoData : []);

        if (Array.isArray(cryptoData) && cryptoData.length > 0) {
          const firstCoin = cryptoData[0];
          setForm((prev) => {
            if (prev.coinId) return prev;
            return {
              ...prev,
              coinId: firstCoin.id,
              coinName: firstCoin.name,
              buyPrice: String(firstCoin.current_price ?? ""),
            };
          });
        }
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar sua carteira agora.");
      } finally {
        setIsFetching(false);
      }
    };

    void loadData();
  }, [status, router]);

  useEffect(() => {
    if (!form.coinId) return;
    const found = cryptos.find((coin) => coin.id === form.coinId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        coinName: found.name,
        buyPrice:
          prev.buyPrice && parseFloat(prev.buyPrice) > 0
            ? prev.buyPrice
            : String(found.current_price ?? ""),
      }));
    }
  }, [cryptos, form.coinId]);

  const enrichedPortfolio: EnrichedPortfolio[] = useMemo(() => {
    return portfolio.map((item) => {
      const marketData = cryptos.find((coin) => coin.id === item.coinId);
      const currentPrice = Number(marketData?.current_price ?? item.buyPrice);
      const investedValue = item.amount * item.buyPrice;
      const currentValue = item.amount * currentPrice;
      const profit = currentValue - investedValue;
      const profitPercentage =
        investedValue > 0 ? (profit / investedValue) * 100 : 0;

      return {
        ...item,
        currentPrice,
        investedValue,
        currentValue,
        profit,
        profitPercentage,
        dailyChange: marketData?.price_change_percentage_24h,
        image: marketData?.image,
        symbol: marketData?.symbol?.toUpperCase(),
      };
    });
  }, [portfolio, cryptos]);

  const totalInvested = useMemo(
    () =>
      enrichedPortfolio.reduce(
        (accumulator, asset) => accumulator + asset.investedValue,
        0
      ),
    [enrichedPortfolio]
  );

  const totalCurrent = useMemo(
    () =>
      enrichedPortfolio.reduce(
        (accumulator, asset) => accumulator + asset.currentValue,
        0
      ),
    [enrichedPortfolio]
  );

  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercentage =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const allocation = useMemo(() => {
    if (!totalCurrent) return [];
    return enrichedPortfolio
      .map((asset) => ({
        id: asset.id,
        coinName: asset.coinName,
        symbol: asset.symbol,
        percentage: (asset.currentValue / totalCurrent) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [enrichedPortfolio, totalCurrent]);

  const standoutAssets = useMemo(() => {
    if (!enrichedPortfolio.length) {
      return { best: null, worst: null };
    }

    const sortable = enrichedPortfolio.filter(
      (item) => Number.isFinite(item.profitPercentage) && item.amount > 0
    );

    if (sortable.length === 0) {
      return { best: null, worst: null };
    }

    const best = sortable.reduce((prev, current) =>
      current.profitPercentage > prev.profitPercentage ? current : prev
    );
    const worst = sortable.reduce((prev, current) =>
      current.profitPercentage < prev.profitPercentage ? current : prev
    );

    return { best, worst };
  }, [enrichedPortfolio]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.coinId || !form.amount || !form.buyPrice) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const selectedCoin = cryptos.find((coin) => coin.id === form.coinId);

      const response = await fetch("/api/portifolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coinId: form.coinId,
          coinName: form.coinName || selectedCoin?.name || form.coinId,
          amount: Number(form.amount),
          buyPrice: Number(form.buyPrice),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Erro ao adicionar ativo.");
      }

      const created = (await response.json()) as PortfolioItem;
      setPortfolio((prev) => [created, ...prev]);
      setFeedback("Ativo adicionado com sucesso à sua carteira!");
      setForm((prev) => ({
        ...prev,
        amount: "",
        buyPrice:
          selectedCoin && selectedCoin.current_price
            ? String(selectedCoin.current_price)
            : "",
        coinName: selectedCoin?.name ?? prev.coinName,
      }));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o ativo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const [portfolioRes, cryptoRes] = await Promise.all([
        fetch("/api/portifolio"),
        fetch("/api/cryptos"),
      ]);
      const portfolioData = await portfolioRes.json();
      const cryptoData = await cryptoRes.json();
      setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
      setCryptos(Array.isArray(cryptoData) ? cryptoData : []);
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar os dados agora.");
    } finally {
      setIsFetching(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Carregando carteira..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const initialLoading = isFetching && portfolio.length === 0;

  if (initialLoading) {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Preparando sua carteira..." />
      </div>
    );
  }

  return (
    <>
      <Header userEmail={session.user?.email || ""} cryptos={cryptos} />
      {isFetching && !initialLoading && (
        <div className="px-6">
          <Loading fullScreen={false} label="Sincronizando ativos..." />
        </div>
      )}

    <div className="flex w-full flex-col gap-10 px-6 py-8 lg:px-10">

      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-400 text-white shadow-xl">
        <div className="absolute inset-y-0 right-[-25%] hidden w-2/3 bg-white/10 blur-3xl md:block" />
        <div className="relative flex flex-col gap-8 px-8 py-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-medium uppercase tracking-widest">
              <SparklesIcon className="h-4 w-4" />
              Nova experiência da carteira digital
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Uma visão profissional da sua carteira
            </h1>
            <p className="mt-3 text-sm text-emerald-50 sm:text-base">
              Acompanhe patrimônio, rentabilidade e distribuição com uma
              interface moderna inspirada no shadcn/ui.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/15 p-4 text-sm backdrop-blur">
              <p className="text-emerald-100">Total investido</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 text-sm backdrop-blur">
              <p className="text-emerald-100">Resultado</p>
              <p className="mt-1 text-2xl font-semibold text-white" aria-live="polite">
                {formatCurrency(totalProfit)}{" "}
                <span
                  className={clsx(
                    "ml-1 text-sm font-semibold",
                    totalProfit >= 0 ? "text-emerald-200" : "text-red-200"
                  )}
                >
                  ({totalProfitPercentage.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Valor atual</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatCurrency(totalCurrent)}
          </p>
          <p
            className={totalProfit >= 0
              ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
              : "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"}
          >
            {totalProfit >= 0 ? "+" : ""}
            {totalProfitPercentage.toFixed(2)}%
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Ativos monitorados
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {enrichedPortfolio.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Diversifique para mitigar riscos.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Maior rentabilidade
          </p>
            {standoutAssets.best ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                    <ArrowTrendingUpIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {standoutAssets.best.coinName}
                    </p>
                    <p className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {standoutAssets.best.profitPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Adicione ativos para descobrir destaques.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Maior retração
          </p>
            {standoutAssets.worst ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
                    <ArrowTrendingDownIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {standoutAssets.worst.coinName}
                    </p>
                    <p className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                      {standoutAssets.worst.profitPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Adicione ativos para acompanhar oscilações.
            </p>
          )}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Adicionar novo ativo
              </h2>
              <p className="text-sm text-gray-500">
                Registre compras para acompanhar performance.
              </p>
            </div>
            <Button
              variant="ghost"
              className="sm:w-auto text-sm"
              onClick={handleRefresh}
              loading={isFetching}
            >
              Atualizar dados
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {feedback && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {feedback}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm text-gray-700">
                Ativo
                <select
                  value={form.coinId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      coinId: event.target.value,
                      coinName:
                        cryptos.find(
                          (coin) => coin.id === event.target.value
                        )?.name ?? prev.coinName,
                    }))
                  }
                  className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                >
                  <option value="">Selecione</option>
                  {cryptos.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                Nome de exibição
                <input
                  type="text"
                  value={form.coinName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      coinName: event.target.value,
                    }))
                  }
                  placeholder="Ex: Bitcoin"
                  className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                />
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                Quantidade
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                  required
                />
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                Preço pago (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.buyPrice}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      buyPrice: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                  required
                />
              </label>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  variant="secondary"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="sm:w-auto"
                >
                  Salvar ativo
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Distribuição da carteira
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe o peso de cada ativo no portfólio.
          </p>
          {allocation.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              Adicione ativos para visualizar a alocação.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {allocation.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>
                      {item.coinName}
                      {item.symbol ? (
                        <span className="ml-1 text-xs uppercase text-gray-400">
                          • {item.symbol}
                        </span>
                      ) : null}
                    </span>
                    <span>{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                      style={{
                        width: `${Math.max(item.percentage, 3)}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalhes da carteira
          </h2>
          <p className="text-sm text-gray-500">
            Compare valores investidos e resultados atuais.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Ativo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Preço pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Preço atual
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Valor atual
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Resultado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  24h
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Registrado em
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {enrichedPortfolio.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Sua carteira está vazia. Adicione um novo ativo para começar.
                  </td>
                </tr>
              ) : (
                enrichedPortfolio.map((asset) => (
                  <tr
                    key={asset.id}
                    className="transition-colors hover:bg-gray-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {asset.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.image}
                            alt={asset.coinName}
                            className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-semibold">
                            {asset.coinName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {asset.coinName}
                          </p>
                          <p className="text-xs uppercase text-gray-400">
                            {asset.symbol ?? asset.coinId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{formatNumber(asset.amount)}</td>
                    <td className="px-4 py-4">{formatCurrency(asset.buyPrice)}</td>
                    <td className="px-4 py-4">{formatCurrency(asset.currentPrice)}</td>
                    <td className="px-4 py-4 font-medium">
                      {formatCurrency(asset.currentValue)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          asset.profit >= 0
                            ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                            : "inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {asset.profit >= 0 ? "+" : ""}
                        {formatCurrency(asset.profit)}{" "}
                        <span className="ml-1">
                          ({asset.profitPercentage.toFixed(1)}%)
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {asset.dailyChange !== undefined &&
                      asset.dailyChange !== null ? (
                        <span
                          className={clsx(
                            asset.dailyChange >= 0
                              ? "text-emerald-500"
                              : "text-red-500",
                            "font-medium"
                          )}
                        >
                          {asset.dailyChange >= 0 ? "+" : ""}
                          {asset.dailyChange.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(asset.createdAt))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </>
  );
}
