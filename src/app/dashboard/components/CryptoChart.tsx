"use client";

import React, { useMemo, useState } from "react";
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

interface CryptoChartProps {
  cryptos: DashboardCrypto[];
  exchangeRate: number;
  className?: string;
}

function formatChartCurrency(value: number | string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "R$ 0";
  }

  return `R$ ${numericValue.toLocaleString("pt-BR")}`;
}

export default function CryptoChart({
  cryptos,
  exchangeRate,
  className,
}: CryptoChartProps) {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");

  const coin =
    cryptos.find((c) => c.id === selectedCoin) || cryptos[0] || null;

  const data =
    coin?.sparkline_in_7d?.price.map((p: number, i: number) => ({
      time: i,
      price: p * exchangeRate,
    })) || [];

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const currentPrice = data.length > 0 ? data[data.length - 1].price : null;
  const percentChange =
    data.length > 0 ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : null;

  return (
    <div className={clsx("rounded-2xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
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
          <div className="relative inline-block w-48">
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {cryptos.length > 0 ? (
                cryptos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol.toUpperCase()})
                  </option>
                ))
              ) : (
                <option disabled>Carregando...</option>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="w-4 h-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
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
    </div>
  );
}
