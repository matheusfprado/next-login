"use client"

import { usePathname } from "next/navigation"

import { Separator } from "@/src/components/ui/separator"
import { SidebarTrigger } from "@/src/components/ui/sidebar"
import { Currency, useCurrency } from "@/src/contexts/CurrencyContext"

const pageTitles: Record<string, string> = {
  "/dashboard": "Visão geral",
  "/dashboard/carteira": "Carteira",
  "/dashboard/perfil": "Perfil",
  "/dashboard/configuracoes": "Configurações",
}

export function SiteHeader() {
  const pathname = usePathname()
  const { currency, setCurrency } = useCurrency()
  const title = pageTitles[pathname] ?? "Dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/95 backdrop-blur">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 size-11 md:size-9" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <h1 className="text-base font-semibold">{title}</h1>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Moeda</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as Currency)}
            className="h-11 rounded-md border bg-background px-3 text-base font-medium text-foreground shadow-xs outline-none focus:ring-2 focus:ring-ring/50 sm:text-sm md:h-9"
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>
    </header>
  )
}
