"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "../components/Header";
import {
  BellAlertIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LanguageIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/Button";

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
  const [saving, setSaving] = useState(false);
  const [, setLoadingSettings] = useState(true);
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
      await fetch("/api/settings", {
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
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "unauthenticated") return null;

  return (
    <>
      <Header userEmail={session?.user?.email ?? ""} cryptos={[]} />
      <div className="flex w-full flex-col gap-8 px-6 py-8 lg:px-10">
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
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
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {toggleSettings.map((setting) => (
            <div
              key={setting.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
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
              <label className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={setting.value}
                  onChange={(event) => handleToggle(setting.id, event.target.checked)}
                />
                <span className="peer h-5 w-10 rounded-full bg-gray-200 transition peer-checked:bg-emerald-500"></span>
                <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></span>
              </label>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
                <select
                  value={setting.value}
                  onChange={(event) => handleSelect(setting.id, event.target.value)}
                  className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                >
                  {setting.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>
        </div>
    </>
  );
}



