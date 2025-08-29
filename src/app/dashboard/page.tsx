"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchInvestmentNews } from "@/lib/news";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar"; // ajuste o caminho conforme sua pasta de components
import Image from "next/image";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 p-6">
        {/* Header profissional */}
        <Header title="InvestHub Dashboard" subtitle="Últimas notícias e insights de investimento" />

        {/* Notícias */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-6">
          Últimas notícias de investimento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <div
              key={article.url}
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition"
            >
              {article.urlToImage && (
                <Image
                  src={article.urlToImage}
                  alt={article.title}
                  width={400}
                  height={200}
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
    </div>
  );
}
