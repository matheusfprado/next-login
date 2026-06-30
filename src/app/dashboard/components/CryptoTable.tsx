"use client";

import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { DashboardCrypto } from "../types";

interface CryptoTableProps {
  cryptos: DashboardCrypto[];
  exchangeRate: number;
  loading?: boolean;
}

export default function CryptoTable({ cryptos, exchangeRate }: CryptoTableProps) {
  const { currency } = useCurrency();
  const formatter = new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", { style: "currency", currency });

  return (
    <div className="max-h-[440px] overflow-auto rounded-xl border bg-card">
      <Table>
        <TableCaption className="sr-only">Ranking das principais criptomoedas por valor de mercado</TableCaption>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          <TableRow>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Preço</TableHead>
            <TableHead className="text-right">24h</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cryptos.length > 0 ? cryptos.map((coin, index) => {
            const change = coin.price_change_percentage_24h;
            const hasChange = typeof change === "number";
            const positive = hasChange && change >= 0;
            return (
              <TableRow key={coin.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="flex min-w-[150px] items-center gap-3">
                    <Badge variant="secondary" className={index < 3 ? "bg-primary/15 text-emerald-700" : undefined}>{index + 1}</Badge>
                    <Image src={coin.image} alt="" width={32} height={32} className="size-8 rounded-full ring-1 ring-border" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{coin.name}</p>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{coin.symbol}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatter.format(coin.current_price * exchangeRate)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className={hasChange ? positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700" : undefined}>
                    {hasChange && (positive ? <ArrowTrendingUpIcon /> : <ArrowTrendingDownIcon />)}
                    {hasChange ? `${change.toFixed(2)}%` : "--"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          }) : (
            <TableRow><TableCell colSpan={3} className="h-32 text-center text-muted-foreground">Nenhuma criptomoeda encontrada</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
