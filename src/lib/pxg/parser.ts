import { validateHunt, type ValidationResult } from "./validators";
export type ParseResult =
  ValidationResult | { ok: false; kind: "syntax"; message: string };
export function parseHunt(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      ok: false,
      kind: "syntax",
      message:
        "Não foi possível ler este JSON. Verifique se você copiou todo o conteúdo das estatísticas do PxG.",
    };
  }
  return validateHunt(value);
}
