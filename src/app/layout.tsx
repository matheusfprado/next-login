import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { ReactNode } from "react";
import { Toaster } from "@/src/components/ui/sonner";
import { CurrencyProvider } from "@/src/contexts/CurrencyContext";
import { GoogleAds } from "@/src/components/google-ads";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "InvestHub | Controle de investimentos", template: "%s | InvestHub" },
  description: "Controle investimentos e criptomoedas, acompanhe cotações e conecte Binance e MetaMask em modo somente leitura.",
  keywords: ["controle de investimentos", "carteira de criptomoedas", "acompanhar criptomoedas", "carteira Binance", "MetaMask"],
  applicationName: "InvestHub",
  authors: [{ name: "InvestHub" }],
  creator: "InvestHub",
  publisher: "InvestHub",
  category: "finance",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", locale: "pt_BR", siteName: "InvestHub", title: "InvestHub | Controle de investimentos e criptomoedas", description: "Acompanhe carteira, cotações e alertas. Integre Binance e MetaMask em modo somente leitura.", url: "/" },
  twitter: { card: "summary_large_image", title: "InvestHub | Controle de investimentos", description: "Acompanhe investimentos e criptomoedas em um só lugar." },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans text-foreground">
        <GoogleAds />
        <CurrencyProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
