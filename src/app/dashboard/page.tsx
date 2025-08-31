/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Loading from "../components/Loading";
import CryptoTable from "./components/CryptoTable";
import CryptoChart from "./components/CryptoChart";
import { useEffect, useState } from "react";
import CryptoNews from "./components/CryptoNews";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cryptos, setCryptos] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(5.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Delay de 2 segundos para simular carregamento
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const cachedRate = localStorage.getItem("exchangeRate");
        if (cachedRate) {
          setExchangeRate(Number(cachedRate));
        } else {
          const resRate = await fetch(
            "https://api.exchangerate.host/latest?base=USD&symbols=BRL"
          );
          const jsonRate = await resRate.json();
          if (jsonRate?.rates?.BRL) {
            setExchangeRate(jsonRate.rates.BRL);
            localStorage.setItem("exchangeRate", jsonRate.rates.BRL);
          }
        }

        const cachedCryptos = localStorage.getItem("cryptos");
        if (cachedCryptos) setCryptos(JSON.parse(cachedCryptos));

        const res = await fetch("/api/cryptos");
        if (!res.ok) throw new Error("Erro na API de cryptos");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCryptos(data);
          localStorage.setItem("cryptos", JSON.stringify(data));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") return <Loading />;
  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userEmail={session.user?.email || ""} cryptos={cryptos} />
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded p-4">
            <h3 className="text-lg font-semibold mb-4">
              Preço da Criptomoeda (Top 1)
            </h3>
            <CryptoChart cryptos={cryptos} exchangeRate={exchangeRate} />
          </div>
          <div className="bg-white shadow rounded p-4">
            <h3 className="text-lg font-semibold mb-4">Top 10 Criptomoedas</h3>
            <CryptoTable
              cryptos={cryptos}
              exchangeRate={exchangeRate}
              loading={loading}
            />
          </div>
        </div>
        <CryptoNews />
      </div>
    </div>
  );
}
