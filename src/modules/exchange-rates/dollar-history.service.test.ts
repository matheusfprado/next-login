import { describe, expect, it } from "vitest";

import { parseDollarCandles } from "./dollar-history.service";

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
});
