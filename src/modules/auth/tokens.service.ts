import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export type EmailVerificationPurpose =
  | "ACCOUNT_VERIFICATION"
  | "EMAIL_CHANGE";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerificationToken(
  userId: string,
  email: string,
  purpose: EmailVerificationPurpose = "ACCOUNT_VERIFICATION"
) {
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId, purpose, usedAt: null },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        email,
        purpose,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    }),
  ]);

  return token;
}

export async function consumeEmailVerificationToken(token: string) {
  const now = new Date();
  const verification = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: { select: { email: true } } },
  });
  if (!verification) return null;

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.emailVerificationToken.updateMany({
      where: { id: verification.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count === 0) return null;

    if (verification.purpose === "EMAIL_CHANGE") {
      const updated = await transaction.user.updateMany({
        where: { id: verification.userId, email: verification.user.email },
        data: { email: verification.email, emailVerified: now },
      });
      if (updated.count === 0) throw new Error("E-mail da conta foi alterado.");
    } else {
      const updated = await transaction.user.updateMany({
        where: { id: verification.userId, email: verification.email },
        data: { emailVerified: now },
      });
      if (updated.count === 0) throw new Error("E-mail da conta não confere.");
    }

    return {
      userId: verification.userId,
      email: verification.email,
      previousEmail: verification.user.email,
      purpose: verification.purpose,
    };
  });
}

export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    }),
  ]);

  return token;
}
