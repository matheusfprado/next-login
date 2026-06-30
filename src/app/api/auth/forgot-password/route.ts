import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/src/modules/auth/auth-emails.service";
import { emailSchema } from "@/src/modules/auth/auth.schemas";
import { createPasswordResetToken } from "@/src/modules/auth/tokens.service";
import { checkRateLimit } from "@/lib/rate-limit";

const genericResponse = {
  message: "Se o e-mail estiver cadastrado, enviaremos as instruções.",
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(genericResponse);

  const allowed = await checkRateLimit({
    scope: "forgot-password",
    identifier: parsed.data.email,
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (!allowed) return NextResponse.json(genericResponse, { status: 429 });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });
  if (!user?.email) return NextResponse.json(genericResponse);

  try {
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, token);
  } catch (error) {
    console.error("Erro ao enviar recuperação de senha:", error);
  }

  return NextResponse.json(genericResponse);
}
