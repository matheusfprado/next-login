"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Loading from "../../components/Loading";
import {
  BellAlertIcon,
  ArrowPathIcon,
  CheckIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LanguageIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import {
  Currency,
  densityCode,
  languageCode,
  useCurrency,
} from "@/src/contexts/CurrencyContext";

interface ToggleSetting {
  id: string;
  title: string;
  description: string;
  value: boolean;
  icon: ReactNode;
}

interface SelectSetting {
  id: string;
  title: string;
  description: string;
  options: string[];
  value: string;
  icon: ReactNode;
}

export default function ConfiguracoesPage() {
  const { data: session, status } = useAuth();
  const router = useRouter();
  const { setCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    emailAlerts: true,
    smsAlerts: false,
    weeklySummary: true,
  });
  const [selects, setSelects] = useState<Record<string, string>>({
    language: "Português (Brasil)",
    currency: "Real (BRL)",
    dashboardDensity: "Confortável",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        setToggles({
          emailAlerts: !!data.emailAlerts,
          smsAlerts: !!data.smsAlerts,
          weeklySummary: !!data.weeklySummary,
        });
        setSelects({
          language: data.language ?? "Português (Brasil)",
          currency: data.currency ?? "Real (BRL)",
          dashboardDensity: data.dashboardDensity ?? "Confortável",
        });
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    if (status === "authenticated") {
      void loadSettings();
    }
  }, [status]);

  const toggleSettings: ToggleSetting[] = useMemo(
    () => [
      {
        id: "emailAlerts",
        title: "Alertas por e-mail",
        description: "Receba atualizações e alertas importantes diretamente no seu e-mail.",
        value: toggles.emailAlerts,
        icon: <EnvelopeIcon className="size-5 text-primary" />,
      },
      {
        id: "smsAlerts",
        title: "Alertas por SMS",
        description: "Seja avisado por SMS quando um alerta de preço for atingido.",
        value: toggles.smsAlerts,
        icon: <DevicePhoneMobileIcon className="size-5 text-primary" />,
      },
      {
        id: "weeklySummary",
        title: "Resumo semanal",
        description: "Receba um resumo semanal com insights e desempenho da carteira.",
        value: toggles.weeklySummary,
        icon: <ChartBarIcon className="size-5 text-primary" />,
      },
    ],
    [toggles]
  );

  const selectSettings: SelectSetting[] = useMemo(
    () => [
      {
        id: "language",
        title: "Idioma da plataforma",
        description: "Selecione a língua padrão que será utilizada na interface.",
        value: selects.language,
        options: ["Português (Brasil)", "Inglês (EUA)", "Espanhol", "Francês"],
        icon: <LanguageIcon className="size-5 text-primary" />,
      },
      {
        id: "currency",
        title: "Moeda principal",
        description: "Defina a moeda utilizada para conversões e relatórios.",
        value: selects.currency,
        options: ["Real (BRL)", "Dólar americano (USD)", "Euro (EUR)", "Libra (GBP)"],
        icon: <GlobeAltIcon className="size-5 text-primary" />,
      },
      {
        id: "dashboardDensity",
        title: "Densidade do dashboard",
        description: "Controle o espaçamento e a visualização dos cards do dashboard.",
        value: selects.dashboardDensity,
        options: ["Confortável", "Compacto", "Espaçoso"],
        icon: <BellAlertIcon className="size-5 text-primary" />,
      },
    ],
    [selects]
  );

  const handleToggle = (id: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelect = (id: string, value: string) => {
    setSelects((prev) => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    setToggles({
      emailAlerts: true,
      smsAlerts: false,
      weeklySummary: true,
    });
    setSelects({
      language: "Português (Brasil)",
      currency: "Real (BRL)",
      dashboardDensity: "Confortável",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAlerts: toggles.emailAlerts,
          smsAlerts: toggles.smsAlerts,
          weeklySummary: toggles.weeklySummary,
          language: selects.language,
          currency: selects.currency,
          dashboardDensity: selects.dashboardDensity,
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar configurações");

      const currencyMap: Record<string, Currency> = {
        "Real (BRL)": "BRL",
        "Dólar americano (USD)": "USD",
        "Euro (EUR)": "EUR",
        "Libra (GBP)": "GBP",
      };
      setCurrency(currencyMap[selects.currency] ?? "BRL");
      document.documentElement.lang = languageCode(selects.language);
      document.body.dataset.dashboardDensity = densityCode(
        selects.dashboardDensity
      );
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Carregando configurações..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Redirecionando..." />
      </div>
    );
  }

  return (
    <>
      {loadingSettings ? (
        <div className="px-6 py-8">
          <Loading fullScreen={false} label="Preparando suas preferências..." />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative py-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Preferências
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Configurações da conta
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Personalize notificações, idioma e a experiência do dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-h-11 rounded-xl bg-background/80"
                disabled={saving}
                onClick={handleReset}
              >
                <ArrowPathIcon aria-hidden="true" />
                Restaurar padrão
              </Button>
              <Button
                type="button"
                size="lg"
                className="min-h-11 rounded-xl shadow-sm shadow-primary/20"
                disabled={saving}
                aria-busy={saving}
                onClick={handleSave}
              >
                {saving ? (
                  <ArrowPathIcon className="animate-spin" aria-hidden="true" />
                ) : (
                  <CheckIcon aria-hidden="true" />
                )}
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>

        <section aria-label="Notificações" className="grid gap-4 lg:grid-cols-3">
          {toggleSettings.map((setting) => (
            <Card
              key={setting.id}
              className="group gap-0 border-border/70 shadow-xs transition-colors duration-200 hover:border-primary/30"
            >
              <CardContent className="flex h-full items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  {setting.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {setting.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
              </div>
              <Switch className="mt-1 shrink-0" checked={setting.value} onCheckedChange={(checked) => handleToggle(setting.id, checked)} aria-label={setting.title} />
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="gap-0 border-border/70 shadow-xs">
          <CardContent>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Preferências gerais
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ajuste como as informações são apresentadas e em qual idioma são exibidas.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {selectSettings.map((setting) => (
              <label
                key={setting.id}
                className="flex flex-col gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 transition-colors duration-200 focus-within:border-primary/50 focus-within:bg-primary/[0.03] hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {setting.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {setting.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Select
                  value={setting.value}
                  onValueChange={(value) => handleSelect(setting.id, value)}
                >
                  <SelectTrigger className="h-11 w-full bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>{setting.options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </label>
            ))}
          </div>
          </CardContent>
        </Card>
        </div>
      )}
    </>
  );
}




