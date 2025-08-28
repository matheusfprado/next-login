"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchInvestmentNews } from "@/lib/news";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    async function getNews() {
      try {
        const news = await fetchInvestmentNews();
        setArticles(news);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    getNews();
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          InvestHub Dashboard
        </h1>
        <button
          onClick={() => signOut()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Sair
        </button>
      </div>

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Últimas notícias de investimento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <div
            key={article.url}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition"
          >
            {article.urlToImage && (
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-full h-40 object-cover rounded-md mb-2"
              />
            )}
            <h3 className="font-semibold text-gray-800">{article.title}</h3>
            <p className="text-gray-600 text-sm">{article.description}</p>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm mt-2 inline-block"
            >
              Leia mais
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
