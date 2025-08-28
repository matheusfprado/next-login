export async function fetchInvestmentNews() {
  const apiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;

  if (!apiKey) throw new Error("Chave da API não encontrada");

  const query = encodeURIComponent("investimentos OR bolsa OR ações");
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
  );

  const data = await res.json();

  if (data.status !== "ok")
    throw new Error(data.message || "Erro ao buscar notícias");

  return data.articles;
}
