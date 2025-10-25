const API_BASE = "https://api.coingecko.com/api/v3";

export async function fetchCoinPrice(coinId: string): Promise<number | null> {
  const res = await fetch(
    `${API_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`
  );

  if (!res.ok) {
    console.error("Falha ao consultar preço na CoinGecko:", res.statusText);
    return null;
  }

  const data = await res.json();
  return data?.[coinId]?.usd ?? null;
}
