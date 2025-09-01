/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  HomeIcon as HomeIconSolid,
  CreditCardIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function Sidebar() {
  const [active, setActive] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainMenu = [
    { label: "Dashboard", icon: HomeIcon },
    // { label: "Investimentos", icon: CreditCardIcon },
    // { label: "Notificações", icon: BellIcon },
  ];

  const settingsMenu = [
    { label: "Perfil", icon: UserIcon },
    { label: "Configurações", icon: Cog6ToothIcon },
  ];

  const renderMenuItem = (item: { label: string; icon: any }) => {
    const isActive = active === item.label;
    return (
      <button
        key={item.label}
        onClick={() => {
          setActive(item.label);
          setMobileOpen(false);
        }}
        className={clsx(
          "relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full",
          isActive
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-inner"
            : "text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:shadow-sm"
        )}
      >
        {isActive && (
          <span className="absolute left-0 h-full w-1 rounded-r-full bg-emerald-500" />
        )}
        <item.icon
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
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={clsx(
          "bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between p-6 shadow-sm h-screen",
          "fixed md:relative z-50 top-0 left-0 transform transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-64"
        )}
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent mb-10">
            InvestHub
          </h1>
          <nav className="flex flex-col gap-1 mb-6 ">{mainMenu.map(renderMenuItem)}</nav>
          <nav className="flex flex-col gap-1 hidden">{settingsMenu.map(renderMenuItem)}</nav>
        </div>

        {/* Logout */}
        <div className="mt-6">
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
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white dark:bg-gray-900 shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="sr-only">Abrir menu</span>
        <div className="w-6 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1"></div>
        <div className="w-6 h-0.5 bg-gray-800 dark:bg-gray-200 mb-1"></div>
        <div className="w-6 h-0.5 bg-gray-800 dark:bg-gray-200"></div>
      </button>
    </>
  );
}
