"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { BellIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { DashboardCrypto } from "../types";

interface HeaderProps {
  userEmail?: string;
  cryptos: DashboardCrypto[];
}

export default function Header({ userEmail = "", cryptos }: HeaderProps) {
  const username = userEmail.split("@")[0] || "Usuário";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cryptoDrops = useMemo(() => {
    if (!cryptos || cryptos.length === 0) return [];
    return cryptos.filter(
      (coin) => (coin.price_change_percentage_24h ?? 0) < -5
    );
  }, [cryptos]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm relative">
      <div>
        <div className="flex items-center gap-2 text-emerald-500">
          <ChartBarIcon className="h-6 w-6" />
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Workspace
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Bem-vindo de volta,{" "}
          <span className="font-medium text-gray-900">
            {username}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-6 relative">
        <div ref={dropdownRef} className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <BellIcon className="w-6 h-6 text-gray-700" />
            {cryptoDrops.length > 0 && (
              <span className="absolute top-1 right-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-xl border border-gray-200 z-50 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Quedas Recentes
              </h4>
              {cryptoDrops.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhuma queda significativa nas últimas 24h.
                </p>
              ) : (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {cryptoDrops.map((coin) => (
                    <li
                      key={coin.id}
                      className="flex justify-between items-center p-2 rounded hover:bg-gray-50 transition"
                    >
                      <span className="font-medium text-gray-900">
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </span>
                      <span className="text-red-500 font-semibold">
                        {typeof coin.price_change_percentage_24h === "number"
                          ? `${coin.price_change_percentage_24h.toFixed(2)}%`
                          : "--"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-400 text-white font-semibold shadow-md group-hover:scale-105 transition-transform">
            {(username?.[0] || "U").toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium group-hover:text-emerald-500 transition-colors">
              {username}
            </span>
            <span className="text-gray-500 text-sm">
              {userEmail || "email@exemplo.com"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
