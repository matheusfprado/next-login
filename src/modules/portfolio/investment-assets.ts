export const USD_INVESTMENT_ID = "fiat-usd";

export interface UsdInvestmentMarket {
  id: typeof USD_INVESTMENT_ID;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export function createUsdInvestmentMarket(usdBrlRate: number): UsdInvestmentMarket {
  return {
    id: USD_INVESTMENT_ID,
    name: "Dólar americano",
    symbol: "usd",
    image: "",
    current_price: usdBrlRate,
    price_change_percentage_24h: 0,
  };
}

export function dollarInvestmentValues(
  amountUsd: number,
  buyRateBrl: number,
  currentRateBrl: number
) {
  const safeRate = currentRateBrl > 0 ? currentRateBrl : 1;
  const investedUsd = (amountUsd * buyRateBrl) / safeRate;
  const currentUsd = amountUsd;

  return { investedUsd, currentUsd };
}
