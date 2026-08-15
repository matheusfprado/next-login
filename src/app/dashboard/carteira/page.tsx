"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "../../components/Button";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { Button as ShadcnButton } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Table } from "@/src/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import {
  createUsdInvestmentMarket,
  dollarInvestmentValues,
  USD_INVESTMENT_ID,
} from "@/src/modules/portfolio/investment-assets";

interface PortfolioItem {
  id: string;
  coinId: string;
  coinName: string;
  amount: number;
  buyPrice: number;
  realizedProfit?: number;
  totalFees?: number;
  createdAt: string;
}

interface PortfolioTransaction {
  id: string;
  coinId: string;
  coinName: string;
  type: "BUY" | "SELL" | "ADJUSTMENT";
  amount: number;
  unitPrice: number;
  fee: number;
  realizedProfit: number;
  occurredAt: string;
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

const formatNumber = (value: number, fractionDigits = 4) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(value) ? value : 0);

export default function CarteiraPage() {
  const { status } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [usdBrlRate, setUsdBrlRate] = useState(1);

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [cryptos, setCryptos] = useState<CryptoMarket[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "BUY" as "BUY" | "SELL",
    coinId: "",
    coinName: "",
    amount: "",
    buyPrice: "",
    fee: "0",
  });
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", buyPrice: "" });

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
        const [portfolioRes, cryptoRes, transactionsRes, rateRes] = await Promise.all([
          fetch("/api/portifolio"),
          fetch("/api/cryptos"),
          fetch("/api/portifolio/transactions?pageSize=50"),
          fetch("/api/exchange-rates?currency=BRL"),
        ]);

        if (portfolioRes.status === 401) {
          router.replace("/login");
          return;
        }

        const portfolioData = await portfolioRes.json();
        const cryptoData = await cryptoRes.json();
        const transactionsData = await transactionsRes.json();
        const rateData: unknown = await rateRes.json();
        const rate = rateData && typeof rateData === "object" && "rate" in rateData && typeof rateData.rate === "number"
          ? rateData.rate
          : 1;

        setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
        setUsdBrlRate(rate);
        setCryptos(Array.isArray(cryptoData) ? [...cryptoData, createUsdInvestmentMarket(rate)] : [createUsdInvestmentMarket(rate)]);
        setTransactions(
          Array.isArray(transactionsData?.items) ? transactionsData.items : []
        );

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
      const isDollar = item.coinId === USD_INVESTMENT_ID;
      const dollarValues = isDollar
        ? dollarInvestmentValues(item.amount, item.buyPrice, usdBrlRate)
        : null;
      const currentPrice = isDollar ? 1 : Number(marketData?.current_price ?? item.buyPrice);
      const investedValue = dollarValues?.investedUsd ?? item.amount * item.buyPrice;
      const currentValue = dollarValues?.currentUsd ?? item.amount * currentPrice;
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
  }, [portfolio, cryptos, usdBrlRate]);

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

  const formatStoredPrice = (coinId: string, value: number) =>
    coinId === USD_INVESTMENT_ID
      ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
      : formatCurrency(value);

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
          type: form.type,
          coinId: form.coinId,
          coinName: form.coinName || selectedCoin?.name || form.coinId,
          amount: Number(form.amount),
          unitPrice: Number(form.buyPrice),
          fee: Number(form.fee || 0),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Erro ao adicionar ativo.");
      }

      const created = (await response.json()) as PortfolioItem;
      setPortfolio((prev) => {
        if (created.amount <= 0) {
          return prev.filter((item) => item.id !== created.id);
        }
        const exists = prev.some((item) => item.id === created.id);
        return exists
          ? prev.map((item) => (item.id === created.id ? created : item))
          : [created, ...prev];
      });
      setFeedback(
        form.type === "BUY"
          ? "Compra registrada com sucesso."
          : "Venda registrada com sucesso."
      );
      setForm((prev) => ({
        ...prev,
        amount: "",
        fee: "0",
        buyPrice:
          selectedCoin && selectedCoin.current_price
            ? String(selectedCoin.current_price)
            : "",
        coinName: selectedCoin?.name ?? prev.coinName,
      }));
      await loadTransactions();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o ativo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTransactions = async () => {
    const response = await fetch("/api/portifolio/transactions?pageSize=50");
    if (!response.ok) return;
    const data = await response.json();
    setTransactions(Array.isArray(data?.items) ? data.items : []);
  };

  const startEditing = (item: PortfolioItem) => {
    setEditing(item);
    setEditForm({ amount: String(item.amount), buyPrice: String(item.buyPrice) });
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/portifolio/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(editForm.amount),
        buyPrice: Number(editForm.buyPrice),
      }),
    });

    if (response.ok) {
      const updated = (await response.json()) as PortfolioItem;
      setPortfolio((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditing(null);
      setFeedback("Ativo atualizado.");
      await loadTransactions();
    } else {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Não foi possível atualizar o ativo.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (item: PortfolioItem) => {
    if (!window.confirm(`Remover ${item.coinName} da carteira?`)) return;
    const response = await fetch(`/api/portifolio/${item.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setPortfolio((current) => current.filter((asset) => asset.id !== item.id));
      setFeedback("Ativo removido.");
      await loadTransactions();
    } else {
      setError("Não foi possível remover o ativo.");
    }
  };

  const handleRefresh = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const [portfolioRes, cryptoRes, transactionsRes, rateRes] = await Promise.all([
        fetch("/api/portifolio"),
        fetch("/api/cryptos"),
        fetch("/api/portifolio/transactions?pageSize=50"),
        fetch("/api/exchange-rates?currency=BRL"),
      ]);
      const portfolioData = await portfolioRes.json();
      const cryptoData = await cryptoRes.json();
      const transactionsData = await transactionsRes.json();
      const rateData: unknown = await rateRes.json();
      const rate = rateData && typeof rateData === "object" && "rate" in rateData && typeof rateData.rate === "number"
        ? rateData.rate
        : usdBrlRate;
      setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
      setUsdBrlRate(rate);
      setCryptos(Array.isArray(cryptoData) ? [...cryptoData, createUsdInvestmentMarket(rate)] : [createUsdInvestmentMarket(rate)]);
      setTransactions(
        Array.isArray(transactionsData?.items) ? transactionsData.items : []
      );
    } catch (err) {
      console.error(err);
      setError("Não foi possível atualizar os dados agora.");
    } finally {
      setIsFetching(false);
    }
  };

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-6 px-3 py-4 sm:gap-8 sm:px-4 sm:py-6 lg:px-6">

      <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-400 text-white shadow-xl sm:rounded-3xl">
        <div className="absolute inset-y-0 right-[-25%] hidden w-2/3 bg-white/10 blur-3xl md:block" />
        <div className="relative flex flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 md:flex-row md:items-center md:justify-between lg:py-10">
          <div className="max-w-xl">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium uppercase leading-5 tracking-wider sm:px-4 sm:tracking-widest">
              <SparklesIcon className="h-4 w-4" />
              Nova experiência da carteira digital
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
              Uma visão profissional da sua carteira
            </h1>
            <p className="mt-3 text-sm text-emerald-50 sm:text-base">
              Acompanhe patrimônio, rentabilidade e distribuição com uma
              interface moderna inspirada no shadcn/ui.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:min-w-80">
            <div className="rounded-2xl bg-white/15 p-4 text-sm backdrop-blur">
              <p className="text-emerald-100">Total investido</p>
              <p className="mt-1 break-words text-xl font-semibold tabular-nums text-white sm:text-2xl">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 text-sm backdrop-blur">
              <p className="text-emerald-100">Resultado</p>
              <p className="mt-1 break-words text-xl font-semibold tabular-nums text-white sm:text-2xl" aria-live="polite">
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
        <Card className="gap-2 p-4 sm:p-6">
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
        </Card>

        <Card className="gap-2 p-4 sm:p-6">
          <p className="text-sm text-gray-500">
            Ativos monitorados
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {enrichedPortfolio.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Diversifique para mitigar riscos.
          </p>
        </Card>

        <Card className="gap-2 p-4 sm:p-6">
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
        </Card>

        <Card className="gap-2 p-4 sm:p-6">
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
        </Card>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="gap-0 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Registrar movimentação
              </h2>
              <p className="text-sm text-gray-500">
                Compre ou venda ativos com preço e taxa da operação.
              </p>
            </div>
            <Button
              variant="ghost"
              className="min-h-11 text-sm sm:w-auto"
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

            <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1" role="group" aria-label="Tipo da movimentação">
              {(["BUY", "SELL"] as const).map((type) => (
                <ShadcnButton
                  key={type}
                  type="button"
                  variant="ghost"
                  onClick={() => setForm((current) => ({ ...current, type }))}
                  className={clsx(
                    "min-h-11 rounded-lg px-4 text-sm font-semibold",
                    form.type === type
                      ? type === "BUY"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-white text-red-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                  aria-pressed={form.type === type}
                >
                  {type === "BUY" ? "Compra" : "Venda"}
                </ShadcnButton>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm text-gray-700">
                Ativo
                <Select
                  value={form.coinId}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      coinId: value,
                      coinName:
                        cryptos.find(
                          (coin) => coin.id === value
                        )?.name ?? prev.coinName,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1 min-h-11 w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                  {cryptos.map((coin) => (
                    <SelectItem key={coin.id} value={coin.id}>
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                Nome de exibição
                <Input
                  type="text"
                  value={form.coinName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      coinName: event.target.value,
                    }))
                  }
                  placeholder="Ex: Bitcoin"
                  className="mt-1 min-h-11"
                />
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                Quantidade
                <Input
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
                  className="mt-1 min-h-11"
                  required
                />
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                {form.type === "BUY" ? "Preço pago" : "Preço de venda"} ({form.coinId === USD_INVESTMENT_ID ? "BRL por USD" : "USD"})
                <Input
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
                  className="mt-1 min-h-11"
                  required
                />
              </label>

              <label className="flex flex-col text-sm text-gray-700">
                Taxa ({form.coinId === USD_INVESTMENT_ID ? "BRL" : "USD"})
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fee}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, fee: event.target.value }))
                  }
                  placeholder="0.00"
                  className="mt-1 min-h-11"
                />
              </label>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  variant="secondary"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="min-h-11 sm:w-auto"
                >
                  Registrar {form.type === "BUY" ? "compra" : "venda"}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        <Card className="gap-0 p-4 sm:p-6">
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
                  <Progress value={Math.max(item.percentage, 3)} className="mt-2" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card className="gap-0 overflow-hidden p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalhes da carteira
          </h2>
          <p className="text-sm text-gray-500">
            Compare valores investidos e resultados atuais.
          </p>
        </div>
        <div className="space-y-3 md:hidden">
          {enrichedPortfolio.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-gray-500">
              Sua carteira está vazia. Adicione um novo ativo para começar.
            </p>
          ) : (
            enrichedPortfolio.map((asset) => (
              <article key={asset.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  {asset.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.image}
                      alt=""
                      className="size-10 shrink-0 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-600">
                      {asset.coinName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{asset.coinName}</h3>
                    <p className="truncate text-xs uppercase text-gray-500">{asset.symbol ?? asset.coinId}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <ShadcnButton
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => startEditing(asset)}
                      className="text-gray-500"
                      aria-label={`Editar ${asset.coinName}`}
                    >
                      <PencilSquareIcon className="size-5" />
                    </ShadcnButton>
                    <ShadcnButton
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      onClick={() => void handleDelete(asset)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remover ${asset.coinName}`}
                    >
                      <TrashIcon className="size-5" />
                    </ShadcnButton>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Valor atual</dt>
                    <dd className="mt-0.5 break-words font-semibold tabular-nums text-gray-900">{formatCurrency(asset.currentValue)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Quantidade</dt>
                    <dd className="mt-0.5 break-words tabular-nums text-gray-900">{formatNumber(asset.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Preço pago</dt>
                    <dd className="mt-0.5 break-words tabular-nums text-gray-900">{formatStoredPrice(asset.coinId, asset.buyPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">24h</dt>
                    <dd className={clsx("mt-0.5 font-medium tabular-nums", asset.dailyChange === undefined ? "text-gray-500" : asset.dailyChange >= 0 ? "text-emerald-700" : "text-red-700")}>
                      {asset.dailyChange === undefined ? "—" : `${asset.dailyChange >= 0 ? "+" : ""}${asset.dailyChange.toFixed(2)}%`}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500">Resultado</dt>
                    <dd className={clsx("mt-0.5 font-semibold tabular-nums", asset.profit >= 0 ? "text-emerald-700" : "text-red-700")}>
                      {asset.profit >= 0 ? "+" : ""}{formatCurrency(asset.profit)} ({asset.profitPercentage.toFixed(1)}%)
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[900px] divide-y divide-gray-200 text-sm">
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
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {enrichedPortfolio.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                    <td className="px-4 py-4">{formatStoredPrice(asset.coinId, asset.buyPrice)}</td>
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
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <ShadcnButton
                          type="button"
                          variant="ghost"
                          size="icon-lg"
                          onClick={() => startEditing(asset)}
                          className="text-gray-500"
                          aria-label={`Editar ${asset.coinName}`}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </ShadcnButton>
                        <ShadcnButton
                          type="button"
                          variant="ghost"
                          size="icon-lg"
                          onClick={() => void handleDelete(asset)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remover ${asset.coinName}`}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </ShadcnButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card className="gap-0 p-4 sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">Movimentações</h2>
          <p className="text-sm text-gray-500">
            Compras, vendas, correções, taxas e lucro realizado.
          </p>
        </div>
        <div className="space-y-3 md:hidden">
          {transactions.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-gray-500">
              Nenhuma movimentação registrada.
            </p>
          ) : (
            transactions.map((transaction) => (
              <article key={transaction.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">{transaction.coinName}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(transaction.occurredAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className={clsx(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    transaction.type === "BUY" && "bg-emerald-100 text-emerald-700",
                    transaction.type === "SELL" && "bg-red-100 text-red-700",
                    transaction.type === "ADJUSTMENT" && "bg-gray-100 text-gray-700"
                  )}>
                    {transaction.type === "BUY" ? "Compra" : transaction.type === "SELL" ? "Venda" : "Ajuste"}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Quantidade</dt>
                    <dd className="mt-0.5 break-words tabular-nums text-gray-900">{formatNumber(transaction.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Preço</dt>
                    <dd className="mt-0.5 break-words tabular-nums text-gray-900">{formatStoredPrice(transaction.coinId, transaction.unitPrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Taxa</dt>
                    <dd className="mt-0.5 break-words tabular-nums text-gray-900">{formatStoredPrice(transaction.coinId, transaction.fee)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Lucro realizado</dt>
                    <dd className={clsx("mt-0.5 break-words font-medium tabular-nums", transaction.realizedProfit >= 0 ? "text-emerald-700" : "text-red-700")}>
                      {formatStoredPrice(transaction.coinId, transaction.realizedProfit)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[760px] divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Ativo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3 text-right">Preço</th>
                <th className="px-4 py-3 text-right">Taxa</th>
                <th className="px-4 py-3 text-right">Lucro realizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {new Date(transaction.occurredAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {transaction.coinName}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        transaction.type === "BUY" && "bg-emerald-100 text-emerald-700",
                        transaction.type === "SELL" && "bg-red-100 text-red-700",
                        transaction.type === "ADJUSTMENT" && "bg-gray-100 text-gray-700"
                      )}>
                        {transaction.type === "BUY" ? "Compra" : transaction.type === "SELL" ? "Venda" : "Ajuste"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNumber(transaction.amount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatStoredPrice(transaction.coinId, transaction.unitPrice)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatStoredPrice(transaction.coinId, transaction.fee)}</td>
                    <td className={clsx(
                      "px-4 py-3 text-right font-medium tabular-nums",
                      transaction.realizedProfit >= 0 ? "text-emerald-700" : "text-red-700"
                    )}>
                      {formatStoredPrice(transaction.coinId, transaction.realizedProfit)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          {editing && <form onSubmit={handleEdit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Editar {editing.coinName}</DialogTitle>
              <DialogDescription>A correção ficará registrada no histórico.</DialogDescription>
            </DialogHeader>
            <label className="block text-sm font-medium text-gray-700">
              Quantidade
              <Input type="number" min="0" step="0.00000001" required value={editForm.amount} onChange={(event) => setEditForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1 min-h-11" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Preço médio ({editing?.coinId === USD_INVESTMENT_ID ? "BRL por USD" : "USD"})
              <Input type="number" min="0" step="0.01" required value={editForm.buyPrice} onChange={(event) => setEditForm((current) => ({ ...current, buyPrice: event.target.value }))} className="mt-1 min-h-11" />
            </label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="min-h-11 sm:w-auto" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit" variant="secondary" className="min-h-11 sm:w-auto" loading={isSubmitting}>Salvar</Button>
            </div>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

