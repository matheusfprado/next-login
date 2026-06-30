"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Brand from "../components/Brand";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Textarea } from "@/src/components/ui/textarea";

function getResponseMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") return data.error;
  return fallback;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleTokenSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTokenError(null);
    setTokenLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setTokenError(getResponseMessage(data, "Não foi possível validar o token."));
        return;
      }
      router.replace("/login?verified=1");
    } catch {
      setTokenError("Não foi possível validar o token. Tente novamente.");
    } finally {
      setTokenLoading(false);
    }
  };

  const handleResendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendMessage(null);
    setResendLoading(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: unknown = await response.json().catch(() => null);
      setResendMessage(getResponseMessage(data, "Verifique sua caixa de entrada."));
    } catch {
      setResendMessage("Não foi possível reenviar agora. Tente novamente.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center"><Brand /></div>
          <CardTitle className="mt-2 text-2xl">Verificar e-mail</CardTitle>
          <CardDescription className="leading-6">Cole abaixo o token recebido no e-mail para ativar sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-7">
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-token">Token de verificação</Label>
              <Textarea id="verification-token" name="token" value={token} onChange={(event) => setToken(event.target.value)} rows={4} required autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="token-help token-error" className="min-h-28 resize-y font-mono text-xs" placeholder="Cole o token completo aqui" />
              <p id="token-help" className="text-xs leading-5 text-muted-foreground">O token expira 24 horas após a emissão.</p>
              {tokenError && <p id="token-error" role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{tokenError}</p>}
            </div>
            <Button type="submit" disabled={tokenLoading || token.trim().length === 0} className="min-h-11 w-full bg-gray-950 text-white hover:bg-gray-800">
              {tokenLoading ? "Validando..." : "Validar token"}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Não recebeu?</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleResendSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-email">E-mail</Label>
              <Input id="verification-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11" placeholder="seu@email.com" />
            </div>
            {resendMessage && <p role="status" aria-live="polite" className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-emerald-800">{resendMessage}</p>}
            <Button type="submit" disabled={resendLoading} className="min-h-11 w-full">
              {resendLoading ? "Enviando..." : "Reenviar token"}
            </Button>
          </form>

          <Button asChild variant="link" className="w-full text-emerald-700"><Link href="/login">Voltar ao login</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
