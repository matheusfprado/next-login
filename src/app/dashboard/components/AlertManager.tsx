"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/Button";
import { useCurrency } from "@/src/contexts/CurrencyContext";

type AlertDirection = "ABOVE" | "BELOW";
type AlertDelivery = "EMAIL" | "SMS";
type AlertStatus = "ACTIVE" | "TRIGGERED" | "DISABLED";

interface Alert {
  id: string;
  coinId: string;
  coinName: string;
  targetPrice: number;
  direction: AlertDirection;
  deliveryMethod: AlertDelivery;
  status: AlertStatus;
  triggeredAt?: string | null;
}

interface AlertManagerProps {
  cryptos: {
    id: string;
    name: string;
    symbol: string;
  }[];
  initialAlerts?: Alert[];
  onAlertsChange?: (alerts: Alert[]) => void;
}

export function AlertManager({
  cryptos,
  initialAlerts,
  onAlertsChange,
}: AlertManagerProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts ?? []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [, setInitializing] = useState(!initialAlerts);
  const { formatCurrency } = useCurrency();

  const coinOptions = useMemo(
    () =>
      cryptos.map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
      })),
    [cryptos]
  );

  const [form, setForm] = useState({
    coinId: "",
    targetPrice: "",
    direction: "ABOVE" as AlertDirection,
    deliveryMethod: "EMAIL" as AlertDelivery,
  });

  useEffect(() => {
    if (coinOptions.length > 0 && !form.coinId) {
      setForm((prev) => ({ ...prev, coinId: coinOptions[0].id }));
    }
  }, [coinOptions, form.coinId]);

  useEffect(() => {
    if (initialAlerts) {
      setAlerts(initialAlerts);
      setInitializing(false);
      return;
    }

    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/alerts");
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data);
        onAlertsChange?.(data);
      } finally {
        setInitializing(false);
      }
    };

    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAlerts]);

  const syncAlerts = (updater: (current: Alert[]) => Alert[]) => {
    setAlerts((current) => {
      const next = updater(current);
      onAlertsChange?.(next);
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.coinId || !form.targetPrice) return;

    setLoading(true);
    setMessage(null);

    const coinName =
      coinOptions.find((c) => c.id === form.coinId)?.name ?? form.coinId;

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coinId: form.coinId,
        coinName,
        targetPrice: Number(form.targetPrice),
        direction: form.direction,
        deliveryMethod: form.deliveryMethod,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      syncAlerts((prev) => [data, ...prev]);
      setMessage("Alerta criado com sucesso!");
      setForm((prev) => ({ ...prev, targetPrice: "" }));
    } else {
      const error = await res.json().catch(() => null);
      setMessage(error?.error ?? "Erro ao criar alerta.");
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    syncAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const handleCheckAlerts = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/alerts/check", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setMessage(
        data.message ??
          (data.triggered?.length
            ? "Alertas verificados."
            : "Nenhum alerta foi ativado.")
      );
      if (Array.isArray(data.triggered) && data.triggered.length > 0) {
        const triggeredIds = new Set(
          data.triggered.map((item: { id: string }) => item.id)
        );
        syncAlerts((prev) =>
          prev.map((alert) =>
            triggeredIds.has(alert.id)
              ? { ...alert, status: "TRIGGERED" }
              : alert
          )
        );
      }
    } else {
      setMessage("Não foi possível verificar os alertas.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <BellAlertIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Alertas de preço
            </h3>
            <p className="text-sm text-gray-500">
              Seja avisado quando o mercado atingir os seus gatilhos.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="sm:w-auto"
          onClick={handleCheckAlerts}
          loading={loading}
        >
          Verificar agora
        </Button>
      </div>
      {message && (
        <p className="text-sm text-emerald-600">{message}</p>
      )}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 md:grid-cols-5"
      >
        <label className="flex flex-col text-sm text-gray-700">
          Criptomoeda
          <select
            className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
            value={form.coinId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, coinId: event.target.value }))
            }
            required
          >
            {coinOptions.map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol.toUpperCase()})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Preço alvo (USD)
          <input
            type="number"
            step="0.01"
            min="0"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
            value={form.targetPrice}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, targetPrice: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Direção
          <select
            className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
            value={form.direction}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                direction: event.target.value as AlertDirection,
              }))
            }
          >
            <option value="ABOVE">Preço &gt;= alvo</option>
            <option value="BELOW">Preço &lt;= alvo</option>
          </select>
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Entrega
          <select
            className="appearance-none w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
            value={form.deliveryMethod}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                deliveryMethod: event.target.value as AlertDelivery,
              }))
            }
          >
            <option value="EMAIL">E-mail</option>
            <option value="SMS">SMS</option>
          </select>
        </label>

        <Button
          type="submit"
          variant="secondary"
          className="md:col-span-1"
          loading={loading}
          disabled={loading}
        >
          Criar alerta
        </Button>
      </form>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Você ainda não possui alertas configurados.
          </p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 px-4 py-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {alert.coinName}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {alert.direction === "ABOVE" ? "Acima de" : "Abaixo de"}{" "}
                    {formatCurrency(alert.targetPrice)} •{" "}
                    {alert.deliveryMethod === "EMAIL" ? "E-mail" : "SMS"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      alert.status === "ACTIVE"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {alert.status === "ACTIVE" ? (
                      <ClockIcon className="h-4 w-4" />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4" />
                    )}
                    {alert.status === "ACTIVE" ? "Ativo" : "Disparado"}
                  </span>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                    title="Remover alerta"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



