"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { sendOTP, verifyOTP } from "@/src/app/services/auth";

export default function PhoneLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [message, setMessage] = useState("");

  const handleSendCode = async () => {
    setMessage("");
    const data = await sendOTP(phone);

    if (data.success) {
      setStep("code");
      setMessage("Código enviado! Verifique seu SMS.");
    } else {
      setMessage(data.error || "Erro ao enviar SMS");
    }
  };

  const handleVerifyCode = async () => {
    setMessage("");
    const result = await signIn("otp-phone", {
      redirect: false,
      phone,
      code,
    });

    if (result?.ok) {
      setMessage("✅ Login bem-sucedido!");
      router.replace("/dashboard");
    } else {
      setMessage(result?.error || "Código inválido");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-6 w-96 flex flex-col">
        <h2 className="text-xl font-semibold mb-4 text-center">Login por Telefone</h2>

        {step === "phone" ? (
          <>
            <input
              type="tel"
              placeholder="+55 11 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border w-full p-2 rounded mb-4"
            />
            <button
              onClick={handleSendCode}
              className="w-full bg-blue-600 text-white p-2 rounded mb-2"
            >
              Enviar Código
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Digite o código recebido"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border w-full p-2 rounded mb-4"
            />
            <button
              onClick={handleVerifyCode}
              className="w-full bg-green-600 text-white p-2 rounded mb-2"
            >
              Verificar
            </button>
          </>
        )}

        {message && (
          <p className="text-sm text-blue-500 mt-2 text-center">{message}</p>
        )}

        <button
          onClick={() => router.push("/login")}
          className="w-full mt-6 bg-gray-200 text-gray-800 p-2 rounded hover:bg-gray-300 transition"
        >
          Voltar para login tradicional
        </button>
      </div>
    </div>
  );
}
