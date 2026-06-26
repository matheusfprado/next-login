"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Currency = "BRL" | "USD";

interface CurrencyContextValue {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: number) => void;
  convertFromUsd: (value: number) => number;
  formatCurrency: (valueUsd: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const currencyConfig: Record<Currency, { locale: string; currency: Currency }> = {
  BRL: { locale: "pt-BR", currency: "BRL" },
  USD: { locale: "en-US", currency: "USD" },
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BRL");
  const [exchangeRate, setExchangeRateState] = useState(5);

  useEffect(() => {
    const savedCurrency = window.localStorage.getItem("currency");
    const savedExchangeRate = window.localStorage.getItem("exchangeRate");

    if (savedCurrency === "BRL" || savedCurrency === "USD") {
      setCurrencyState(savedCurrency);
    }

    if (savedExchangeRate) {
      const parsedRate = Number(savedExchangeRate);
      if (Number.isFinite(parsedRate) && parsedRate > 0) {
        setExchangeRateState(parsedRate);
      }
    }
  }, []);

  const setCurrency = useCallback((nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem("currency", nextCurrency);
  }, []);

  const setExchangeRate = useCallback((rate: number) => {
    if (!Number.isFinite(rate) || rate <= 0) return;

    setExchangeRateState(rate);
    window.localStorage.setItem("exchangeRate", String(rate));
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const convertFromUsd = (valueUsd: number) =>
      currency === "BRL" ? valueUsd * exchangeRate : valueUsd;

    const formatCurrency = (valueUsd: number) => {
      const config = currencyConfig[currency];
      const convertedValue = convertFromUsd(Number.isFinite(valueUsd) ? valueUsd : 0);

      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.currency,
        maximumFractionDigits: convertedValue >= 100 ? 0 : 2,
      }).format(convertedValue);
    };

    return {
      currency,
      exchangeRate,
      setCurrency,
      setExchangeRate,
      convertFromUsd,
      formatCurrency,
    };
  }, [currency, exchangeRate, setCurrency, setExchangeRate]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }

  return context;
}
