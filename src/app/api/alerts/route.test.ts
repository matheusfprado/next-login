import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  isEmailConfigured: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/authOptions", () => ({ authOptions: {} }));
vi.mock("@/lib/email", () => ({ isEmailConfigured: mocks.isEmailConfigured }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUnique },
    priceAlert: { findMany: mocks.findMany, create: mocks.create },
  },
}));

import { POST } from "./route";

function alertRequest(deliveryMethod: "EMAIL" | "SMS" = "EMAIL") {
  return new Request("http://localhost/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coinId: "bitcoin",
      coinName: "Bitcoin",
      targetPrice: 100,
      direction: "ABOVE",
      deliveryMethod,
    }),
  });
}

describe("criação de alertas por e-mail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.isEmailConfigured.mockReturnValue(true);
  });

  it("recusa novos alertas por SMS", async () => {
    const response = await POST(alertRequest("SMS"));

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("informa quando o servidor de e-mail não está configurado", async () => {
    mocks.isEmailConfigured.mockReturnValue(false);

    const response = await POST(alertRequest());

    expect(response.status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("exige um e-mail confirmado", async () => {
    mocks.findUnique.mockResolvedValue({
      email: "user@example.com",
      emailVerified: null,
      preferences: { emailAlerts: true },
    });

    const response = await POST(alertRequest());

    expect(response.status).toBe(422);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("cria o alerta com entrega por e-mail", async () => {
    mocks.findUnique.mockResolvedValue({
      email: "user@example.com",
      emailVerified: new Date(),
      preferences: { emailAlerts: true },
    });
    mocks.create.mockResolvedValue({
      id: "alert-1",
      targetPrice: 100,
      deliveryMethod: "EMAIL",
    });

    const response = await POST(alertRequest());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        coinId: "bitcoin",
        coinName: "Bitcoin",
        targetPrice: 100,
        direction: "ABOVE",
        deliveryMethod: "EMAIL",
      },
    });
    expect(body.deliveryMethod).toBe("EMAIL");
  });
});
