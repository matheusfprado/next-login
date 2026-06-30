import Brand from "@/src/app/components/Brand"
import { LoginForm } from "@/src/components/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    registered?: string
    verified?: string
    emailChanged?: string
  }>
}) {
  const params = await searchParams
  const notice = params.registered
    ? "Conta criada. Confirme seu e-mail antes de entrar."
    : params.verified
      ? "E-mail confirmado. Sua conta já está ativa."
      : params.emailChanged
        ? "Novo e-mail confirmado. Entre novamente para continuar."
        : undefined

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-7 bg-background p-6 text-foreground dark:bg-black md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="self-center"><Brand compact /></div>
        <LoginForm notice={notice} />
      </div>
    </div>
  )
}
