import { NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";
import { sendLoginOtpEmail } from "@/src/modules/auth/auth-emails.service";
import { emailSchema } from "@/src/modules/auth/auth.schemas";
import { createLoginOtp } from "@/src/modules/auth/login-otp.service";

const genericResponse = {
  message: "Se a conta estiver ativa, enviaremos um código de acesso.",
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(genericResponse);

  const allowed = await checkRateLimit({
    scope: "login-token",
    identifier: parsed.data.email,
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (!allowed) {
    return NextResponse.json(
      { message: "Aguarde antes de solicitar um novo código." },
      { status: 429 }
    );
  }

  try {
    const otp = await createLoginOtp(parsed.data.email);
    if (otp) await sendLoginOtpEmail(otp.email, otp.code);
  } catch (error) {
    console.error("Erro ao enviar token de login:", error);
  }

  return NextResponse.json(genericResponse);
}
