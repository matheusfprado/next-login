import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase";
import { resetPasswordSchema } from "@/src/modules/auth/auth.schemas";
import { sendPasswordChangedEmail } from "@/src/modules/auth/auth-emails.service";

export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    parsed.data.token
  );
  if (exchangeError) {
    return NextResponse.json(
      { error: "Token invalido ou expirado." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel redefinir a senha." },
      { status: 400 }
    );
  }

  if (data.user.email) {
    try {
      await sendPasswordChangedEmail(data.user.email);
    } catch (error) {
      console.error("Erro ao enviar alerta de alteracao de senha:", error);
    }
  }

  return NextResponse.json({ success: true });
}
