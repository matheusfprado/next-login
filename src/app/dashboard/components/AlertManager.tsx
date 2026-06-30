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
import { Button as ShadcnButton } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";

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
    <Card className="gap-0">
      <CardContent className="space-y-6">
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
          <Select
            value={form.coinId}
            onValueChange={(value) => setForm((prev) => ({ ...prev, coinId: value }))}
          >
            <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
            {coinOptions.map((coin) => (
              <SelectItem key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol.toUpperCase()})
              </SelectItem>
            ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Preço alvo (USD)
          <Input
            type="number"
            step="0.01"
            min="0"
            className="mt-1"
            value={form.targetPrice}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, targetPrice: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Direção
          <Select
            value={form.direction}
            onValueChange={(value) => setForm((prev) => ({ ...prev, direction: value as AlertDirection }))}
          >
            <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ABOVE">Preço &gt;= alvo</SelectItem>
              <SelectItem value="BELOW">Preço &lt;= alvo</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Entrega
          <Select
            value={form.deliveryMethod}
            onValueChange={(value) => setForm((prev) => ({ ...prev, deliveryMethod: value as AlertDelivery }))}
          >
            <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">E-mail</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
            </SelectContent>
          </Select>
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
                  <ShadcnButton
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(alert.id)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    title="Remover alerta"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </ShadcnButton>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </CardContent>
    </Card>
  );
}



