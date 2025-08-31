/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import React from "react";
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

interface CryptoTableProps {
  cryptos: any[];
  exchangeRate: number;
  loading: boolean;
}

export default function CryptoTable({ cryptos, exchangeRate, loading }: CryptoTableProps) {
  return (
    <div className="overflow-x-auto max-h-[380px]">
      <table className="min-w-full bg-white dark:bg-gray-900 shadow-md rounded-xl text-[12px]">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="text-left p-2 w-1/3">Nome</th>
            <th className="text-right p-2 w-1/6">Preço</th>
            <th className="text-right p-2 w-1/6">Variação 24h</th>
            <th className="text-right p-2 w-1/6">Volume</th>
            <th className="text-right p-2 w-1/6">Gráfico</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center p-2 text-gray-500 dark:text-gray-400">
                Carregando...
              </td>
            </tr>
          ) : cryptos.length > 0 ? (
            cryptos.map((coin, index) => {
              const isTop3 = index < 3;
              const priceBRL = coin.current_price * exchangeRate;
              const volumeBRL = coin.total_volume * exchangeRate;

              return (
                <tr
                  key={coin.id}
                  className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                    isTop3 ? "bg-yellow-50 dark:bg-yellow-900/30" : ""
                  }`}
                >
                  <td className="p-2 flex items-center gap-2">
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        {coin.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 uppercase">
                        {coin.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-right font-semibold text-gray-900 dark:text-gray-200">
                    R${priceBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right">
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                        coin.price_change_percentage_24h >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {coin.price_change_percentage_24h.toFixed(2)}%
                      {coin.price_change_percentage_24h >= 0 ? "▲" : "▼"}
                    </div>
                  </td>
                  <td className="p-2 text-right text-gray-600 dark:text-gray-400 font-medium">
                    R${volumeBRL.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                  </td>
                  <td className="p-2 text-right">
                    {coin.sparkline_in_7d?.price && (
                      <div className="w-28 h-6">
                        <Sparklines
                          data={coin.sparkline_in_7d.price.map((p: number) => p * exchangeRate)}
                        >
                          <SparklinesLine
                            color={coin.price_change_percentage_24h >= 0 ? "#22c55e" : "#ef4444"}
                            style={{ strokeWidth: 1.5, fill: "transparent" }}
                          />
                          <SparklinesSpots size={3} style={{ fill: "#4ade80" }} />
                        </Sparklines>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="text-center p-2 text-gray-500 dark:text-gray-400">
                Nenhum relatório encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
