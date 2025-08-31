"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { sendOTP } from "@/src/app/services/auth";

export default function PhoneLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleSendCode = async () => {
    setLoading(true);
    setMessage("");
    const data = await sendOTP(phone);

    if (data.success) {
      setStep("code");
      setMessage("📩 Código enviado! Verifique seu SMS.");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else {
      setMessage(data.error || "Erro ao enviar SMS");
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setMessage("");
    const otp = code.join("");
    const result = await signIn("otp-phone", {
      redirect: false,
      phone,
      code: otp,
    });

    if (result?.ok) {
      setMessage("✅ Login bem-sucedido!");
      router.replace("/dashboard");
    } else {
      setMessage(result?.error || "Código inválido");
    }
    setLoading(false);
  };

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent mb-10">
            InvestHub
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {step === "phone"
              ? "Entre com seu telefone para receber o código"
              : "Digite o código de 6 dígitos enviado por SMS"}
          </p>
        </div>

        {step === "phone" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+55 11 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              className={`w-full rounded-xl bg-black px-4 py-2 text-white font-medium shadow-sm transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Enviando..." : "Enviar Código"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Código
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-10 h-12 text-center rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={loading || code.some((d) => !d)}
              className={`w-full rounded-xl bg-black px-4 py-2 text-white font-medium shadow-sm transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                loading || code.some((d) => !d)
                  ? "opacity-70 cursor-not-allowed"
                  : ""
              }`}
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </div>
        )}

        {message && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}

        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-xl bg-gray-200 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-gray-100 font-medium shadow-sm transition hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Voltar para login tradicional
        </button>
      </div>
    </div>
  );
}
