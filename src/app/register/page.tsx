"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hash } from "bcryptjs";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    const hashedPassword = await hash(password, 10);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: hashedPassword }),
    });

    setLoading(false);

    if (res.ok) router.push("/login");
    else alert("Erro ao cadastrar usuário");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent mb-10">
            InvestHub
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Crie sua conta para acessar o painel
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-gray-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl bg-black px-4 py-2 text-white font-medium shadow-sm transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Já possui conta?{" "}
          <Link
            href="/login"
            className="font-medium text-gray-900 dark:text-gray-100 underline underline-offset-4 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}
