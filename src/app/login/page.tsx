"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import FloatingInput from "@/src/app/components/common/FloatingInput";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redireciona se já estiver logado
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      alert("Falha no login: email ou senha incorretos");
    } else {
      router.replace("/dashboard");
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPassword(e.target.value);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-10 tracking-tight">
        InvestHub
      </h1>
      <div className="flex flex-col gap-5 w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 w-full max-w-md"
        >
          <FloatingInput
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            validate="email"
          />

          <FloatingInput
            label="Senha"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            validate="password"
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
             className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-md transition transform hover:scale-105"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <Link
          href="/register"
          className="text-blue-600 hover:text-blue-800 text-center font-medium transition mt-2"
        >
          Não tem conta? Cadastre-se
        </Link>
      </div>
    </div>
  );
}
