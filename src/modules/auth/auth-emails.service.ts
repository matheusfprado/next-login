import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function sendVerificationEmail(email: string, token: string) {
  const url = new URL("/api/auth/verify-email", env.nextAuthUrl());
  url.searchParams.set("token", token);
  await sendEmail({
    to: email,
    subject: "Confirme seu e-mail no InvestHub",
    text: `Confirme seu e-mail acessando: ${url.toString()}`,
    html: `<p>Confirme seu e-mail no InvestHub:</p><p><a href="${url.toString()}">Verificar e-mail</a></p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = new URL("/reset-password", env.nextAuthUrl());
  url.searchParams.set("token", token);
  await sendEmail({
    to: email,
    subject: "Redefinição de senha InvestHub",
    text: `Redefina sua senha acessando: ${url.toString()}`,
    html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${url.toString()}">Redefinir senha</a></p><p>O link expira em uma hora.</p>`,
  });
}

export async function sendAccountConfirmedEmail(email: string) {
  await sendEmail({
    to: email,
    subject: "Conta confirmada no InvestHub",
    text: "Seu e-mail foi confirmado e sua conta já está ativa.",
    html: "<p>Seu e-mail foi confirmado e sua conta já está ativa.</p>",
  });
}

export async function sendEmailChangeVerificationEmail(
  email: string,
  token: string
) {
  const url = new URL("/api/auth/verify-email", env.nextAuthUrl());
  url.searchParams.set("token", token);
  await sendEmail({
    to: email,
    subject: "Confirme seu novo e-mail no InvestHub",
    text: `Confirme o novo e-mail acessando: ${url.toString()}`,
    html: `<p>Confirme o novo e-mail da sua conta:</p><p><a href="${url.toString()}">Confirmar novo e-mail</a></p><p>O link expira em 24 horas.</p>`,
  });
}

export async function sendEmailChangeRequestedEmail(
  currentEmail: string,
  newEmail: string
) {
  await sendEmail({
    to: currentEmail,
    subject: "Alteração de e-mail solicitada no InvestHub",
    text: `Foi solicitada a alteração do e-mail da sua conta para ${newEmail}. Se não foi você, troque sua senha imediatamente.`,
  });
}

export async function sendEmailChangedEmail(
  previousEmail: string,
  newEmail: string
) {
  const message = `O e-mail da sua conta InvestHub foi alterado de ${previousEmail} para ${newEmail}. Se não foi você, entre em contato com o suporte imediatamente.`;
  await Promise.all([
    sendEmail({
      to: previousEmail,
      subject: "E-mail alterado no InvestHub",
      text: message,
    }),
    sendEmail({
      to: newEmail,
      subject: "Novo e-mail confirmado no InvestHub",
      text: message,
    }),
  ]);
}

export async function sendPasswordChangedEmail(email: string) {
  await sendEmail({
    to: email,
    subject: "Senha alterada no InvestHub",
    text: "A senha da sua conta foi alterada. Se não foi você, solicite imediatamente uma recuperação de senha.",
  });
}

export async function sendNewLoginEmail(email: string) {
  await sendEmail({
    to: email,
    subject: "Novo login no InvestHub",
    text: `Detectamos um novo login na sua conta em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Se não foi você, troque sua senha imediatamente.`,
  });
}

export async function sendLoginOtpEmail(email: string, code: string) {
  await sendEmail({
    to: email,
    subject: "Seu código de acesso InvestHub",
    text: `Seu código de acesso é ${code}. Ele expira em 10 minutos e pode ser usado uma única vez.`,
    html: `<p>Use o código abaixo para acessar sua conta:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>Ele expira em 10 minutos e pode ser usado uma única vez.</p>`,
  });
}
