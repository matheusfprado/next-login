"use client";

import { NewspaperIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  image?: string;
}

interface NewsResponseItem {
  title?: string;
  author?: string;
  source?: string;
  pubDate?: string;
  link?: string;
  enclosure?: { link?: string };
}

export default function CryptoNews() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        const data: { items?: NewsResponseItem[] } = await response.json();
        setNews((data.items ?? []).flatMap((item) => item.title && item.pubDate && item.link ? [{ title: item.title, source: item.author || item.source || "CryptoNews", date: item.pubDate, url: item.link, image: item.enclosure?.link }] : []));
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        setNews([]);
      }
    };
    void fetchNews();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Últimas notícias</CardTitle>
        <CardDescription>Atualizações recentes do mercado cripto.</CardDescription>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Nenhuma notícia encontrada</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <a key={`${item.url}-${item.date}`} href={item.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                <div className="relative h-44 w-full overflow-hidden bg-muted">
                  {item.image ? <Image src={item.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><NewspaperIcon className="size-10" /></div>}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 font-semibold group-hover:text-emerald-600">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.source} • {new Date(item.date).toLocaleDateString("pt-BR")}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
