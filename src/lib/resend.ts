import { Resend } from "resend";

import ResetPassword from "@/src/emails/ResetPassword";
import VerifyEmail from "@/src/emails/VerifyEmail";
import WelcomeEmail from "@/src/emails/WelcomeEmail";

interface SendVerifyEmailParams {
  to: string;
  name: string;
  verificationUrl: string;
}

interface SendResetPasswordEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY e EMAIL_FROM devem estar configuradas.");
  }

  return { from, resend: new Resend(apiKey) };
}

async function assertEmailSent(
  result: Awaited<ReturnType<Resend["emails"]["send"]>>
) {
  if (result.error) {
    throw new Error(`Falha ao enviar email: ${result.error.message}`);
  }

  return result.data;
}

export async function sendVerifyEmail({
  to,
  name,
  verificationUrl,
}: SendVerifyEmailParams) {
  const { from, resend } = getEmailClient();
  const result = await resend.emails.send({
    from,
    to,
    subject: "Confirme seu email no InvestHub",
    react: VerifyEmail({ name, verificationUrl }),
  });

  return assertEmailSent(result);
}

export async function sendResetPasswordEmail({
  to,
  name,
  resetUrl,
}: SendResetPasswordEmailParams) {
  const { from, resend } = getEmailClient();
  const result = await resend.emails.send({
    from,
    to,
    subject: "Redefinição de senha InvestHub",
    react: ResetPassword({ name, resetUrl }),
  });

  return assertEmailSent(result);
}

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams) {
  const { from, resend } = getEmailClient();
  const result = await resend.emails.send({
    from,
    to,
    subject: "Boas-vindas ao InvestHub",
    react: WelcomeEmail({ name }),
  });

  return assertEmailSent(result);
}
