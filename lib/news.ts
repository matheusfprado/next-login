export async function fetchInvestmentNews() {
  const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  const query = encodeURIComponent("mercado de valores"); // termo de pesquisa
  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?country=br&category=business&q=${query}&pageSize=10&apiKey=${apiKey}`
  );

  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "Erro ao buscar notícias");
  return data.articles;
}