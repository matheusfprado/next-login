"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputField } from "@/src/app/login/components/InputField";
import { Button } from "@/src/app/components/Button";
import Loading from "../components/Loading";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z
    .string()
    .nonempty({ message: "O email é obrigatório" })
    .email({ message: "Email inválido" }),
  password: z
    .string()
    .nonempty({ message: "A senha é obrigatória" })
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" })
    .max(20, { message: "Senha deve ter no máximo 20 caracteres" })
    .regex(/[A-Z]/, {
      message: "Senha deve conter ao menos uma letra maiúscula",
    })
    .regex(/[a-z]/, {
      message: "Senha deve conter ao menos uma letra minúscula",
    })
    .regex(/[0-9]/, { message: "Senha deve conter ao menos um número" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Senha deve conter ao menos um caractere especial",
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transition, setTransition] = useState(false);

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const { handleSubmit } = methods;

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setTransition(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      alert("Falha no login: email ou senha incorretos");
      setTransition(false);
      setLoading(false);
    } else if (result?.ok) {
      router.replace("/dashboard");
    }
  };

  const handleNavigation = (path: string) => {
    setTransition(true);
    setLoading(true);
    setTimeout(() => router.push(path), 500);
  };

  if (status === "loading") return <Loading />;

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
          <AnimatePresence>
            <motion.div
              key={transition ? "card-transition" : "card"}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 mx-auto w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl p-10 space-y-6"
            >
              <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent mb-2">
                  InvestHub
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Entre com sua conta para acessar o painel
                </p>
              </div>
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(handleLogin)}
                  className="space-y-5"
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
                  <Button type="submit" variant="primary">
                    Entrar
                  </Button>
                </form>
              </FormProvider>
              <Button
                variant="secondary"
                onClick={() => handleNavigation("/login-phone")}
              >
                Entrar com Telefone
              </Button>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                Não tem conta?{" "}
                <span
                  onClick={() => handleNavigation("/register")}
                  className="font-medium text-emerald-500 dark:text-gray-100 underline underline-offset-4 hover:text-emerald-700 dark:hover:text-gray-300 cursor-pointer transition-all duration-300"
                >
                  Cadastre-se
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
