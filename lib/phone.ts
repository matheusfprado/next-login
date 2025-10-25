const DEFAULT_COUNTRY_CODE = "55";

/**
 * Normaliza o número de telefone para o formato E.164 usado pela Twilio.
 * Remove caracteres não numéricos e adiciona o DDI padrão quando ausente.
 */
export function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `+${digits}`;
  }

  return `+${DEFAULT_COUNTRY_CODE}${digits}`;
}
