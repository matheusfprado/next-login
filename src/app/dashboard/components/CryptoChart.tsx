"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
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
  const [history, setHistory] = useState<
    Array<{ timestamp: string; priceUsd: number }>
  >([]);
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
          `/api/cryptos/${encodeURIComponent(selectedCoin)}/history?range=7d&points=300`,
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
              (point): point is { timestamp: string; priceUsd: number } =>
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
  }, [selectedCoin]);

  const data = useMemo(
    () =>
      history.map((point) => ({
        time: point.timestamp,
        price: point.priceUsd * exchangeRate,
      })),
    [exchangeRate, history]
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

  const currentPrice = data.length > 0 ? data[data.length - 1].price : null;
  const percentChange =
    data.length > 0 ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : null;

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
            <p className="text-sm text-gray-500">Últimos 7 dias</p>
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
      {historyLoading ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-gray-500">
          Carregando histórico...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-center text-sm text-gray-500">
          O histórico será exibido após o worker registrar os primeiros preços.
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
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
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            domain={["auto", "auto"]}
            tickFormatter={formatChartCurrency}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", borderRadius: 8, border: "none" }}
            itemStyle={{ color: "#f9fafb" }}
            formatter={formatChartCurrency}
            labelFormatter={(value) =>
              new Date(String(value)).toLocaleString("pt-BR")
            }
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#4ade80"
            fill="url(#colorPrice)"
            strokeWidth={3}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
