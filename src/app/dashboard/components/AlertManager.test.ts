import { describe, expect, it } from "vitest";

import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/src/modules/alerts/currency-input";

describe("máscara monetária dos alertas", () => {
  it("formata o preço em USD na moeda selecionada", () => {
    const value = formatCurrencyInput(100, "BRL", 5);

    expect(value).toContain("500,00");
    expect(value).toContain("R$");
  });

  it("converte o valor mascarado de volta para USD", () => {
    expect(parseCurrencyInput("R$ 500,00", 5)).toBe(100);
  });

  it("retorna vazio quando não há valor digitado", () => {
    expect(parseCurrencyInput("", 5)).toBeNull();
  });
});
