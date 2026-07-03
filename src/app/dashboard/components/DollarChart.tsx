"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/src/components/ui/button";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/src/components/ui/chart";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { formatCurrencyInput, parseCurrencyInput } from "@/src/modules/alerts/currency-input";

type DollarRange = "1d" | "5d" | "1m" | "1y" | "5y" | "max";

interface DollarPoint {
  timestamp: string;
  rate: number;
}

const ranges: Array<{ value: DollarRange; label: string }> = [
  { value: "1d", label: "1D" },
  { value: "5d", label: "5D" },
  { value: "1m", label: "1M" },
  { value: "1y", label: "1A" },
  { value: "5y", label: "5A" },
  { value: "max", label: "Máx" },
];

const chartConfig = {
  rate: { label: "USD/BRL", color: "#86efac" },
} satisfies ChartConfig;

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export default function DollarChart() {
  const [range, setRange] = useState<DollarRange>("1m");
  const usdValueRef = useRef(1);
  const [usdInput, setUsdInput] = useState(() => formatCurrencyInput(1, "USD", 1));
  const [brlInput, setBrlInput] = useState(() => formatCurrencyInput(0, "BRL", 1));
  const [points, setPoints] = useState<DollarPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/exchange-rates/history?range=${range}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Falha ao carregar histórico");
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("points" in data) || !Array.isArray(data.points)) {
          throw new Error("Histórico inválido");
        }
        setPoints(data.points.filter(isDollarPoint));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          console.error(loadError);
          setError("Não foi possível carregar a cotação do dólar.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadHistory();
    return () => controller.abort();
  }, [range]);

  const latest = points.at(-1)?.rate ?? 0;
  const latestDate = points.at(-1)?.timestamp;

  useEffect(() => {
    if (latest <= 0) return;
    setUsdInput(formatCurrencyInput(usdValueRef.current, "USD", 1));
    setBrlInput(formatCurrencyInput(usdValueRef.current, "BRL", latest));
  }, [latest]);

  const handleUsdChange = (value: string) => {
    const amountUsd = parseCurrencyInput(value, 1) ?? 0;
    usdValueRef.current = amountUsd;
    setUsdInput(formatCurrencyInput(amountUsd, "USD", 1));
    setBrlInput(formatCurrencyInput(amountUsd, "BRL", latest));
  };

  const handleBrlChange = (value: string) => {
    const amountUsd = parseCurrencyInput(value, latest) ?? 0;
    usdValueRef.current = amountUsd;
    setBrlInput(formatCurrencyInput(amountUsd, "BRL", latest));
    setUsdInput(formatCurrencyInput(amountUsd, "USD", 1));
  };
  const domain = useMemo(() => {
    if (points.length === 0) return ["auto", "auto"] as const;
    const values = points.map((point) => point.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.15, 0.01);
    return [min - padding, max + padding] as const;
  }, [points]);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm sm:p-6" aria-labelledby="dollar-chart-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.65fr)] lg:items-end">
        <div>
          <h3 id="dollar-chart-title" className="text-xl font-semibold">Cotação do dólar</h3>
          <p className="mt-1 text-sm text-gray-500">Conversão de dólar americano para real brasileiro</p>

          <p className="mt-5 text-3xl font-semibold tabular-nums sm:text-4xl">
            {latest ? `${latest.toFixed(2).replace(".", ",")} Real brasileiro` : "—"}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {latestDate ? `${new Date(latestDate).toLocaleString("pt-BR")} · Dados de mercado` : "Carregando cotação"}
          </p>

          <div className="mt-5 space-y-3">
            <label className="grid grid-cols-[1fr_auto] items-center rounded-lg border border-gray-200 bg-white px-3 shadow-xs">
              <span className="sr-only">Valor em dólar</span>
              <Input
                inputMode="decimal"
                value={usdInput}
                onChange={(event) => handleUsdChange(event.target.value)}
                className="h-11 border-0 bg-transparent px-0 text-gray-900 shadow-none focus-visible:ring-0"
              />
              <span className="text-sm text-gray-600">Dólar dos Estados Unidos</span>
            </label>
            <label className="grid grid-cols-[1fr_auto] items-center rounded-lg border border-gray-200 bg-gray-50 px-3">
              <span className="sr-only">Valor em real</span>
              <Input
                inputMode="decimal"
                value={brlInput}
                onChange={(event) => handleBrlChange(event.target.value)}
                className="h-11 border-0 bg-transparent px-0 text-gray-900 shadow-none focus-visible:ring-0"
              />
              <span className="text-sm text-gray-600">Real brasileiro</span>
            </label>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap justify-start gap-1 lg:justify-end" aria-label="Período da cotação">
            {ranges.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={range === item.value}
                onClick={() => setRange(item.value)}
                className={range === item.value
                  ? "h-9 min-w-11 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  : "h-9 min-w-11 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <Skeleton className="h-[250px] w-full bg-gray-100" />
          ) : error ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-red-600" role="alert">{error}</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full aspect-auto" aria-label={`Cotação USD/BRL no período ${range}`}>
              <AreaChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dollarRateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86efac" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#86efac" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} tickFormatter={(value: string) => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} />
                <YAxis axisLine={false} tickLine={false} width={52} domain={domain} tick={{ fill: "#6b7280" }} tickFormatter={(value: number) => value.toFixed(2).replace(".", ",")} />
                <ChartTooltip
                  cursor={{ stroke: "#9ca3af", strokeDasharray: "4 4" }}
                  content={({ active, payload }) => active && payload?.[0] ? (
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-xl">
                      <p>{new Date(String(payload[0].payload.timestamp)).toLocaleDateString("pt-BR")}</p>
                      <p className="mt-1 font-mono font-semibold">{brlFormatter.format(Number(payload[0].value))}</p>
                    </div>
                  ) : null}
                />
                <Area type="monotone" dataKey="rate" stroke="#86efac" strokeWidth={2.5} fill="url(#dollarRateFill)" dot={points.length <= 5} activeDot={{ r: 4, fill: "#86efac" }} isAnimationActive={false} />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </section>
  );
}

function isDollarPoint(value: unknown): value is DollarPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<DollarPoint>;
  return typeof point.timestamp === "string" && typeof point.rate === "number";
}
