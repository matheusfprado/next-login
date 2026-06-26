"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";

import Loading from "../components/Loading";
import { InputField } from "@/src/app/login/components/InputField";
import { useToast } from "@/src/components/ui/toast";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Informe seu email" })
    .email({ message: "Informe um email valido" }),
  password: z
    .string()
    .min(1, { message: "Informe sua senha" })
    .min(6, { message: "A senha precisa ter pelo menos 6 caracteres" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleLogin = async (data: LoginFormData) => {
    setIsLoggingIn(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: data.email.trim(),
      password: data.password,
    });

    if (result?.error) {
      toast({
        title: "Não foi possível entrar",
        description: "Confira o email e a senha e tente novamente.",
        variant: "destructive",
      });
      setIsLoggingIn(false);
      return;
    }

    if (!result?.ok) {
      toast({
        title: "Login não concluido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      setIsLoggingIn(false);
      return;
    }

    toast({
      title: "Login realizado",
      description: "Redirecionando para o painel.",
    });
    router.replace("/dashboard");
  };

  const handleInvalidSubmit = () => {
    toast({
      title: "Revise os campos",
      description: "Preencha email e senha corretamente.",
      variant: "destructive",
    });
  };

  if (status === "loading" || isLoggingIn) {
    return <Loading label={isLoggingIn ? "Entrando..." : undefined} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <AnimatePresence>
        <motion.div
          key="login-card"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto w-full max-w-[448px]"
        >
          <div className="space-y-7 rounded-[22px] border border-gray-200 bg-white p-10 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            <div className="text-center">
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-emerald-500">
                InvestHub
              </h1>
              <p className="mt-2 text-base text-gray-700">
                Entre com sua conta para acessar o painel.
              </p>
            </div>

            <div className="space-y-6">
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(handleLogin, handleInvalidSubmit)}
                  className="space-y-5"
                  noValidate
                >
                  <InputField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="seu@email.com"
                  />
                  <InputField
                    name="password"
                    label="Senha"
                    type="password"
                    placeholder="••••••"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-10 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-bold text-white shadow-md transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-70"
                  >
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              </FormProvider>

              <button
                type="button"
                disabled
                className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white opacity-60 shadow-md"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Entrar com Telefone
              </button>

              <p className="text-center text-sm text-gray-600">
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="cursor-pointer font-medium text-emerald-500 underline underline-offset-4 transition-all duration-300 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
