import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { twilioClient } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    console.log("Telefone recebido:", phone);

    if (!phone) {
      return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: normalizedPhone, channel: "sms" });

    console.log("Resposta Twilio:", verification);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Erro Twilio:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("Erro Twilio desconhecido:", err);
    return NextResponse.json({ error: "Falha ao enviar SMS" }, { status: 500 });
  }
}
