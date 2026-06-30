import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/src/modules/auth/auth-emails.service";
import { emailSchema } from "@/src/modules/auth/auth.schemas";
import { createEmailVerificationToken } from "@/src/modules/auth/tokens.service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (parsed.success) {
    const allowed = await checkRateLimit({
      scope: "resend-verification",
      identifier: parsed.data.email,
      limit: 3,
      windowSeconds: 15 * 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { message: "Aguarde antes de solicitar um novo link." },
        { status: 429 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (user?.email && !user.emailVerified) {
      try {
        const token = await createEmailVerificationToken(user.id, user.email);
        await sendVerificationEmail(user.email, token);
      } catch (error) {
        console.error("Erro ao reenviar verificação:", error);
      }
    }
  }

  return NextResponse.json({
    message: "Se aplicável, enviaremos um novo link de verificação.",
  });
}
