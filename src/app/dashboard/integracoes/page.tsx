"use client";

import { useCallback, useEffect, useState } from "react";
import { IconBrandBinance, IconBrandMeta, IconRefresh, IconTrash } from "@tabler/icons-react";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";

interface Holding { asset: string; amount: number; syncedAt: string }
interface Integration { id: string; provider: "BINANCE" | "METAMASK"; label: string; walletAddress?: string | null; chainId?: string | null; lastSyncedAt?: string | null; holdings: Holding[] }
interface EthereumProvider {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface Eip6963ProviderDetail {
  info: { name: string; rdns: string };
  provider: EthereumProvider;
}

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/integrations");
    if (response.ok) setIntegrations(await response.json());
  }, []);

  useEffect(() => { void load(); }, [load]);

  const connectBinance = async () => {
    setLoading(true); setMessage(null);
    try {
      const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "BINANCE", apiKey, apiSecret }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao conectar");
      setIntegrations(data); setApiKey(""); setApiSecret(""); setMessage("Binance conectada em modo somente leitura.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao conectar"); }
    finally { setLoading(false); }
  };

  const connectMetaMask = async () => {
    setLoading(true); setMessage(null);
    try {
      const ethereum = await findMetaMaskProvider();
      if (!ethereum) throw new Error("MetaMask não foi liberada para este site. Recarregue a página e permita o acesso da extensão ao localhost.");
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await ethereum.request({ method: "eth_chainId" });
      const walletAddress = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      if (!walletAddress || typeof chainId !== "string") throw new Error("Carteira inválida.");
      const response = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "METAMASK", walletAddress, chainId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao conectar");
      setIntegrations(data); setMessage("MetaMask conectada.");
      const connection = (data as Integration[]).find((item) => item.provider === "METAMASK");
      if (connection) await sync(connection);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Conexão cancelada"); }
    finally { setLoading(false); }
  };

  const sync = useCallback(async (integration: Integration) => {
    let holdings: Array<{ asset: string; amount: number }> = [];
    if (integration.provider === "METAMASK") {
      const ethereum = await findMetaMaskProvider();
      if (!ethereum || !integration.walletAddress) return;
      const rawBalance = await ethereum.request({ method: "eth_getBalance", params: [integration.walletAddress, "latest"] });
      if (typeof rawBalance === "string") holdings = [{ asset: "ETH", amount: weiToEth(rawBalance) }];
    }
    const response = await fetch(`/api/integrations/${integration.id}/sync`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ holdings }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Falha ao sincronizar");
    setIntegrations(data);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => integrations.forEach((item) => void sync(item).catch(console.error)), 60_000);
    return () => window.clearInterval(timer);
  }, [integrations, sync]);

  const disconnect = async (id: string) => {
    if (!window.confirm("Desconectar esta integração?")) return;
    const response = await fetch(`/api/integrations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setIntegrations((current) => current.filter((item) => item.id !== id));
  };

  const importPortfolio = async () => {
    setLoading(true);
    const response = await fetch("/api/integrations/import", { method: "POST" });
    const data = await response.json();
    setMessage(response.ok ? `${data.imported} ativos importados para a carteira.` : data.error ?? "Falha ao importar");
    setLoading(false);
  };

  return (
    <div className="w-full space-y-6 px-4 py-6 lg:px-6">
      <header><h1 className="text-2xl font-bold text-gray-900">Integrações de carteira</h1><p className="mt-1 text-sm text-gray-500">Sincronização somente leitura com Binance e MetaMask.</p></header>
      {message && <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700" role="status">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><IconBrandBinance className="size-5" /> Binance</CardTitle></CardHeader><CardContent className="space-y-3">
          <label className="text-sm font-medium">API Key<Input value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" className="mt-1" /></label>
          <label className="text-sm font-medium">Secret Key<Input type="password" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} autoComplete="new-password" className="mt-1" /></label>
          <p className="text-xs text-gray-500">Crie uma chave com USER_DATA. Não habilite trade ou saque.</p>
          <Button onClick={connectBinance} disabled={loading || !apiKey || !apiSecret}>Conectar Binance</Button>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><IconBrandMeta className="size-5" /> MetaMask</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-gray-600">Conecte pelo navegador. O sistema solicita apenas endereço e leitura de saldo.</p><Button onClick={connectMetaMask} disabled={loading}>Conectar MetaMask</Button></CardContent></Card>
      </div>
      <div className="flex justify-end"><Button onClick={importPortfolio} disabled={loading || integrations.length === 0}>Importar saldos para carteira</Button></div>
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Conexões ativas">
        {integrations.map((integration) => <Card key={integration.id}><CardContent className="pt-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{integration.label}</h2><p className="mt-1 break-all text-xs text-gray-500">{integration.walletAddress ?? "Credencial protegida"}</p><p className="mt-1 text-xs text-gray-500">Última sincronização: {integration.lastSyncedAt ? new Date(integration.lastSyncedAt).toLocaleString("pt-BR") : "pendente"}</p></div><div className="flex gap-2"><Button size="icon" variant="outline" aria-label={`Sincronizar ${integration.label}`} onClick={() => void sync(integration).catch((error) => setMessage(String(error)))}><IconRefresh className="size-4" /></Button><Button size="icon" variant="outline" aria-label={`Desconectar ${integration.label}`} onClick={() => void disconnect(integration.id)}><IconTrash className="size-4" /></Button></div></div>
          <div className="mt-4 divide-y rounded-lg border">{integration.holdings.length === 0 ? <p className="p-3 text-sm text-gray-500">Nenhum saldo encontrado.</p> : integration.holdings.map((holding) => <div key={holding.asset} className="flex justify-between px-3 py-2 text-sm"><span className="font-medium">{holding.asset}</span><span className="tabular-nums">{holding.amount.toLocaleString("pt-BR", { maximumFractionDigits: 8 })}</span></div>)}</div>
        </CardContent></Card>)}
      </section>
    </div>
  );
}

function weiToEth(value: string) {
  const wei = BigInt(value);
  const decimals = BigInt(10) ** BigInt(18);
  const whole = wei / decimals;
  const fraction = (wei % decimals).toString().padStart(18, "0").replace(/0+$/, "");
  return Number(fraction ? `${whole}.${fraction}` : whole.toString());
}

async function findMetaMaskProvider(): Promise<EthereumProvider | null> {
  const injected = (window as typeof window & { ethereum?: EthereumProvider }).ethereum;
  const legacyProvider = injected?.providers?.find((provider) => provider.isMetaMask)
    ?? (injected?.isMetaMask ? injected : null);
  if (legacyProvider) return legacyProvider;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (provider: EthereumProvider | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("eip6963:announceProvider", onProvider as EventListener);
      window.clearTimeout(timeout);
      resolve(provider);
    };
    const onProvider = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
      if (detail?.provider?.isMetaMask || detail?.info?.rdns === "io.metamask") finish(detail.provider);
    };
    const timeout = window.setTimeout(() => finish(null), 500);
    window.addEventListener("eip6963:announceProvider", onProvider as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  });
}
