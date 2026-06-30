import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchTopCryptoMarkets } from "./coingecko.service";

describe("fetchTopCryptoMarkets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa CoinGecko quando Binance rejeita a requisição", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 451 }))
      .mockResolvedValueOnce(
        Response.json([
          {
            id: "bitcoin",
            symbol: "btc",
            name: "Bitcoin",
            image: "https://example.com/bitcoin.png",
            current_price: 60_000,
            market_cap: 1_000_000,
            total_volume: 50_000,
            price_change_percentage_24h: 2.5,
            sparkline_in_7d: { price: [59_000, 60_000] },
          },
        ])
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await fetchTopCryptoMarkets();

    expect(result).toEqual([
      expect.objectContaining({
        id: "bitcoin",
        current_price: 60_000,
        sparkline_in_7d: { price: [59_000, 60_000] },
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "api.coingecko.com/api/v3/coins/markets"
    );
  });
});
