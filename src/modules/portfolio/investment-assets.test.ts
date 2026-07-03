import { describe, expect, it } from "vitest";

import {
  createUsdInvestmentMarket,
  dollarInvestmentValues,
  USD_INVESTMENT_ID,
} from "./investment-assets";

describe("dollar investment", () => {
  it("creates the USD investment option with the current BRL rate", () => {
    expect(createUsdInvestmentMarket(5.25)).toMatchObject({
      id: USD_INVESTMENT_ID,
      symbol: "usd",
      current_price: 5.25,
    });
  });

  it("normalizes BRL purchase cost to the portfolio USD base", () => {
    expect(dollarInvestmentValues(100, 5, 5.25)).toEqual({
      investedUsd: 500 / 5.25,
      currentUsd: 100,
    });
  });
});
