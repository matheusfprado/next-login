"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hash } from "bcryptjs";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputField } from "@/src/app/login/components/InputField";
import { PasswordStrength } from "./components/PasswordStrength";
import { Button } from "@/src/app/components/Button";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../components/Loading";

const registerSchema = z.object({
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

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [transition, setTransition] = useState(false);

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const { handleSubmit } = methods;

  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);
    setTransition(true);

    const hashedPassword = await hash(data.password, 10);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: hashedPassword }),
    });

    if (res.ok) router.push("/login");
    else {
      alert("Erro ao cadastrar usuário");
      setTransition(false);
      setLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    setTransition(true);
    setLoading(true);
    setTimeout(() => router.push(path), 500);
  };

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
                  Crie sua conta para acessar o painel
                </p>
              </div>
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(handleRegister)}
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
                  <PasswordStrength password={methods.watch("password")} />
                  <Button type="submit" variant="primary" loading={loading}>
                    Cadastrar
                  </Button>
                </form>
              </FormProvider>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                Já possui conta?{" "}
                <span
                  onClick={() => handleNavigation("/login")}
                  className="font-medium text-emerald-500 dark:text-gray-100 underline underline-offset-4 hover:text-emerald-700 dark:hover:text-gray-300 cursor-pointer transition-all duration-300"
                >
                  Faça login
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
