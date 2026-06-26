"use client";

import { useRouter } from "next/navigation";

export default function PhoneLoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-[22px] border border-gray-200 bg-white p-10 text-center shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-950">
            Login por telefone indisponivel
          </h1>
          <p className="text-sm text-gray-600">
            Esta forma de acesso esta temporariamente bloqueada.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="h-10 w-full rounded-xl bg-black px-4 text-sm font-bold text-white shadow-md transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          Voltar para login
        </button>
      </div>
    </div>
  );
}
