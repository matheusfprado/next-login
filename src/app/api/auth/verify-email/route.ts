import { NextResponse } from "next/server";
import { z } from "zod";

import {
  sendAccountConfirmedEmail,
  sendEmailChangedEmail,
} from "@/src/modules/auth/auth-emails.service";
import { consumeEmailVerificationToken } from "@/src/modules/auth/tokens.service";

const tokenSchema = z.string().trim().min(1).max(2048);

async function verifyToken(tokenValue: string) {
  try {
    const result = await consumeEmailVerificationToken(tokenValue);
    if (!result) return null;

    try {
      if (result.purpose === "EMAIL_CHANGE" && result.previousEmail) {
        await sendEmailChangedEmail(result.previousEmail, result.email);
      } else {
        await sendAccountConfirmedEmail(result.email);
      }
    } catch (error) {
      console.error("Erro ao enviar confirmação da conta:", error);
    }

    return result;
  } catch (error) {
    console.error("Erro ao consumir token de verificação:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const parsed = tokenSchema.safeParse(
    new URL(request.url).searchParams.get("token")
  );
  const result = parsed.success ? await verifyToken(parsed.data) : null;
  if (!result) {
    return NextResponse.json(
      { error: "Token inválido ou expirado." },
      { status: 400 }
    );
  }

  const destination =
    result.purpose === "EMAIL_CHANGE"
      ? "/login?emailChanged=1"
      : "/login?verified=1";
  return NextResponse.redirect(new URL(destination, request.url));
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = z.object({ token: tokenSchema }).safeParse(body);

  const result = parsed.success ? await verifyToken(parsed.data.token) : null;
  if (!result) {
    return NextResponse.json(
      { error: "Token inválido ou expirado." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message:
      result.purpose === "EMAIL_CHANGE"
        ? "Novo e-mail confirmado com sucesso."
        : "E-mail verificado com sucesso.",
  });
}
