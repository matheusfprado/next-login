"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  IdentificationIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../components/Button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button as ShadcnButton } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";

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
  const [verifiedEmail, setVerifiedEmail] = useState(
    session?.user?.email ?? ""
  );
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isDeleteModalOpen) return;

    cancelDeleteRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !securityLoading) {
        setIsDeleteModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDeleteModalOpen, securityLoading]);

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
        setVerifiedEmail(data.email ?? "");
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

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currentPassword:
            form.email.trim().toLowerCase() !== verifiedEmail.toLowerCase()
              ? emailChangePassword
              : undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        setMessage(error?.error ?? "Não foi possível salvar.");
        return;
      }
      const data = await res.json().catch(() => null);
      setMessage(data?.message ?? "Perfil atualizado com sucesso!");
      if (data?.emailChangePending) {
        setForm((current) => ({ ...current, email: verifiedEmail }));
        setEmailChangePassword("");
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      setMessage("Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setSecurityLoading(true);
    setMessage(null);
    const response = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    const data = await response.json().catch(() => null);
    setMessage(response.ok ? "Senha alterada com sucesso." : data?.error ?? "Erro ao alterar senha.");
    if (response.ok) setPasswordForm({ currentPassword: "", newPassword: "" });
    setSecurityLoading(false);
  };

  const handleAccountDelete = async () => {
    setSecurityLoading(true);
    setDeleteError(null);
    const response = await fetch("/api/account", {
      method: "DELETE",
    });
    if (response.ok) {
      await signOut({ callbackUrl: "/login" });
      return;
    }
    const data = await response.json().catch(() => null);
    setDeleteError(data?.error ?? "Não foi possível excluir a conta.");
    setSecurityLoading(false);
  };

  if (status === "unauthenticated") return null;

  return (
    <>
        <div className="flex w-full flex-col gap-8 px-4 py-6 lg:px-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-card">
          <CardContent>
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
              <span role="status" className="text-sm font-medium text-emerald-600">
                {message}
              </span>
            )}
            <Button
              variant="secondary"
              className="md:w-auto"
              loading={saving}
              disabled={
                form.email.trim().toLowerCase() !== verifiedEmail.toLowerCase() &&
                !emailChangePassword
              }
              onClick={handleSave}
            >
              Salvar alterações
            </Button>
          </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          {fields.map((field) => (
            <Card
              key={field.label}
              className="gap-0"
            >
              <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  {field.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {field.label}
                  </p>
                  {field.editable ? (
                    <Input
                      type={field.label === "E-mail" ? "email" : "text"}
                      aria-label={field.label}
                      autoComplete={
                        field.label === "Nome completo"
                          ? "name"
                          : field.label === "E-mail"
                            ? "email"
                            : "tel"
                      }
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
                      className="mt-2"
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
              </CardContent>
            </Card>
          ))}
        </section>

        {form.email.trim().toLowerCase() !== verifiedEmail.toLowerCase() && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <label className="block text-sm font-medium text-gray-800">
              Confirme sua senha atual para alterar o e-mail
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={emailChangePassword}
                onChange={(event) => setEmailChangePassword(event.target.value)}
                className="mt-2 min-h-11"
              />
            </label>
            <p className="mt-2 text-sm text-gray-600">
              O endereço atual continuará ativo até você confirmar o link enviado
              ao novo e-mail.
            </p>
          </section>
        )}

        <Card className="gap-0">
          <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Segurança</h2>
              <p className="mt-1 text-sm text-gray-500">
                Altere sua senha ou exclua permanentemente a conta.
              </p>
            </div>
            <ShadcnButton
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Excluir conta"
              title="Excluir conta"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </ShadcnButton>
          </div>
          <div className="mt-6 max-w-xl">
            <div className="space-y-4 rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><KeyIcon className="h-5 w-5" /></div>
                <h3 className="font-semibold text-gray-900">Alterar senha</h3>
              </div>
              <label className="block text-sm font-medium text-gray-700">Senha atual<Input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="mt-1 min-h-11" /></label>
              <label className="block text-sm font-medium text-gray-700">Nova senha<Input type="password" autoComplete="new-password" minLength={8} value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="mt-1 min-h-11" /></label>
              <Button variant="secondary" loading={securityLoading} disabled={!passwordForm.currentPassword || passwordForm.newPassword.length < 8} onClick={handlePasswordChange}>Alterar senha</Button>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !securityLoading && setIsDeleteModalOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <DialogTitle>Excluir sua conta?</DialogTitle>
            <DialogDescription>
              Seu usuário, carteira, metas, alertas, tokens e preferências serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {deleteError && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{deleteError}</p>}

          <DialogFooter>
            <ShadcnButton ref={cancelDeleteRef} type="button" variant="outline" disabled={securityLoading} onClick={() => setIsDeleteModalOpen(false)}>Cancelar</ShadcnButton>
            <ShadcnButton type="button" variant="destructive" disabled={securityLoading} onClick={() => void handleAccountDelete()}>
              {securityLoading ? "Excluindo..." : "Excluir definitivamente"}
            </ShadcnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
