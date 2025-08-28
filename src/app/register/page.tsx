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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-10 tracking-tight">
        InvestHub
      </h1>
      <div className="flex flex-col gap-5 w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-4 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-4 rounded-xl border border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-sm"
        />
        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-md transition transform hover:scale-105"
        >
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-800 text-center font-medium transition mt-2"
        >
          Já possui conta? Faça login
        </Link>
      </div>
    </div>
  );
}
