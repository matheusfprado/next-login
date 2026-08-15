"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Progress } from "@/src/components/ui/progress";

export function ResetPasswordForm({
  token,
  hasRecoverySession,
}: {
  token: string;
  hasRecoverySession: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = useMemo(
    () => [
      { label: "No mínimo 8 caracteres", met: password.length >= 8 },
      { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
      { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
      { label: "Um número", met: /[0-9]/.test(password) },
      { label: "Um caractere especial", met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const strength = Math.round(
    (requirements.filter((requirement) => requirement.met).length /
      requirements.length) *
      100
  );
  const passwordsMatch =
    Boolean(confirmation) && password.length > 0 && password === confirmation;
  const canSubmit =
    (Boolean(token) || hasRecoverySession) &&
    strength === 100 &&
    passwordsMatch &&
    !loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token && !hasRecoverySession) {
      setError("Link inválido ou expirado. Solicite um novo e-mail.");
      return;
    }

    if (strength < 100) {
      setError("A nova senha ainda não atende aos requisitos de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        router.replace("/login?reset=1");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Não foi possível redefinir a senha.");
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/80 bg-card shadow-xl">
      <CardHeader className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">
            Crie uma nova senha
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            Use uma senha forte para proteger sua carteira e integrações.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {!token && !hasRecoverySession ? (
          <div className="space-y-5">
            <div
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
            >
              Este link de redefinição está inválido ou expirou.
            </div>
            <Button asChild className="min-h-11 w-full">
              <Link href="/forgot-password">Solicitar novo link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <PasswordInput
              id="new-password"
              label="Nova senha"
              value={password}
              visible={showPassword}
              autoComplete="new-password"
              onVisibleChange={() => setShowPassword((visible) => !visible)}
              onChange={setPassword}
            />

            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  Força da senha
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {strength}%
                </span>
              </div>
              <Progress value={strength} aria-label="Força da senha" />
              <ul className="grid gap-2 text-sm" aria-live="polite">
                {requirements.map((requirement) => (
                  <li
                    key={requirement.label}
                    className={
                      requirement.met
                        ? "flex items-center gap-2 text-primary"
                        : "flex items-center gap-2 text-muted-foreground"
                    }
                  >
                    {requirement.met ? (
                      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>{requirement.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PasswordInput
              id="confirm-password"
              label="Confirmar senha"
              value={confirmation}
              visible={showConfirmation}
              autoComplete="new-password"
              invalid={Boolean(confirmation) && !passwordsMatch}
              onVisibleChange={() =>
                setShowConfirmation((visible) => !visible)
              }
              onChange={setConfirmation}
            />

            {confirmation && (
              <p
                className={
                  passwordsMatch
                    ? "flex items-center gap-2 text-sm text-primary"
                    : "flex items-center gap-2 text-sm text-destructive"
                }
                role={passwordsMatch ? "status" : "alert"}
              >
                {passwordsMatch ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4" aria-hidden="true" />
                )}
                {passwordsMatch ? "As senhas coincidem." : "As senhas não coincidem."}
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              aria-busy={loading}
              className="min-h-11 w-full"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-4" aria-hidden="true" />
              )}
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>

            <Button asChild variant="link" className="min-h-11 w-full">
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete: "new-password";
  invalid?: boolean;
  onVisibleChange: () => void;
  onChange: (value: string) => void;
};

function PasswordInput({
  id,
  label,
  value,
  visible,
  autoComplete,
  invalid = false,
  onVisibleChange,
  onChange,
}: PasswordInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={8}
          required
          value={value}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 pr-12"
        />
        <button
          type="button"
          aria-label={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          aria-pressed={visible}
          onClick={onVisibleChange}
          className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden="true" />
          ) : (
            <Eye className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
