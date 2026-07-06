import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBinanceBalances } from "./binance-account.service";

describe("fetchBinanceBalances", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns only positive free and locked balances", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ serverTime: 1_720_000_000_000 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ balances: [
        { asset: "BTC", free: "0.1", locked: "0.2" },
        { asset: "ETH", free: "0", locked: "0" },
      ] }), { status: 200 }));

    await expect(fetchBinanceBalances("api-key-value", "api-secret-value")).resolves.toEqual([
      { asset: "BTC", amount: 0.30000000000000004 },
    ]);
    expect(String(fetchMock.mock.calls[1][0])).toContain("timestamp=1720000000000");
  });

  it("returns Binance API error details", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ serverTime: Date.now() }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: -2015, msg: "Invalid API-key, IP, or permissions for action." }), { status: 401 }));

    await expect(fetchBinanceBalances("api-key-value", "api-secret-value")).rejects.toThrow(
      "Binance: Invalid API-key, IP, or permissions for action."
    );
  });
});
