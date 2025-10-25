// /app/api/auth/phone/verify/route.ts
import { NextResponse } from "next/server";

import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { twilioClient } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Telefone e código são obrigatórios" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    console.log("Verificando código:", code, "para:", normalizedPhone);

    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: normalizedPhone, code });

    console.log("Twilio resposta verify:", verificationCheck);

    if (verificationCheck.status !== "approved") {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // Cria ou busca usuário no banco
    let user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone },
      });
    }

    // Retorna sucesso e dados do usuário
    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro Twilio verify:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("Erro desconhecido verify:", err);
    return NextResponse.json({ error: "Falha na verificação" }, { status: 500 });
  }
}
