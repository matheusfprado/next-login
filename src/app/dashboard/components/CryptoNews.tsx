/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  enclosure?: { link: string };
}

export default function CryptoNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();

        if (Array.isArray(data.items)) {
          setNews(
            data.items.map((item: any) => ({
              title: item.title,
              source: item.author || item.source || "CryptoNews",
              date: item.pubDate,
              url: item?.link,
              enclosure: item?.enclosure || undefined,
            }))
          );
        } else {
          setNews([]);
        }
      } catch (err) {
        console.error("Erro ao buscar notícias:", err);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500 dark:text-gray-400">Carregando notícias...</span>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500 dark:text-gray-400">Nenhuma notícia encontrada</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Últimas Notícias
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <div className="relative h-48 w-full">
              {item.enclosure?.link ? (
                <Image
                  src={item.enclosure?.link}
                  alt={item.source}
                  width={1080}
                  height={900}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 w-full h-full text-gray-500 dark:text-gray-300">
                  📰
                </div>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-gray-800">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                {item.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.source} • {new Date(item.date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
