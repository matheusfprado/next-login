"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  type BarShapeProps,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import clsx from "clsx";
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { DashboardCrypto } from "../types";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/src/components/ui/chart";

type TradeInterval = "15m" | "1h" | "4h" | "1d";

interface HistoryPoint {
  timestamp: string;
  priceUsd: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

const chartConfig = {
  range: {
    label: "Mín. – Máx.",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const intervals: Array<{ value: TradeInterval; label: string }> = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  range: [number, number];
  pattern?: "hammer";
}

function isCandleData(value: unknown): value is CandleData {
  if (!value || typeof value !== "object") return false;
  const candle = value as Partial<CandleData>;
  return [candle.open, candle.high, candle.low, candle.close].every(
    (price) => typeof price === "number"
  );
}

function Candle({ x = 0, y = 0, width = 0, height = 0, payload }: BarShapeProps) {
  if (!isCandleData(payload)) return <g />;

  const rising = payload.close >= payload.open;
  const color = rising ? "var(--color-emerald-600)" : "var(--color-red-500)";
  const priceRange = payload.high - payload.low;
  const toY = (price: number) =>
    priceRange === 0 ? y + height / 2 : y + ((payload.high - price) / priceRange) * height;
  const openY = toY(payload.open);
  const closeY = toY(payload.close);
  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
  const bodyWidth = Math.max(Math.min(width * 0.65, 12), 3);
  const centerX = x + width / 2;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyY}
        width={bodyWidth}
        height={bodyHeight}
        rx={1}
        fill={rising ? "var(--background)" : color}
        stroke={color}
        strokeWidth={1.5}
      />
      {payload.pattern === "hammer" && (
        <g aria-label="Padrão Martelo detectado">
          <line x1={centerX} x2={centerX} y1={y + height + 28} y2={y + height + 8} stroke="var(--foreground)" strokeWidth={1.5} />
          <path
            d={`M ${centerX - 4} ${y + height + 13} L ${centerX} ${y + height + 8} L ${centerX + 4} ${y + height + 13}`}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth={1.5}
          />
          <text x={centerX} y={y + height + 41} fill="var(--foreground)" fontSize={11} fontWeight={600} textAnchor="middle">
            Martelo
          </text>
        </g>
      )}
    </g>
  );
}

function isHammer(candle: CandleData) {
  const body = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  if (range === 0) return false;

  const lowerWick = Math.min(candle.open, candle.close) - candle.low;
  const upperWick = candle.high - Math.max(candle.open, candle.close);
  const comparableBody = Math.max(body, range * 0.05);

  return body <= range * 0.45 &&
    lowerWick >= comparableBody * 1.5 &&
    upperWick <= comparableBody;
}

interface CryptoChartProps {
  cryptos: DashboardCrypto[];
  exchangeRate: number;
  className?: string;
}

export default function CryptoChart({
  cryptos,
  exchangeRate,
  className,
}: CryptoChartProps) {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [interval, setInterval] = useState<TradeInterval>("4h");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { currency } = useCurrency();

  const coin =
    cryptos.find((c) => c.id === selectedCoin) || cryptos[0] || null;

  useEffect(() => {
    const controller = new AbortController();

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await fetch(
          `/api/cryptos/${encodeURIComponent(selectedCoin)}/history?range=7d&points=84&interval=${interval}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Falha ao carregar histórico");
        const data: unknown = await response.json();
        if (
          data &&
          typeof data === "object" &&
          "points" in data &&
          Array.isArray(data.points)
        ) {
          setHistory(
            data.points.filter(
              (point): point is HistoryPoint =>
                !!point &&
                typeof point === "object" &&
                "timestamp" in point &&
                "priceUsd" in point &&
                typeof point.timestamp === "string" &&
                typeof point.priceUsd === "number"
            )
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Erro ao carregar histórico de preços:", error);
          setHistory([]);
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => controller.abort();
  }, [interval, selectedCoin]);

  const effectiveHistory = useMemo<HistoryPoint[]>(() => {
    if (history.length >= 2) return history;

    const prices = coin?.sparkline_in_7d?.price ?? [];
    const intervalMs = prices.length > 1
      ? (7 * 24 * 60 * 60 * 1000) / (prices.length - 1)
      : 0;
    const start = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return prices.map((priceUsd, index) => ({
      timestamp: new Date(start + intervalMs * index).toISOString(),
      priceUsd,
    }));
  }, [coin, history]);

  const data = useMemo<CandleData[]>(
    () => {
      const tradeCandles = effectiveHistory.flatMap((point) =>
        typeof point.open === "number" &&
        typeof point.high === "number" &&
        typeof point.low === "number" &&
        typeof point.close === "number"
          ? [{
              time: point.timestamp,
              open: point.open * exchangeRate,
              high: point.high * exchangeRate,
              low: point.low * exchangeRate,
              close: point.close * exchangeRate,
              range: [point.low * exchangeRate, point.high * exchangeRate] as [number, number],
            }]
          : []
      );
      const candles: CandleData[] = tradeCandles;

      if (candles.length === 0) {
        const candleSize = Math.max(4, Math.ceil(effectiveHistory.length / 42));
        for (let index = 0; index < effectiveHistory.length; index += candleSize) {
          const points = effectiveHistory.slice(index, index + candleSize);
          if (points.length < 2) continue;
          const prices = points.map((point) => point.priceUsd * exchangeRate);
          const open = prices[0];
          const close = prices[prices.length - 1];
          const high = Math.max(...prices);
          const low = Math.min(...prices);
          candles.push({ time: points[0].timestamp, open, high, low, close, range: [low, high] });
        }
      }

      return candles.map((candle, index) => {
        const previousCandles = candles.slice(Math.max(0, index - 3), index);
        const wasFalling = previousCandles.length >= 2 &&
          previousCandles[previousCandles.length - 1].close < previousCandles[0].open;

        return isHammer(candle) && wasFalling
          ? { ...candle, pattern: "hammer" as const }
          : candle;
      });
    },
    [effectiveHistory, exchangeRate]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
        style: "currency",
        currency,
      }),
    [currency]
  );

  const formatChartCurrency = (
    value?: number | string | ReadonlyArray<number | string>
  ): string => {
    if (Array.isArray(value)) {
      return value.map(formatChartCurrency).join(" - ");
    }

    const numericValue = Number(value);
    return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0);
  };

  const currentPrice = data.length > 0 ? data[data.length - 1].close : null;
  const percentChange =
    data.length > 0 ? ((data[data.length - 1].close - data[0].open) / data[0].open) * 100 : null;

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {coin?.name || "Carregando..."}
            </h3>
            <p className="text-sm text-gray-500">Mercado {coin?.symbol.toUpperCase()}/USDT</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label
            htmlFor="coin-select"
            className="text-sm font-medium text-gray-700"
          >
            Selecione a moeda:
          </label>
          <div className="w-48">
            <Select
              value={selectedCoin}
              onValueChange={setSelectedCoin}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cryptos.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} ({item.symbol.toUpperCase()})</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {currentPrice && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold text-gray-900">
              {currencyFormatter.format(currentPrice)}
            </span>
            {percentChange !== null && (
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  percentChange >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                )}
              >
                {percentChange >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {percentChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-1" aria-label="Período dos candles">
        {intervals.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={interval === item.value ? "default" : "ghost"}
            size="sm"
            className="h-8 min-w-11 px-3 text-xs"
            aria-pressed={interval === item.value}
            onClick={() => setInterval(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground" aria-label="Legenda do gráfico">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-emerald-600 bg-background" /> Alta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-red-500" /> Baixa
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="font-semibold text-foreground">↑</span> Martelo
        </span>
      </div>
      {historyLoading ? (
        <div role="status" aria-label="Carregando histórico de preços">
          <Skeleton className="h-[280px] w-full rounded-xl" />
          <span className="sr-only">Carregando histórico de preços...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-center text-sm text-gray-500">
          O histórico será exibido após o worker registrar os primeiros preços.
        </div>
      ) : (
      <ChartContainer
        config={chartConfig}
        className="h-[280px] w-full aspect-auto"
        aria-label={`Gráfico de trade ${coin?.name ?? "criptomoeda"}, candles de ${interval}`}
      >
        <ComposedChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={72}
            domain={["auto", "auto"]}
            padding={{ top: 12, bottom: 52 }}
            tickFormatter={formatChartCurrency}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
            content={({ active, label, payload }) => {
              const candle: unknown = payload?.[0]?.payload;
              if (!active || !isCandleData(candle)) return null;

              return (
                <div className="min-w-48 rounded-lg border bg-background p-3 text-xs shadow-xl">
                  <p className="mb-2 font-medium text-foreground">
                    {new Date(String(label)).toLocaleString("pt-BR")}
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 tabular-nums">
                    <dt className="text-muted-foreground">Abertura</dt><dd className="text-right font-mono">{formatChartCurrency(candle.open)}</dd>
                    <dt className="text-muted-foreground">Máxima</dt><dd className="text-right font-mono">{formatChartCurrency(candle.high)}</dd>
                    <dt className="text-muted-foreground">Mínima</dt><dd className="text-right font-mono">{formatChartCurrency(candle.low)}</dd>
                    <dt className="text-muted-foreground">Fechamento</dt><dd className="text-right font-mono">{formatChartCurrency(candle.close)}</dd>
                  </dl>
                </div>
              );
            }}
          />
          <Bar
            dataKey="range"
            shape={Candle}
            isAnimationActive={false}
            maxBarSize={18}
          />
        </ComposedChart>
      </ChartContainer>
      )}
    </div>
  );
}
