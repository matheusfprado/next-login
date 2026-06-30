"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loading from "../../components/Loading";
import {
  BellAlertIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LanguageIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/Button";
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
  const { data: session, status } = useSession();
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
        icon: <EnvelopeIcon className="h-5 w-5 text-emerald-500" />,
      },
      {
        id: "smsAlerts",
        title: "Alertas por SMS",
        description: "Seja avisado por SMS quando um alerta de preço for atingido.",
        value: toggles.smsAlerts,
        icon: <DevicePhoneMobileIcon className="h-5 w-5 text-emerald-500" />,
      },
      {
        id: "weeklySummary",
        title: "Resumo semanal",
        description: "Receba um resumo semanal com insights e desempenho da carteira.",
        value: toggles.weeklySummary,
        icon: <ChartBarIcon className="h-5 w-5 text-emerald-500" />,
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
        icon: <LanguageIcon className="h-5 w-5 text-emerald-500" />,
      },
      {
        id: "currency",
        title: "Moeda principal",
        description: "Defina a moeda utilizada para conversões e relatórios.",
        value: selects.currency,
        options: ["Real (BRL)", "Dólar americano (USD)", "Euro (EUR)", "Libra (GBP)"],
        icon: <GlobeAltIcon className="h-5 w-5 text-emerald-500" />,
      },
      {
        id: "dashboardDensity",
        title: "Densidade do dashboard",
        description: "Controle o espaçamento e a visualização dos cards do dashboard.",
        value: selects.dashboardDensity,
        options: ["Confortável", "Compacto", "Espaçoso"],
        icon: <BellAlertIcon className="h-5 w-5 text-emerald-500" />,
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
        <div className="flex w-full flex-col gap-8 px-4 py-6 lg:px-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-card">
          <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-emerald-500">
                Preferências
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                Configurações da conta
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Personalize notificações, idioma e a experiência do dashboard.
              </p>
            </div>
            <Button
              variant="secondary"
              className="md:w-auto"
              loading={saving}
              onClick={handleSave}
            >
              Aplicar configurações
            </Button>
          </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          {toggleSettings.map((setting) => (
            <Card
              key={setting.id}
              className="gap-0"
            >
              <CardContent className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  {setting.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {setting.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {setting.description}
                  </p>
                </div>
              </div>
              <Switch checked={setting.value} onCheckedChange={(checked) => handleToggle(setting.id, checked)} aria-label={setting.title} />
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="gap-0">
          <CardContent>
          <h2 className="text-lg font-semibold text-gray-900">
            Preferências gerais
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ajuste como as informações são apresentadas e em qual idioma são exibidas.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {selectSettings.map((setting) => (
              <label
                key={setting.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    {setting.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {setting.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Select
                  value={setting.value}
                  onValueChange={(value) => handleSelect(setting.id, value)}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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



