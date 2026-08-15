import { ShieldCheck } from "lucide-react";

import Brand from "../components/Brand";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token?: string; verified?: string }>;
}) {
  const { code, token, verified } = await searchParams;
  const resetToken = code ?? token ?? "";
  const hasRecoverySession = verified === "1";

  return (
    <main className="min-h-dvh bg-muted">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,440px)] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-8">
            <Brand subtitle="Segurança da conta" />
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Recuperação segura
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Proteja sua conta antes de voltar ao dashboard.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Sua nova senha libera o acesso à carteira, alertas e integrações
                conectadas ao InvestHub.
              </p>
            </div>
            <div className="grid max-w-lg gap-3">
              {[
                "Use uma senha exclusiva para o InvestHub.",
                "Evite reutilizar senhas de e-mail ou corretoras.",
                "Após salvar, entre novamente para acessar sua conta.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-lg border bg-background/70 p-4 text-sm text-muted-foreground"
                >
                  <ShieldCheck
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md space-y-6">
          <div className="flex justify-center lg:hidden">
            <Brand subtitle="Segurança da conta" />
          </div>
          <ResetPasswordForm token={resetToken} hasRecoverySession={hasRecoverySession} />
        </section>
      </div>
    </main>
  );
}
