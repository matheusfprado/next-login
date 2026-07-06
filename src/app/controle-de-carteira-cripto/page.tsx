import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/src/components/ui/button";

export const metadata: Metadata = {
  title: "Como controlar uma carteira de criptomoedas",
  description: "Aprenda a organizar uma carteira de criptomoedas, centralizar saldos, acompanhar preços e configurar alertas com segurança.",
  alternates: { canonical: "/controle-de-carteira-cripto" },
  openGraph: { title: "Como controlar uma carteira de criptomoedas", description: "Guia prático para organizar ativos cripto, acompanhar preços e evitar controles dispersos.", url: "/controle-de-carteira-cripto", type: "article" },
};

export default function ControleCarteiraCriptoPage() {
  return (
    <main className="min-h-screen bg-white text-gray-950">
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">← Voltar para o InvestHub</Link>
        <p className="mt-10 text-sm font-semibold uppercase tracking-wider text-emerald-700">Guia de carteira cripto</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Como controlar uma carteira de criptomoedas</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">Quem mantém ativos em corretoras e carteiras digitais precisa enxergar quantidade, distribuição e variação sem depender de várias telas. Um controle centralizado reduz erros de anotação e facilita o acompanhamento do patrimônio.</p>

        <div className="mt-12 space-y-10 text-base leading-8 text-gray-700">
          <section><h2 className="text-2xl font-bold text-gray-950">1. Liste onde os ativos estão</h2><p className="mt-3">Comece identificando corretoras, carteiras e ativos utilizados. Separe saldo disponível de valores bloqueados e mantenha o símbolo de cada moeda consistente. Essa estrutura evita duplicidade quando o mesmo ativo existe em mais de uma origem.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">2. Centralize os saldos</h2><p className="mt-3">Uma plataforma de acompanhamento pode consolidar dados da Binance, MetaMask e registros manuais. Prefira integrações somente leitura. Elas devem consultar saldos sem receber autorização para negociar, transferir ou sacar.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">3. Acompanhe preço e distribuição</h2><p className="mt-3">O valor total é apenas uma parte da análise. Observe quanto cada ativo representa na carteira e como essa proporção muda. Cotações atualizadas ajudam a comparar os ativos usando uma moeda comum, como real ou dólar.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">4. Use alertas com objetivo claro</h2><p className="mt-3">Alertas de preço evitam consultas repetitivas. Defina valores relevantes para sua estratégia e revise alertas antigos. Um alerta informa que uma condição ocorreu; ele não substitui avaliação de risco nem constitui recomendação de compra ou venda.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">5. Proteja suas credenciais</h2><p className="mt-3">Nunca compartilhe seed phrase ou chave privada. Em integrações com corretoras, crie uma chave exclusiva com leitura habilitada e negociação e saque desabilitados. Revogue imediatamente qualquer credencial exposta.</p></section>
        </div>

        <div className="mt-14 rounded-2xl bg-gray-950 p-8 text-white"><h2 className="text-2xl font-bold">Centralize sua carteira no InvestHub</h2><p className="mt-3 text-gray-300">Acompanhe saldos, cotações e alertas em um único painel.</p><Button asChild className="mt-6"><Link href="/register">Criar conta</Link></Button></div>
      </article>
    </main>
  );
}
