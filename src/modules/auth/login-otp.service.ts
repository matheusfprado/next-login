import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 5;

function emailKey(email: string) {
  return createHmac("sha256", env.nextAuthSecret())
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function hashCode(code: string) {
  return createHmac("sha256", env.nextAuthSecret()).update(code).digest("hex");
}

function matchesCode(code: string, expectedHash: string) {
  const received = Buffer.from(hashCode(code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function createLoginOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user?.email || !user.emailVerified) return null;

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const key = emailKey(normalizedEmail);
  const redis = await getRedis();
  await redis.set(`login-otp:${key}`, hashCode(code), { EX: OTP_TTL_SECONDS });
  await redis.del(`login-otp-attempts:${key}`);

  return { code, email: user.email };
}

export async function consumeLoginOtp(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const key = emailKey(normalizedEmail);
  const redis = await getRedis();
  const attemptsKey = `login-otp-attempts:${key}`;
  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) await redis.expire(attemptsKey, OTP_TTL_SECONDS);
  if (attempts > OTP_MAX_ATTEMPTS) {
    await redis.del(`login-otp:${key}`);
    return null;
  }

  const otpKey = `login-otp:${key}`;
  const expectedHash = await redis.get(otpKey);
  if (!expectedHash || !matchesCode(code, expectedHash)) return null;

  const claimedHash = await redis.getDel(otpKey);
  if (claimedHash !== expectedHash) return null;
  await redis.del(attemptsKey);

  return prisma.user.findFirst({
    where: { email: normalizedEmail, emailVerified: { not: null } },
    select: { id: true, name: true, email: true },
  });
}
