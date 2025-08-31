"use client";
import React from "react";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  CreditCardIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function Sidebar() {
  const [active, setActive] = React.useState("Dashboard");

  const menuItems = [
    { label: "Dashboard", icon: HomeIcon },
    { label: "Investimentos", icon: CreditCardIcon },
    { label: "Perfil", icon: UserIcon },
    { label: "Configurações", icon: Cog6ToothIcon },
  ];

  return (
    <aside
      className={clsx(
        "w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        "flex flex-col justify-between p-6 shadow-sm",
        "sticky top-0 h-screen" // sempre ocupa a altura inteira da tela
      )}
    >
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent mb-10">
          InvestHub
        </h1>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {menuItems.map(({ label, icon: Icon }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={clsx(
                  "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                )}
              >
                <Icon
                  className={clsx(
                    "w-5 h-5 transition-colors",
                    isActive
                      ? "text-emerald-500"
                      : "text-gray-500 group-hover:text-emerald-500"
                  )}
                />
                <span
                  className={clsx(
                    "transition-colors",
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
          <span className="group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
