import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBinanceBalances } from "./binance-account.service";

describe("fetchBinanceBalances", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns only positive free and locked balances", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ balances: [
      { asset: "BTC", free: "0.1", locked: "0.2" },
      { asset: "ETH", free: "0", locked: "0" },
    ] }), { status: 200 }));

    await expect(fetchBinanceBalances("api-key-value", "api-secret-value")).resolves.toEqual([
      { asset: "BTC", amount: 0.30000000000000004 },
    ]);
  });
});
