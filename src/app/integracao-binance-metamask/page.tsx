import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/src/components/ui/button";

export const metadata: Metadata = {
  title: "Integração Binance e MetaMask somente leitura",
  description: "Entenda como acompanhar saldos da Binance e MetaMask em um painel, usando conexões somente leitura e sem permissão de saque.",
  alternates: { canonical: "/integracao-binance-metamask" },
  openGraph: { title: "Integração Binance e MetaMask somente leitura", description: "Centralize saldos de corretora e carteira digital com permissões mínimas.", url: "/integracao-binance-metamask", type: "article" },
};

export default function IntegracaoBinanceMetaMaskPage() {
  return (
    <main className="min-h-screen bg-white text-gray-950">
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">← Voltar para o InvestHub</Link>
        <p className="mt-10 text-sm font-semibold uppercase tracking-wider text-emerald-700">Integrações de carteira</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Como integrar Binance e MetaMask em modo somente leitura</h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">Binance e MetaMask guardam informações de formas diferentes. Uma integração de acompanhamento reúne os saldos sem precisar movimentar ativos.</p>

        <div className="mt-12 space-y-10 text-base leading-8 text-gray-700">
          <section><h2 className="text-2xl font-bold text-gray-950">Como funciona a conexão com a Binance</h2><p className="mt-3">A Binance disponibiliza chaves de API com permissões separadas. Para consultar saldos, basta uma chave com leitura de dados da conta. Negociação, transferências e saques devem permanecer desabilitados. A credencial deve ser exclusiva para a integração e pode ser revogada no painel da corretora.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">Como funciona a conexão com a MetaMask</h2><p className="mt-3">A MetaMask solicita autorização para compartilhar o endereço público selecionado. O saldo nativo da rede pode ser consultado por esse endereço. A seed phrase e a chave privada não são necessárias e nunca devem ser informadas a um aplicativo de acompanhamento.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">O que significa somente leitura</h2><p className="mt-3">Somente leitura significa consultar informações sem capacidade de assinar transações, comprar, vender ou sacar. Na Binance, isso depende das permissões da chave de API. Na MetaMask, qualquer transação continuaria exigindo confirmação explícita dentro da própria carteira.</p></section>
          <section><h2 className="text-2xl font-bold text-gray-950">Boas práticas de segurança</h2><ul className="mt-3 list-disc space-y-2 pl-6"><li>Use uma chave de API exclusiva e mantenha saques desativados.</li><li>Nunca informe seed phrase ou chave privada.</li><li>Confira domínio e certificado antes de conectar uma carteira.</li><li>Revogue acessos que não utiliza mais.</li><li>Revise periodicamente as conexões ativas.</li></ul></section>
        </div>

        <div className="mt-14 rounded-2xl bg-gray-950 p-8 text-white"><h2 className="text-2xl font-bold">Acompanhe Binance e MetaMask juntas</h2><p className="mt-3 text-gray-300">Conecte suas contas em modo somente leitura e organize os saldos.</p><Button asChild className="mt-6"><Link href="/register">Começar agora</Link></Button></div>
      </article>
    </main>
  );
}
