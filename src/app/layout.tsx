import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { ReactNode } from "react";
import { Toaster } from "@/src/components/ui/sonner";
import { CurrencyProvider } from "@/src/contexts/CurrencyContext";

export const metadata: Metadata = {
  title: "InvestHub",
  description: "Plataforma de investimentos",
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
        <CurrencyProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
