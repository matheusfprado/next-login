// /app/api/auth/phone/verify/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Telefone e código são obrigatórios" },
        { status: 400 }
      );
    }

    // Normaliza número para E.164
    const cleanPhone = phone.replace(/\D/g, "");
    const e164Phone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

    console.log("Verificando código:", code, "para:", e164Phone);

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: e164Phone, code });

    console.log("Twilio resposta verify:", verificationCheck);

    if (verificationCheck.status !== "approved") {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // Cria ou busca usuário no banco
    let user = await prisma.user.findFirst({
      where: { phone: e164Phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phone: e164Phone },
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
