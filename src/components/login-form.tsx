"use client"

import { FormEvent, useState } from "react"
import { EyeIcon, EyeOffIcon, RefreshCwIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import Loading from "@/src/app/components/Loading"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/src/components/ui/input-otp"
import { cn } from "@/src/lib/utils"

type LoginMode = "password" | "token"
type OAuthProvider = "google"

export function LoginForm({
  className,
  notice,
  ...props
}: React.ComponentProps<"div"> & { notice?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState("")
  const [tokenSent, setTokenSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const normalizedEmail = email.trim().toLowerCase()

  const requestToken = async () => {
    if (!normalizedEmail) {
      setError("Informe seu e-mail para receber o código.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        setError(readMessage(data, "Não foi possível enviar o código."))
        return
      }

      setToken("")
      setTokenSent(true)
      toast.success("Código enviado para seu e-mail.")
    } catch {
      setError("Não foi possível enviar o código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const startOAuth = async (provider: OAuthProvider) => {
    setError(null)
    setSocialLoading(provider)

    try {
      const response = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const data = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null

      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? "Não foi possível iniciar o login social.")
      }

      window.location.assign(data.url)
    } catch (oauthError) {
      const message =
        oauthError instanceof Error
          ? oauthError.message
          : "Não foi possível iniciar o login social."
      setError(message)
      toast.error("Login social indisponível", { description: message })
      setSocialLoading(null)
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

    const endpoint =
      mode === "token" ? "/api/auth/login-token/verify" : "/api/auth/login"
    const payload =
      mode === "token"
        ? { email: normalizedEmail, token }
        : { email: normalizedEmail, password }

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch {
      const message = "Não foi possível conectar ao servidor. Tente novamente."
      setError(message)
      toast.error("Não foi possível entrar", { description: message })
      setLoading(false)
      return
    }

    const data = (await response.json().catch(() => null)) as
      | { authenticated?: boolean; error?: string; message?: string }
      | null

    if (!response.ok || !data?.authenticated) {
      const message =
        readMessage(data, null) ??
        (mode === "password"
          ? "E-mail ou senha inválidos."
          : "Código inválido ou expirado. Solicite um novo código.")
      setError(message)
      toast.error("Não foi possível entrar", { description: message })
      setLoading(false)
      return
    }

    toast.success("Login realizado com sucesso.")
    router.replace("/dashboard")
    router.refresh()
  }

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode)
    setError(null)
    setToken("")
    setTokenSent(false)
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
            {mode === "password"
              ? "Entre com seu e-mail e senha"
              : "Receba um código seguro por e-mail"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice && (
            <p
              role="status"
              className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"
            >
              {notice}
            </p>
          )}

          <FieldGroup>
            <Field className="gap-3">
              <Button
                variant="outline"
                type="button"
                disabled={Boolean(socialLoading)}
                className="min-h-11"
                onClick={() => void startOAuth("google")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05h-9.04z" fill="currentColor" />
                </svg>
                {socialLoading === "google" ? "Abrindo Google..." : "Entrar com Google"}
              </Button>
            </Field>

            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Ou continue com
            </FieldSeparator>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
              <Button
                type="button"
                variant={mode === "password" ? "default" : "ghost"}
                className="min-h-10"
                onClick={() => switchMode("password")}
              >
                Senha
              </Button>
              <Button
                type="button"
                variant={mode === "token" ? "default" : "ghost"}
                className="min-h-10"
                onClick={() => switchMode("token")}
              >
                Código
              </Button>
            </div>

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
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                      >
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
                      <FieldLabel htmlFor="otp-verification">
                        Código de verificação
                      </FieldLabel>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        disabled={loading}
                        onClick={() => void requestToken()}
                      >
                        <RefreshCwIcon className={cn(loading && "animate-spin")} />
                        Reenviar
                      </Button>
                    </div>
                    <InputOTP
                      maxLength={8}
                      id="otp-verification"
                      value={token}
                      onChange={setToken}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      disabled={loading}
                      required
                      containerClassName="w-full justify-center gap-1 sm:gap-2"
                    >
                      <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-11 *:data-[slot=input-otp-slot]:w-9 *:data-[slot=input-otp-slot]:text-lg sm:*:data-[slot=input-otp-slot]:h-12 sm:*:data-[slot=input-otp-slot]:w-10 sm:*:data-[slot=input-otp-slot]:text-xl">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator className="mx-0.5 shrink-0 [&_svg]:size-4 sm:mx-1 sm:[&_svg]:size-5" />
                      <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-11 *:data-[slot=input-otp-slot]:w-9 *:data-[slot=input-otp-slot]:text-lg sm:*:data-[slot=input-otp-slot]:h-12 sm:*:data-[slot=input-otp-slot]:w-10 sm:*:data-[slot=input-otp-slot]:text-xl">
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                    <FieldDescription>
                      Enviamos um código para{" "}
                      <span className="font-medium text-foreground">{email}</span>.
                    </FieldDescription>
                  </Field>
                ) : (
                  <FieldDescription>
                    Enviaremos um código de uso único para acessar sua conta sem
                    senha.
                  </FieldDescription>
                )}

                {error && <FieldError>{error}</FieldError>}

                <Field>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !normalizedEmail ||
                      (mode === "password" ? !password : tokenSent && token.length < 6)
                    }
                    className="min-h-11 w-full"
                  >
                    {loading
                      ? "Aguarde..."
                      : mode === "password"
                        ? "Entrar"
                        : tokenSent
                          ? "Validar e entrar"
                          : "Enviar código"}
                  </Button>
                  <FieldDescription className="text-center">
                    Não tem uma conta?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                      Criar conta
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </FieldGroup>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Ao continuar, você concorda com nossos{" "}
        <span className="underline underline-offset-4">Termos de Uso</span> e{" "}
        <span className="underline underline-offset-4">Política de Privacidade</span>.
      </FieldDescription>
    </div>
  )
}

function readMessage(data: unknown, fallback: string | null) {
  if (!data || typeof data !== "object") return fallback
  if ("message" in data && typeof data.message === "string") return data.message
  if ("error" in data && typeof data.error === "string") return data.error
  return fallback
}
