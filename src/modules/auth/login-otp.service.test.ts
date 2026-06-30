import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const state: { value: string | null; attempts: number } = {
    value: null,
    attempts: 0,
  }
  return {
    state,
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    redis: {
      set: vi.fn(async (_key: string, value: string) => {
        state.value = value
        return "OK"
      }),
      get: vi.fn(async () => state.value),
      getDel: vi.fn(async () => {
        const value = state.value
        state.value = null
        return value
      }),
      incr: vi.fn(async () => {
        state.attempts += 1
        return state.attempts
      }),
      expire: vi.fn(async () => true),
      del: vi.fn(async (key: string) => {
        if (key.startsWith("login-otp:")) state.value = null
        if (key.startsWith("login-otp-attempts:")) state.attempts = 0
        return 1
      }),
    },
  }
})

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
    },
  },
}))

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(async () => mocks.redis),
}))

import {
  consumeLoginOtp,
  createLoginOtp,
} from "@/src/modules/auth/login-otp.service"

describe("login por OTP", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXTAUTH_SECRET", "test-secret-with-enough-entropy")
    mocks.state.value = null
    mocks.state.attempts = 0
    mocks.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      emailVerified: new Date(),
    })
    mocks.findFirst.mockResolvedValue({
      id: "user-1",
      name: "User",
      email: "user@example.com",
    })
  })

  it("cria um código de seis dígitos sem armazená-lo em texto puro", async () => {
    const otp = await createLoginOtp("User@Example.com")

    expect(otp?.code).toMatch(/^\d{6}$/)
    expect(mocks.redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^login-otp:/),
      expect.not.stringMatching(/^\d{6}$/),
      { EX: 600 }
    )
  })

  it("consome o código uma única vez", async () => {
    const otp = await createLoginOtp("user@example.com")

    await expect(
      consumeLoginOtp("user@example.com", otp?.code ?? "")
    ).resolves.toEqual({
      id: "user-1",
      name: "User",
      email: "user@example.com",
    })
    await expect(
      consumeLoginOtp("user@example.com", otp?.code ?? "")
    ).resolves.toBeNull()
  })
})
