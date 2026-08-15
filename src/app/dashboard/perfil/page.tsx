"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  ImageUp,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import Loading from "../../components/Loading";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

type ProfileResponse = ProfileForm & {
  avatar?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  message?: string;
  emailChangePending?: boolean;
  fieldErrors?: Partial<Record<keyof ProfileForm | "currentPassword", string[]>>;
  error?: string;
};

const emptyProfile: ProfileForm = { name: "", email: "", phone: "" };

export default function PerfilPage() {
  const { status, refresh: updateSession, signOut } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileResponse["fieldErrors"]>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteForm, setDeleteForm] = useState({
    currentPassword: "",
    confirmation: "",
  });
  const [securityInfo, setSecurityInfo] = useState({
    emailVerified: false,
    createdAt: "",
  });

  const emailChanged =
    form.email.trim().toLowerCase() !== verifiedEmail.trim().toLowerCase();

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();

    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const response = await fetch("/api/profile", { signal: controller.signal });
        const data = (await response.json().catch(() => null)) as ProfileResponse | null;

        if (!response.ok || !data) {
          setFeedback({
            type: "error",
            text: data?.error ?? "Não foi possível carregar o perfil.",
          });
          return;
        }

        const profile = {
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
        };
        setForm(profile);
        setAvatar(data.avatar ?? null);
        setVerifiedEmail(profile.email);
        setSecurityInfo({
          emailVerified: Boolean(data.emailVerified),
          createdAt: data.createdAt ?? "",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFeedback({ type: "error", text: "Não foi possível carregar o perfil." });
      } finally {
        if (!controller.signal.aborted) setLoadingProfile(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, [status]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1024 * 1024) {
      setFeedback({ type: "error", text: "Use uma imagem JPEG, PNG ou WebP de até 1 MB." });
      event.target.value = "";
      return;
    }

    setAvatarSaving(true);
    setFeedback(null);
    const body = new FormData();
    body.append("avatar", file);

    try {
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as
        | { avatar?: string; error?: string }
        | null;

      if (!response.ok || !data?.avatar) {
        setFeedback({ type: "error", text: data?.error ?? "Não foi possível enviar a foto." });
        return;
      }

      setAvatar(data.avatar);
      await updateSession().catch(() => null);
      setFeedback({ type: "success", text: "Foto atualizada com sucesso." });
    } catch {
      setFeedback({ type: "error", text: "Não foi possível enviar a foto." });
    } finally {
      setAvatarSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleAvatarRemove() {
    setAvatarSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setFeedback({ type: "error", text: data?.error ?? "Não foi possível remover a foto." });
        return;
      }

      setAvatar(null);
      await updateSession().catch(() => null);
      setFeedback({ type: "success", text: "Foto removida." });
    } catch {
      setFeedback({ type: "error", text: "Não foi possível remover a foto." });
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currentPassword: emailChanged ? emailChangePassword : undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as ProfileResponse | null;

      if (!response.ok) {
        setFieldErrors(data?.fieldErrors ?? {});
        setFeedback({
          type: "error",
          text: data?.error ?? "Não foi possível salvar o perfil.",
        });
        return;
      }

      await updateSession().catch(() => null);

      setFeedback({
        type: "success",
        text: data?.message ?? "Perfil atualizado com sucesso.",
      });

      if (data?.emailChangePending) {
        setForm((current) => ({ ...current, email: verifiedEmail }));
        setEmailChangePassword("");
      }
    } catch {
      setFeedback({ type: "error", text: "Não foi possível salvar o perfil." });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: "error", text: "A confirmação da nova senha não coincide." });
      return;
    }
    setPasswordSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setFeedback({
          type: "error",
          text: data?.error ?? "Não foi possível alterar a senha.",
        });
        return;
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setFeedback({ type: "success", text: "Senha alterada com sucesso." });
    } catch {
      setFeedback({ type: "error", text: "Não foi possível alterar a senha." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleAccountDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteForm),
      });
      if (response.ok) {
        await signOut({ callbackUrl: "/login" });
        return;
      }

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setDeleteError(data?.error ?? "Não foi possível excluir a conta.");
    } catch {
      setDeleteError("Não foi possível excluir a conta.");
    } finally {
      setDeleting(false);
    }
  }

  if (status === "loading" || loadingProfile) {
    return (
      <div className="px-6 py-8" role="status">
        <Loading
          fullScreen={false}
          label={status === "loading" ? "Carregando perfil..." : "Preparando seus dados..."}
        />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Perfil</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dados pessoais</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Atualize suas informações e mantenha sua conta segura.
            </p>
          </div>
          {feedback && (
            <div
              role={feedback.type === "error" ? "alert" : "status"}
              className={
                feedback.type === "error"
                  ? "flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                  : "flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-foreground"
              }
            >
              {feedback.type === "error" ? (
                <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
              {feedback.text}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-24 border-4 border-background shadow-md ring-1 ring-border">
            {avatar && <AvatarImage src={avatar} alt={`Foto de ${form.name || "perfil"}`} />}
            <AvatarFallback className="bg-primary/15 text-xl font-semibold text-primary">
              {(form.name || "Usuário").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Foto do perfil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              JPEG, PNG ou WebP. Tamanho máximo de 1 MB.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Selecionar foto do perfil"
                disabled={avatarSaving}
                onChange={(event) => void handleAvatarUpload(event)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={avatarSaving}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarSaving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ImageUp className="size-4" aria-hidden="true" />
                )}
                {avatar ? "Trocar foto" : "Enviar foto"}
              </Button>
              {avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={avatarSaving}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => void handleAvatarRemove()}
                >
                  Remover foto
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-3" aria-label="Informações pessoais">
          <ProfileField
            id="profile-name"
            label="Nome completo"
            description="Como seu nome aparece na plataforma."
            icon={<UserRound className="size-5" aria-hidden="true" />}
            value={form.name}
            error={fieldErrors?.name?.[0]}
            autoComplete="name"
            maxLength={120}
            onChange={(value) => updateField("name", value)}
          />
          <ProfileField
            id="profile-email"
            label="E-mail"
            description="Usado no acesso e nas notificações."
            icon={<Mail className="size-5" aria-hidden="true" />}
            value={form.email}
            error={fieldErrors?.email?.[0]}
            type="email"
            autoComplete="email"
            onChange={(value) => updateField("email", value)}
          />
          <ProfileField
            id="profile-phone"
            label="Telefone"
            description="Opcional, usado para alertas por SMS."
            icon={<Phone className="size-5" aria-hidden="true" />}
            value={form.phone}
            error={fieldErrors?.phone?.[0]}
            type="tel"
            autoComplete="tel"
            maxLength={20}
            onChange={(value) => updateField("phone", value)}
          />
        </section>

        {emailChanged && (
          <Card className="gap-0 border-amber-500/30 bg-amber-500/5">
            <CardContent>
              <label htmlFor="email-password" className="text-sm font-medium">
                Confirme sua senha atual para alterar o e-mail
              </label>
              <Input
                id="email-password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={Boolean(fieldErrors?.currentPassword)}
                aria-describedby="email-password-help"
                value={emailChangePassword}
                onChange={(event) => {
                  setEmailChangePassword(event.target.value);
                  setFieldErrors((current) => ({ ...current, currentPassword: undefined }));
                }}
                className="mt-2 min-h-11 max-w-xl"
              />
              <p id="email-password-help" className="mt-2 text-sm text-muted-foreground">
                O e-mail atual continuará ativo até você confirmar o link enviado ao novo endereço.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || (emailChanged && !emailChangePassword)}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Salvar alterações
          </Button>
        </div>
      </form>

      <Card className="gap-0 overflow-hidden">
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Segurança da conta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Proteja seu acesso e acompanhe os controles de segurança.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handlePasswordChange} className="space-y-4 rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <KeyRound className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold">Alterar senha</h3>
                  <p className="text-sm text-muted-foreground">Use uma senha exclusiva para o InvestHub.</p>
                </div>
              </div>

              <PasswordField
                id="current-password"
                label="Senha atual"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
              />
              <PasswordField
                id="new-password"
                label="Nova senha"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                minLength={8}
                maxLength={100}
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
              />
              <PasswordField
                id="confirm-password"
                label="Confirmar nova senha"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                minLength={8}
                maxLength={100}
                invalid={Boolean(passwordForm.confirmPassword) && passwordForm.confirmPassword !== passwordForm.newPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
              />

              <div className="grid gap-2 text-sm" aria-live="polite">
                <PasswordRequirement met={passwordForm.newPassword.length >= 8}>Mínimo de 8 caracteres</PasswordRequirement>
                <PasswordRequirement met={Boolean(passwordForm.newPassword) && passwordForm.newPassword !== passwordForm.currentPassword}>Diferente da senha atual</PasswordRequirement>
                <PasswordRequirement met={Boolean(passwordForm.confirmPassword) && passwordForm.confirmPassword === passwordForm.newPassword}>As senhas coincidem</PasswordRequirement>
              </div>

              <Button
                type="submit"
                className="min-h-11 w-full sm:w-auto"
                disabled={
                  passwordSaving ||
                  !passwordForm.currentPassword ||
                  passwordForm.newPassword.length < 8 ||
                  passwordForm.currentPassword === passwordForm.newPassword ||
                  passwordForm.confirmPassword !== passwordForm.newPassword
                }
              >
                {passwordSaving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Alterar senha
              </Button>
            </form>

            <div className="space-y-4 rounded-xl border p-5">
              <h3 className="font-semibold">Visão geral</h3>
              <SecurityItem
                title={securityInfo.emailVerified ? "E-mail verificado" : "E-mail ainda não verificado"}
                description={securityInfo.emailVerified ? "Seu e-mail pode ser usado para recuperar o acesso." : "Confirme seu e-mail para reforçar a recuperação da conta."}
                positive={securityInfo.emailVerified}
              />
              <SecurityItem
                title="Alertas de segurança ativos"
                description={`Alterações de senha geram um aviso para ${verifiedEmail}.`}
                positive
              />
              {securityInfo.createdAt && (
                <SecurityItem
                  title="Conta ativa"
                  description={`Criada em ${new Date(securityInfo.createdAt).toLocaleDateString("pt-BR")}.`}
                  positive
                />
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium">Sessão atual</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Encerre o acesso neste navegador quando estiver em um dispositivo compartilhado.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 min-h-11"
                  onClick={() => void signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Encerrar sessão
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-destructive">Zona de perigo</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                A exclusão remove permanentemente perfil, carteira, metas, alertas e preferências.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 sm:shrink-0"
              onClick={() => {
                setDeleteError(null);
                setDeleteForm({ currentPassword: "", confirmation: "" });
                setIsDeleteModalOpen(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir minha conta
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          if (deleting) return;
          setIsDeleteModalOpen(open);
          if (!open) {
            setDeleteError(null);
            setDeleteForm({ currentPassword: "", confirmation: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <DialogTitle>Excluir sua conta?</DialogTitle>
            <DialogDescription>
              Seu usuário, carteira, metas, alertas e preferências serão excluídos permanentemente.
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <PasswordField
              id="delete-current-password"
              label="Senha atual"
              autoComplete="current-password"
              value={deleteForm.currentPassword}
              disabled={deleting}
              onChange={(value) => {
                setDeleteError(null);
                setDeleteForm((current) => ({ ...current, currentPassword: value }));
              }}
            />
            <div>
              <label htmlFor="delete-confirmation" className="text-sm font-medium">
                Digite <span className="font-bold text-destructive">EXCLUIR</span> para confirmar
              </label>
              <Input
                id="delete-confirmation"
                value={deleteForm.confirmation}
                autoComplete="off"
                disabled={deleting}
                onChange={(event) => {
                  setDeleteError(null);
                  setDeleteForm((current) => ({ ...current, confirmation: event.target.value }));
                }}
                className="mt-2 min-h-11"
              />
            </div>
          </div>

          {deleteError && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleting ||
                !deleteForm.currentPassword ||
                deleteForm.confirmation !== "EXCLUIR"
              }
              onClick={() => void handleAccountDelete()}
            >
              {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  maxLength?: number;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function PasswordField({
  id,
  label,
  value,
  autoComplete,
  minLength,
  maxLength,
  invalid = false,
  disabled = false,
  onChange,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={invalid}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 pr-12"
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {invalid && (
        <p role="alert" className="mt-1 text-xs text-destructive">As senhas não coincidem.</p>
      )}
    </div>
  );
}

function PasswordRequirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className={met ? "flex items-center gap-2 text-primary" : "flex items-center gap-2 text-muted-foreground"}>
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function SecurityItem({
  title,
  description,
  positive,
}: {
  title: string;
  description: string;
  positive: boolean;
}) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted/50 p-3">
      {positive ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
      )}
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

type ProfileFieldProps = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  error?: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  maxLength?: number;
  onChange: (value: string) => void;
};

function ProfileField({
  id,
  label,
  description,
  icon,
  value,
  error,
  type = "text",
  autoComplete,
  maxLength,
  onChange,
}: ProfileFieldProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Card className="gap-0">
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <label htmlFor={id} className="text-sm font-medium">{label}</label>
        </div>
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required={id !== "profile-phone"}
          maxLength={maxLength}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
          onChange={(event) => onChange(event.target.value)}
          className="mt-4 min-h-11"
        />
        <p id={descriptionId} className="mt-2 text-xs text-muted-foreground">{description}</p>
        {error && <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

