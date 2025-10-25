"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Header from "../components/Header";
import Loading from "../../components/Loading";
import {
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/Button";

interface EditableField {
  label: string;
  value: string | null | undefined;
  icon: ReactNode;
  editable?: boolean;
  description?: string;
}

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: (session?.user as { phone?: string })?.phone ?? "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        });
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    if (status === "authenticated") {
      void loadProfile();
    }
  }, [status]);

  const fields: EditableField[] = useMemo(
    () => [
      {
        label: "Nome completo",
        value: form.name,
        icon: <IdentificationIcon className="h-5 w-5 text-emerald-500" />,
        editable: true,
        description: "Como aparecerá para outros usuários.",
      },
      {
        label: "E-mail",
        value: form.email,
        icon: <EnvelopeIcon className="h-5 w-5 text-emerald-500" />,
        editable: true,
        description: "Usado para notificações e recuperação de conta.",
      },
      {
        label: "Telefone",
        value: form.phone || "Não informado",
        icon: <PhoneIcon className="h-5 w-5 text-emerald-500" />,
        editable: true,
        description: "Necessário para alertas via SMS.",
      },
    ],
    [form.email, form.name, form.phone]
  );

  const securityCards = [
    {
      title: "Senha",
      icon: <KeyIcon className="h-6 w-6" />,
      description:
        "Use uma senha forte com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e símbolos.",
      action: "Alterar senha",
    },
    {
      title: "Autenticação 2FA",
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      description:
        "Adicione uma camada extra de segurança com verificações via aplicativo autenticador ou SMS.",
      action: "Configurar 2FA",
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        setMessage(error?.error ?? "Não foi possível salvar.");
        return;
      }
      setMessage("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      setMessage("Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="px-6 py-8">
        <Loading fullScreen={false} label="Carregando perfil..." />
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
      <Header userEmail={session.user?.email ?? ""} cryptos={[]} />
      {loadingProfile ? (
        <div className="px-6 py-8">
          <Loading fullScreen={false} label="Preparando suas informações..." />
        </div>
      ) : (
        <div className="flex w-full flex-col gap-8 px-6 py-8 lg:px-10">
        <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-emerald-500">
                Perfil
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                Dados pessoais
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Atualize suas informações básicas e mantenha sua conta segura.
              </p>
            </div>
            {message && (
              <span className="text-sm font-medium text-emerald-600">
                {message}
              </span>
            )}
            <Button
              variant="secondary"
              className="md:w-auto"
              loading={saving}
              onClick={handleSave}
            >
              Salvar alterações
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  {field.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {field.label}
                  </p>
                  {field.editable ? (
                    <input
                      value={field.value ?? ""}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          [field.label === "Nome completo"
                            ? "name"
                            : field.label === "E-mail"
                            ? "email"
                            : "phone"]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="mt-2 text-sm text-gray-900">
                      {field.value}
                    </p>
                  )}
                </div>
              </div>
              {field.description && (
                <p className="mt-3 text-xs text-gray-500">
                  {field.description}
                </p>
              )}
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Segurança
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Reforce a proteção da sua conta com autenticação em dois fatores e atualização periódica de senha.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {securityCards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    {card.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {card.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500">
                  {card.description}
                </p>
                <Button variant="ghost" className="justify-start text-sm">
                  {card.action}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
      )}
    </>
  );
}
