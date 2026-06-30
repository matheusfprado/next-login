"use client"

import { FormEvent, useState } from "react"
import { EyeIcon, EyeOffIcon, RefreshCwIcon } from "lucide-react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"
import Loading from "@/src/app/components/Loading"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/src/components/ui/input-otp"

type LoginMode = "password" | "token"

export function LoginForm({
  className,
  notice,
  ...props
}: React.ComponentProps<"div"> & { notice?: string }) {
  const router = useRouter()
  const [mode] = useState<LoginMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState("")
  const [tokenSent, setTokenSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestToken = async () => {
    if (!email.trim()) {
      setError("Informe seu e-mail para receber o código.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/login-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        setError(readMessage(data, "Não foi possível enviar o código."))
        return
      }
      setToken("")
      setTokenSent(true)
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (mode === "token" && !tokenSent) {
      await requestToken()
      return
    }

    setLoading(true)
    const result = await signIn(mode === "password" ? "credentials" : "email-token", {
      redirect: false,
      email: email.trim().toLowerCase(),
      ...(mode === "password" ? { password } : { token }),
    })

    if (!result?.ok) {
      const message = mode === "password"
        ? "E-mail ou senha inválidos."
        : "Código inválido ou expirado. Solicite um novo código."
      setError(message)
      toast.error("Não foi possível entrar", { description: message })
      setLoading(false)
      return
    }

    toast.success("Login realizado com sucesso.")
    router.replace("/dashboard")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50">
        <Loading label="Carregando seu dashboard..." />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <Card className="border-border bg-card text-card-foreground shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
          <CardDescription>
            Entre com seu e-mail e senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice && (
            <p role="status" className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              {notice}
            </p>
          )}

          <FieldGroup>
            <Field className="gap-3">
              <Button
                variant="outline"
                type="button"
                disabled
                className="min-h-11"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09zM15.53 3.83C16.37 2.82 16.93 1.4 16.77 0c-1.21.05-2.66.81-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.72-.69 3.56-1.7" fill="currentColor" />
                </svg>
                Entrar com Apple
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled
                className="min-h-11"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05h-9.04z" fill="currentColor" />
                </svg>
                Entrar com Google
              </Button>
            </Field>

            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Ou continue com
            </FieldSeparator>

            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
                  <Input
                    id="login-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loading || (mode === "token" && tokenSent)}
                    required
                    className="min-h-11"
                  />
                </Field>

                {mode === "password" ? (
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                      <Link href="/forgot-password" className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
                        Esqueceu sua senha?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={loading}
                        required
                        className="min-h-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        disabled={loading}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="size-5" aria-hidden="true" />
                        ) : (
                          <EyeIcon className="size-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </Field>
                ) : tokenSent ? (
                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel htmlFor="otp-verification">Código de verificação</FieldLabel>
                      <Button variant="outline" size="sm" type="button" disabled={loading} onClick={() => void requestToken()} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                        <RefreshCwIcon className={cn(loading && "animate-spin")} />
                        Reenviar
                      </Button>
                    </div>
                    <InputOTP maxLength={6} id="otp-verification" value={token} onChange={setToken} inputMode="numeric" autoComplete="one-time-code" disabled={loading} required containerClassName="justify-center">
                      <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:border-white/20 *:data-[slot=input-otp-slot]:bg-white/5 *:data-[slot=input-otp-slot]:text-xl sm:*:data-[slot=input-otp-slot]:w-11">
                        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator className="mx-1 sm:mx-2" />
                      <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:border-white/20 *:data-[slot=input-otp-slot]:bg-white/5 *:data-[slot=input-otp-slot]:text-xl sm:*:data-[slot=input-otp-slot]:w-11">
                        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <FieldDescription>Enviamos um código para <span className="font-medium text-white">{email}</span>.</FieldDescription>
                  </Field>
                ) : (
                  <FieldDescription>Enviaremos um código de uso único válido por 10 minutos.</FieldDescription>
                )}

                {error && <FieldError>{error}</FieldError>}

                <Field>
                  <Button type="submit" disabled={loading || !email.trim() || (mode === "password" ? !password : tokenSent && token.length !== 6)} className="min-h-11 w-full">
                    {loading ? "Aguarde..." : mode === "password" ? "Entrar" : tokenSent ? "Validar e entrar" : "Enviar código"}
                  </Button>
                  <FieldDescription className="text-center">
                    Não tem uma conta? <Link href="/register" className="text-primary hover:underline">Criar conta</Link>
                  </FieldDescription>
                  <button type="button" disabled className="mx-auto cursor-not-allowed text-sm text-muted-foreground opacity-50">
                    Entrar com token (em breve)
                  </button>
                </Field>
              </FieldGroup>
            </form>
          </FieldGroup>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Ao continuar, você concorda com nossos <span className="underline underline-offset-4">Termos de Uso</span> e <span className="underline underline-offset-4">Política de Privacidade</span>.
      </FieldDescription>
    </div>
  )
}

function readMessage(data: unknown, fallback: string) {
  return data && typeof data === "object" && "message" in data && typeof data.message === "string"
    ? data.message
    : fallback
}
