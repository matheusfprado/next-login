import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { ReactNode } from "react";
import { ToastProvider } from "@/src/components/ui/toast";
import { CurrencyProvider } from "@/src/contexts/CurrencyContext";

export const metadata: Metadata = {
  title: "InvestHub",
  description: "Plataforma de investimentos",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100 font-sans text-gray-800">
        <ToastProvider>
          <CurrencyProvider>
            <SessionProviderWrapper>{children}</SessionProviderWrapper>
          </CurrencyProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
