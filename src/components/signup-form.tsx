"use client"

import { FormEvent, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PasswordStrength } from "@/src/app/register/components/PasswordStrength"
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
} from "@/src/components/ui/field"
import { Input } from "@/src/components/ui/input"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmation) {
      const message = "As senhas não coincidem."
      setError(message)
      toast.error(message)
      return
    }
    if (!isStrongPassword(password)) {
      const message = "A senha precisa atender a todos os requisitos."
      setError(message)
      toast.error(message)
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message = readError(data)
        setError(message)
        toast.error("Não foi possível criar a conta", { description: message })
        return
      }

      toast.success("Conta criada com sucesso.")
      router.push("/login?registered=1")
    } catch {
      const message = "Não foi possível criar sua conta. Tente novamente."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crie sua conta</CardTitle>
          <CardDescription>
            Preencha seus dados para começar a acompanhar seus investimentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="signup-name">Nome completo</FieldLabel>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={loading}
                  minLength={2}
                  required
                  className="min-h-11"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-email">E-mail</FieldLabel>
                <Input
                  id="signup-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                  className="min-h-11"
                />
              </Field>
              <Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="signup-password">Senha</FieldLabel>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={loading}
                        minLength={8}
                        required
                        className="min-h-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                      </button>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="signup-confirm-password">
                      Confirmar senha
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmation ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        disabled={loading}
                        minLength={8}
                        required
                        className="min-h-11 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmation((visible) => !visible)}
                        aria-label={showConfirmation ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                        className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmation ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                      </button>
                    </div>
                  </Field>
                </div>
                <PasswordStrength password={password} />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Field>
                <Button
                  type="submit"
                  className="min-h-11 w-full"
                  disabled={
                    loading ||
                    name.trim().length < 2 ||
                    !email.trim() ||
                    !password ||
                    !confirmation
                  }
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
                <FieldDescription className="text-center">
                  Já tem uma conta? <Link href="/login">Entrar</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Ao criar sua conta, você concorda com os termos de uso e a política de privacidade.
      </FieldDescription>
    </div>
  )
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function readError(data: unknown) {
  return data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
    ? data.error
    : "Não foi possível criar sua conta."
}
