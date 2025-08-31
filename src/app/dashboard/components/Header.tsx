/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useMemo } from "react";
import { BellIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  userEmail: string;
  cryptos: any[]; // recebe o array de criptos do Dashboard
}

interface Crypto {
  id: string;
  name: string;
  symbol: string;
  price_change_percentage_24h: number;
}

export default function Header({ userEmail, cryptos }: HeaderProps) {
  const username = userEmail.split("@")[0];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Filtra moedas com queda maior que 5%
  const cryptoDrops = useMemo(() => {
    if (!cryptos || cryptos.length === 0) return [];
    return cryptos.filter((coin: any) => coin.price_change_percentage_24h < -5);
  }, [cryptos]);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm relative">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Workspace
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Bem-vindo de volta, <span className="font-medium">{username}</span> 👋
        </p>
      </div>

      <div className="flex items-center gap-6 relative">
        {/* Botão de notificações */}
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <BellIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          {cryptoDrops.length > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
          )}
        </button>

        {/* Dropdown de quedas */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 z-50 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Quedas Recentes
            </h4>
            {cryptoDrops.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma queda significativa nas últimas 24h.
              </p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {cryptoDrops.map((coin: Crypto) => (
                  <li
                    key={coin.id}
                    className="flex justify-between items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {coin.name} ({coin.symbol.toUpperCase()})
                    </span>
                    <span className="text-red-500 font-semibold">
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-400 text-white font-semibold shadow-md group-hover:scale-105 transition-transform">
            {username[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 dark:text-white font-medium group-hover:text-emerald-500 transition-colors">
              {username}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
