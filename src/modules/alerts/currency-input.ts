import type { Currency } from "@/src/contexts/CurrencyContext";

const currencyConfig: Record<Currency, { locale: string; currency: Currency }> = {
  BRL: { locale: "pt-BR", currency: "BRL" },
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "de-DE", currency: "EUR" },
  GBP: { locale: "en-GB", currency: "GBP" },
};

export function formatCurrencyInput(
  valueUsd: number,
  currency: Currency,
  exchangeRate: number
) {
  const config = currencyConfig[currency];
  const convertedValue = valueUsd * exchangeRate;

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(convertedValue) ? convertedValue : 0);
}

export function parseCurrencyInput(value: string, exchangeRate: number) {
  const digits = value.replace(/\D/g, "");
  if (!digits || !Number.isFinite(exchangeRate) || exchangeRate <= 0) return null;

  return Number(digits) / 100 / exchangeRate;
}
