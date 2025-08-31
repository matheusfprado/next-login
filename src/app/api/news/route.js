// app/api/crypto-news/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://cryptonews.com/news/feed"
    );

    if (!res.ok) {
      console.error("Erro ao buscar notícias:", res.statusText);
      return NextResponse.json({ items: [] }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro na API interna de notícias:", err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
