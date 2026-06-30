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

export type Currency = "BRL" | "USD" | "EUR" | "GBP";

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
  EUR: { locale: "de-DE", currency: "EUR" },
  GBP: { locale: "en-GB", currency: "GBP" },
};

const settingCurrencyMap: Record<string, Currency> = {
  "Real (BRL)": "BRL",
  "Dólar americano (USD)": "USD",
  "Euro (EUR)": "EUR",
  "Libra (GBP)": "GBP",
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("BRL");
  const [exchangeRate, setExchangeRateState] = useState(1);

  const setCurrency = useCallback((nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem("currency", nextCurrency);
  }, []);

  const setExchangeRate = useCallback((rate: number) => {
    if (!Number.isFinite(rate) || rate <= 0) return;
    setExchangeRateState(rate);
  }, []);

  useEffect(() => {
    const savedCurrency = window.localStorage.getItem("currency");
    if (isCurrency(savedCurrency)) setCurrencyState(savedCurrency);

    const loadPreferences = async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) return;
      const settings: unknown = await response.json();
      if (!settings || typeof settings !== "object") return;

      if ("currency" in settings && typeof settings.currency === "string") {
        const preferred = settingCurrencyMap[settings.currency];
        if (preferred) setCurrency(preferred);
      }
      if ("language" in settings && typeof settings.language === "string") {
        document.documentElement.lang = languageCode(settings.language);
      }
      if (
        "dashboardDensity" in settings &&
        typeof settings.dashboardDensity === "string"
      ) {
        document.body.dataset.dashboardDensity = densityCode(
          settings.dashboardDensity
        );
      }
    };

    void loadPreferences();
  }, [setCurrency]);

  useEffect(() => {
    if (currency === "USD") {
      setExchangeRateState(1);
      return;
    }

    const controller = new AbortController();
    const loadRate = async () => {
      try {
        const response = await fetch(`/api/exchange-rates?currency=${currency}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (
          data &&
          typeof data === "object" &&
          "rate" in data &&
          typeof data.rate === "number"
        ) {
          setExchangeRate(data.rate);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Erro ao carregar câmbio:", error);
        }
      }
    };

    void loadRate();
    return () => controller.abort();
  }, [currency, setExchangeRate]);

  const value = useMemo<CurrencyContextValue>(() => {
    const convertFromUsd = (valueUsd: number) => valueUsd * exchangeRate;
    const formatCurrency = (valueUsd: number) => {
      const config = currencyConfig[currency];
      const convertedValue = convertFromUsd(
        Number.isFinite(valueUsd) ? valueUsd : 0
      );
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

function isCurrency(value: string | null): value is Currency {
  return value === "BRL" || value === "USD" || value === "EUR" || value === "GBP";
}

export function languageCode(language: string) {
  if (language === "Inglês (EUA)") return "en-US";
  if (language === "Espanhol") return "es";
  if (language === "Francês") return "fr";
  return "pt-BR";
}

export function densityCode(density: string) {
  if (density === "Compacto") return "compact";
  if (density === "Espaçoso") return "spacious";
  return "comfortable";
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
