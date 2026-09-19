const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});
export function formatNumber(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : numberFormatter.format(value);
}

export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: abs < 100 ? 1 : 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}
export function parseDuration(value?: string): number | null {
  if (!value) return null;
  const match = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(value);
  if (!match) return null;
  const seconds =
    Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Number.isSafeInteger(seconds) ? seconds : null;
}
export function formatDuration(
  value: number | null | undefined,
  friendly = false,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const seconds = Math.max(0, Math.floor(value));
  const h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  if (friendly) return `${h ? `${h}h ` : ""}${m}m ${s}s`;
  return [...(h ? [h] : []), m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}
export function formatStart(value?: string): string {
  if (!value) return "Início não informado";
  // Deliberadamente não usa Date: o export não especifica fuso horário.
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/.exec(
    value,
  );
  return match
    ? `${match[3]}/${match[2]}/${match[1]} às ${match[4]}:${match[5]}`
    : value;
}
export function safeDivide(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (numerator === null || denominator === null || denominator === 0)
    return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}
