/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CryptoChartProps {
  cryptos: any[];
  exchangeRate: number;
}

export default function CryptoChart({ cryptos, exchangeRate }: CryptoChartProps) {
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");

  const coin =
    cryptos.find((c) => c.id === selectedCoin) || cryptos[0] || null;

  const data =
    coin?.sparkline_in_7d?.price.map((p: number, i: number) => ({
      time: i,
      price: p * exchangeRate,
    })) || [];

  const currentPrice = data.length > 0 ? data[data.length - 1].price : null;
  const percentChange =
    data.length > 0 ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 : null;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {coin?.name || "Carregando..."}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Últimos 7 dias</p>
        </div>
        <div className="flex items-center gap-4">
          <label
            htmlFor="coin-select"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Selecione a moeda:
          </label>
          <div className="relative inline-block w-48">
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="appearance-none w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors"
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
                className="w-4 h-4 text-gray-500 dark:text-gray-300"
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

      {/* Informações de preço */}
      {currentPrice && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              R${currentPrice.toLocaleString("pt-BR")}
            </span>
            {percentChange !== null && (
              <span
                className={`text-sm font-medium ${
                  percentChange >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {percentChange >= 0 ? "▲" : "▼"} {percentChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Gráfico */}
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
            tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", borderRadius: 8, border: "none" }}
            itemStyle={{ color: "#f9fafb" }}
            formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`}
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
