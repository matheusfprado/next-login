import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const lastModified = new Date();
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/controle-de-carteira-cripto`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/integracao-binance-metamask`, lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
