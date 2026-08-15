"use client";
import React, { ElementType, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button } from "../../components/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "../../components/Brand";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  type SidebarItem = {
    label: string;
    icon: ElementType;
    href: string;
    exact?: boolean;
  };

  const mainMenu: SidebarItem[] = [
    { label: "Dashboard", icon: HomeIcon, href: "/dashboard", exact: true },
    { label: "Carteira", icon: BriefcaseIcon, href: "/dashboard/carteira" },
    // { label: "Investimentos", icon: CreditCardIcon },
    // { label: "Notificações", icon: BellIcon },
  ];

  const settingsMenu: SidebarItem[] = [
    { label: "Perfil", icon: UserIcon, href: "/dashboard/perfil" },
    { label: "Configurações", icon: Cog6ToothIcon, href: "/dashboard/configuracoes" },
  ];

  const renderMenuItem = (item: SidebarItem) => {
    const isActive = item.exact
      ? pathname === item.href
      : pathname === item.href || pathname?.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={clsx(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
          isActive
            ? "bg-emerald-500/10 text-emerald-600 shadow-inner"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        {isActive && (
          <span className="absolute left-1 h-5 w-1 rounded-full bg-emerald-500" />
        )}
        <item.icon
          className={clsx(
            "h-5 w-5 transition-colors",
            isActive
              ? "text-emerald-500"
              : "text-gray-400 group-hover:text-gray-700"
          )}
        />
        <span
          className={clsx(
            "transition-colors",
            isActive
              ? "text-emerald-700"
              : "group-hover:text-gray-900"
          )}
        >
          {item.label}
        </span>
      </Link>
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
          "fixed top-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200 bg-white/95 backdrop-blur",
          "shadow-lg shadow-emerald-500/10 transition-transform duration-300 ease-in-out",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <Brand subtitle="Painel inteligente" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <nav className="space-y-1">
            <p className="px-3 text-xs uppercase tracking-wide text-gray-400">
              Visão geral
            </p>
            <div className="mt-2 space-y-1">{mainMenu.map(renderMenuItem)}</div>
          </nav>
          {settingsMenu.length > 0 && (
            <nav className="mt-8 space-y-1">
              <p className="px-3 text-xs uppercase tracking-wide text-gray-400">
                Preferências
              </p>
              <div className="mt-2 space-y-1">
                {settingsMenu.map(renderMenuItem)}
              </div>
            </nav>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-5">
          {/*
            The bottom card mirrors shadcn-like account switcher styling.
            It shows basic session info and a quick sign-out action.
          */}
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              {(session?.user?.name ?? session?.user?.email ?? "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name ?? "Sessão ativa"}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.email ?? "Gerencie sua conta"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
      <Button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="sr-only">Abrir menu</span>
        <div className="w-6 h-0.5 bg-gray-800 mb-1"></div>
        <div className="w-6 h-0.5 bg-gray-800 mb-1"></div>
        <div className="w-6 h-0.5 bg-gray-800"></div>
      </Button>
    </>
  );
}

