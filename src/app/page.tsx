import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconBell, IconChartLine, IconLock, IconPlugConnected, IconWallet } from "@tabler/icons-react";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";

export const metadata: Metadata = {
  title: "App para controlar carteira de criptomoedas",
  description: "Acompanhe sua carteira, preços de criptomoedas e alertas em um só lugar. Integre Binance e MetaMask em modo somente leitura.",
  alternates: { canonical: "/" },
};

const features = [
  { icon: IconWallet, title: "Carteira centralizada", description: "Visualize seus ativos e acompanhe a evolução da carteira sem planilhas dispersas." },
  { icon: IconChartLine, title: "Mercado em tempo real", description: "Consulte preços, variações e histórico das principais criptomoedas." },
  { icon: IconBell, title: "Alertas personalizados", description: "Defina preços-alvo e receba avisos para acompanhar oportunidades e riscos." },
  { icon: IconPlugConnected, title: "Binance e MetaMask", description: "Sincronize saldos em modo somente leitura, sem permissão para negociar ou sacar." },
];

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: "InvestHub", url: siteUrl, inLanguage: "pt-BR" },
      { "@type": "SoftwareApplication", name: "InvestHub", url: siteUrl, applicationCategory: "FinanceApplication", operatingSystem: "Web", description: "Aplicativo para controle de carteira de criptomoedas, alertas e integração somente leitura com Binance e MetaMask." },
      { "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: "O InvestHub movimenta minhas criptomoedas?", acceptedAnswer: { "@type": "Answer", text: "Não. As integrações com Binance e MetaMask são usadas em modo somente leitura para consultar e organizar saldos." } },
        { "@type": "Question", name: "Posso acompanhar Binance e MetaMask no mesmo painel?", acceptedAnswer: { "@type": "Answer", text: "Sim. O InvestHub centraliza os saldos sincronizados para facilitar o acompanhamento da carteira." } },
        { "@type": "Question", name: "O InvestHub faz recomendação de investimento?", acceptedAnswer: { "@type": "Answer", text: "Não. A plataforma organiza dados e alertas para acompanhamento e não oferece recomendação financeira." } },
      ] },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="border-b border-gray-200">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Navegação principal">
          <Link href="/" className="flex items-center gap-2 font-bold" aria-label="InvestHub - início">
            <Image src="/icon.png" alt="" width={32} height={32} className="rounded-lg" priority />
            <span className="text-xl text-emerald-600">InvestHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link href="/login">Entrar</Link></Button>
            <Button asChild><Link href="/register">Criar conta</Link></Button>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_65%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Seu patrimônio, mais claro</p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">Controle seus investimentos e criptomoedas em um só lugar</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">Acompanhe carteira, cotações e alertas. Conecte Binance e MetaMask com acesso somente leitura e tome decisões com dados organizados.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-12 w-full sm:w-auto"><Link href="/register">Começar agora</Link></Button>
            <Button asChild size="lg" variant="outline" className="min-h-12 w-full sm:w-auto"><Link href="/login">Já tenho uma conta</Link></Button>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500"><IconLock className="size-4" aria-hidden="true" /> Integrações sem permissão de trade ou saque</p>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="recursos-title">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="recursos-title" className="text-3xl font-bold tracking-tight">Tudo para acompanhar sua carteira</h2>
            <p className="mt-3 text-gray-600">Informação financeira organizada, acessível no computador ou celular.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => <Card key={feature.title} className="shadow-sm"><CardContent className="pt-6"><feature.icon className="size-7 text-emerald-600" aria-hidden="true" /><h3 className="mt-4 font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-gray-950 px-6 py-12 text-white sm:px-12">
          <h2 className="text-3xl font-bold">Organize seus investimentos hoje</h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-300">Crie sua conta e acompanhe sua carteira com uma visão simples dos ativos que importam para você.</p>
          <Button asChild size="lg" className="mt-7 min-h-12"><Link href="/register">Criar minha conta</Link></Button>
        </div>
      </section>

      <section className="border-t border-gray-200 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="guias-title">
        <div className="mx-auto max-w-5xl">
          <h2 id="guias-title" className="text-center text-3xl font-bold">Aprenda a organizar sua carteira cripto</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link href="/controle-de-carteira-cripto" className="rounded-2xl border border-gray-200 p-6 transition-colors hover:border-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><h3 className="font-semibold">Como controlar uma carteira de criptomoedas</h3><p className="mt-2 text-sm leading-6 text-gray-600">Veja como centralizar ativos, acompanhar preços e criar uma rotina de monitoramento.</p></Link>
            <Link href="/integracao-binance-metamask" className="rounded-2xl border border-gray-200 p-6 transition-colors hover:border-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><h3 className="font-semibold">Integração Binance e MetaMask</h3><p className="mt-2 text-sm leading-6 text-gray-600">Entenda como funciona a sincronização somente leitura e quais cuidados tomar.</p></Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="text-3xl font-bold">Perguntas frequentes</h2>
          <div className="mt-8 space-y-6">
            <div><h3 className="font-semibold">O InvestHub movimenta minhas criptomoedas?</h3><p className="mt-2 text-gray-600">Não. Binance e MetaMask são conectadas em modo somente leitura para consultar e organizar saldos.</p></div>
            <div><h3 className="font-semibold">Posso acompanhar Binance e MetaMask no mesmo painel?</h3><p className="mt-2 text-gray-600">Sim. Os saldos sincronizados aparecem em uma visão centralizada da carteira.</p></div>
            <div><h3 className="font-semibold">O InvestHub faz recomendação de investimento?</h3><p className="mt-2 text-gray-600">Não. A plataforma organiza informações e alertas para acompanhamento pessoal.</p></div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} InvestHub. Informações para acompanhamento; não constituem recomendação de investimento.</p>
      </footer>
    </main>
  );
}
