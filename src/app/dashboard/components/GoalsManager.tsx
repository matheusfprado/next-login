"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  FlagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/Button";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Progress } from "@/src/components/ui/progress";
import { Textarea } from "@/src/components/ui/textarea";

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  createdAt: string;
}

interface GoalsManagerProps {
  initialGoals?: Goal[];
  onGoalsChange?: (goals: Goal[]) => void;
}

export function GoalsManager({
  initialGoals,
  onGoalsChange,
}: GoalsManagerProps) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [, setInitializing] = useState(!initialGoals);
  const { formatCurrency } = useCurrency();

  const [form, setForm] = useState({
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
  });

  useEffect(() => {
    if (initialGoals) {
      setGoals(initialGoals);
      setInitializing(false);
      return;
    }

    const loadGoals = async () => {
      try {
        const res = await fetch("/api/goals");
        if (!res.ok) return;
        const data = await res.json();
        setGoals(data);
        onGoalsChange?.(data);
      } finally {
        setInitializing(false);
      }
    };

    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGoals]);

  const syncGoals = (updater: (current: Goal[]) => Goal[]) => {
    setGoals((current) => {
      const next = updater(current);
      onGoalsChange?.(next);
      return next;
    });
  };

  const progress = useMemo(() => {
    if (goals.length === 0) return 0;
    const total = goals.reduce(
      (acc, goal) => acc + Math.min(goal.currentAmount / goal.targetAmount, 1),
      0
    );
    return total / goals.length;
  }, [goals]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title || !form.targetAmount) return;

    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        targetAmount: Number(form.targetAmount),
        deadline: form.deadline || undefined,
      }),
    });

    if (res.ok) {
      const goal = await res.json();
      syncGoals((prev) => [goal, ...prev]);
      setMessage("Meta criada com sucesso!");
      setForm({
        title: "",
        description: "",
        targetAmount: "",
        deadline: "",
      });
    } else {
      const error = await res.json().catch(() => null);
      setMessage(error?.error ?? "Erro ao criar meta.");
    }

    setLoading(false);
  };

  const handleProgressUpdate = async (goal: Goal, value: number) => {
    if (Number.isNaN(value)) return;
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: value }),
    });

    if (res.ok) {
      const updated = await res.json();
      syncGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, ...updated } : g))
      );
    }
  };

  const handleDelete = async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (res.ok) {
      syncGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    }
  };

  return (
    <Card className="gap-0">
      <CardContent className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FlagIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Metas de investimento
            </h3>
            <p className="text-sm text-gray-500">
              Planeje objetivos e acompanhe o progresso com precisão.
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600">
          Progresso médio: {(progress * 100).toFixed(0)}%
        </span>
      </div>

      {message && (
        <p className="text-sm text-emerald-600">{message}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        <label className="flex flex-col text-sm text-gray-700">
          Título da meta
          <Input
            className="mt-1"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            required
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Valor alvo (USD)
          <Input
            type="number"
            min="0"
            className="mt-1"
            value={form.targetAmount}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                targetAmount: event.target.value,
              }))
            }
            required
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          Prazo (opcional)
          <Input
            type="date"
            className="mt-1"
            value={form.deadline}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, deadline: event.target.value }))
            }
          />
        </label>

        <Button
          type="submit"
          variant="secondary"
          className="md:col-span-1"
          loading={loading}
          disabled={loading}
        >
          Criar meta
        </Button>

        <label className="md:col-span-4 flex flex-col text-sm text-gray-700">
          Descrição (opcional)
          <Textarea
            className="mt-1"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />
        </label>
      </form>

      {goals.length === 0 ? (
        <p className="text-sm text-gray-500">
          Você ainda não definiu metas de investimento.
        </p>
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => {
            const percent = Math.min(
              (goal.currentAmount / goal.targetAmount) * 100,
              100
            );
            return (
              <li
                key={goal.id}
                className="space-y-3 rounded-xl border border-gray-200 px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {goal.title}
                    </h4>
                    {goal.description && (
                      <p className="text-sm text-gray-500">
                        {goal.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Alvo: {formatCurrency(goal.targetAmount)} - Atual:{" "}
                      {formatCurrency(goal.currentAmount)}
                      {goal.deadline
                        ? ` • Prazo: ${new Date(goal.deadline).toLocaleDateString("pt-BR")}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="sm:w-auto text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>Progresso</span>
                    <span>{percent.toFixed(0)}%</span>
                  </div>
                  <Progress value={percent} className="mt-2" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4" />
                    Atualizar progresso
                  </span>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 w-32"
                    defaultValue={goal.currentAmount}
                    onBlur={(event) =>
                      handleProgressUpdate(goal, Number(event.target.value))
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      </CardContent>
    </Card>
  );
}



