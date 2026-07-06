import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchDollarRateHistory, parseDollarCandles } from "./dollar-history.service";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseDollarCandles", () => {
  it("orders quotes and creates USD/BRL candles", () => {
    const candles = parseDollarCandles([
      { high: "5.20", low: "5.00", bid: "5.10", timestamp: "2000" },
      { high: "5.00", low: "4.80", bid: "4.90", timestamp: "1000" },
    ]);

    expect(candles).toHaveLength(2);
    expect(candles[0]).toMatchObject({ open: 4.9, close: 4.9 });
    expect(candles[1]).toMatchObject({ open: 4.9, high: 5.2, low: 4.9, close: 5.1 });
  });

  it("ignores invalid quotes", () => {
    expect(parseDollarCandles([{ bid: "invalid" }])).toEqual([]);
  });

  it("uses Frankfurter when AwesomeAPI fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        rates: {
          "2026-07-02": { BRL: 5.42 },
          "2026-07-03": { BRL: 5.4 },
        },
      })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchDollarRateHistory(1)).resolves.toEqual([
      { timestamp: "2026-07-03T00:00:00.000Z", rate: 5.4 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("api.frankfurter.dev/v1/");
  });
});
