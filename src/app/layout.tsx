import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "./SessionProviderWrapper";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "InvestHub",
  description: "Plataforma de investimentos",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100 font-sans text-gray-800">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
