"use client";

import Image from "next/image";
import React from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { DashboardCrypto } from "../types";
import Loading from "../../components/Loading";

interface CryptoTableProps {
  cryptos: DashboardCrypto[];
  exchangeRate: number;
  loading: boolean;
}

export default function CryptoTable({ cryptos, exchangeRate, loading }: CryptoTableProps) {
  return (
    <div className="max-h-[380px] overflow-x-auto">
      <table className="min-w-full rounded-xl border border-gray-200 bg-white text-[12px] shadow-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-left p-2 w-1/3">Nome</th>
            <th className="text-right p-2 w-1/6">Preço</th>
            <th className="text-right p-2 w-1/6">Variação 24h</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={3} className="p-4">
                <Loading fullScreen={false} label="Carregando ativos..." />
              </td>
            </tr>
          ) : cryptos.length > 0 ? (
            cryptos.map((coin, index) => {
              const isTop3 = index < 3;
              const priceBRL = coin.current_price * exchangeRate;
              const change = coin.price_change_percentage_24h;
              const hasChange = typeof change === "number";
              const isPositiveChange = hasChange && change >= 0;

              return (
                <tr
                  key={coin.id}
                  className={`border-b border-gray-200 transition ${
                    isTop3
                      ? "bg-emerald-50/60"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="flex items-center gap-2 p-2">
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full border border-gray-200"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        {coin.name}
                      </span>
                      <span className="text-gray-500 uppercase">
                        {coin.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-right font-semibold text-gray-900">
                    R${priceBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-right">
                    <div
                      className={
                        hasChange
                          ? isPositiveChange
                            ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700"
                            : "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700"
                          : "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600"
                      }
                    >
                      {hasChange ? (
                        isPositiveChange ? (
                          <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
                        )
                      ) : null}
                      {hasChange ? `${change.toFixed(2)}%` : "--"}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} className="text-center p-2 text-gray-500">
                Nenhum relatório encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
