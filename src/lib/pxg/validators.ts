import { parseDuration } from "../formatters";
import type { PxGHuntData } from "./types";

export const numericSessionFields = [
  "Profit",
  "Time to next level seconds",
  "Damage taken",
  "Paused seconds",
  "Supplies",
  "Session ID",
  "Supplies per hour",
  "Profit per hour",
  "Duration seconds",
  "Rare kills",
  "Damage dealt per second",
  "Experience per hour",
  "Kills per hour",
  "Damage dealt",
  "Damage taken per second",
  "Rare kills per hour",
  "Kills",
  "Raw gains",
  "Raw gains per hour",
  "Experience",
] as const;
const stringSessionFields = [
  "Status",
  "Time to next level",
  "Session type",
  "Duration",
  "Start",
] as const;
const arrayFields = [
  "Drops",
  "Supplies",
  "Damage",
  "Enemies Defeated",
  "Experience",
] as const;
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
type FieldType = "string" | "number" | "count" | "boolean" | "nullableBoolean";
const itemFields: Record<string, FieldType> = {
  Item: "string",
  Player: "string",
  Count: "count",
  "Unit price": "number",
  "Total price": "number",
  Ignored: "nullableBoolean",
};
const schemas: Record<
  (typeof arrayFields)[number],
  Record<string, FieldType>
> = {
  Drops: itemFields,
  Supplies: itemFields,
  Damage: {
    Enemy: "string",
    Element: "string",
    Player: "string",
    "Damage dealt": "number",
    "Damage taken": "number",
  },
  "Enemies Defeated": {
    Enemy: "string",
    Player: "string",
    Count: "count",
    Rare: "boolean",
    Ignored: "boolean",
  },
  Experience: { Player: "string", Experience: "number" },
};
export type ValidationResult =
  | { ok: true; data: PxGHuntData }
  | { ok: false; kind: "structure" | "fields" | "empty"; message: string };
const invalid = (path: string, expected: string): ValidationResult => ({
  ok: false,
  kind: "fields",
  message: `O campo ${path} deve ser ${expected}. Confira os dados exportados.`,
});
const numeric = (v: unknown, signed = false) =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  Math.abs(v) <= Number.MAX_SAFE_INTEGER &&
  (signed || v >= 0);

export function validateHunt(value: unknown): ValidationResult {
  if (
    !isRecord(value) ||
    ![...arrayFields, "Session"].some((key) => Object.hasOwn(value, key))
  )
    return {
      ok: false,
      kind: "structure",
      message:
        "O JSON é válido, mas não encontramos dados de uma sessão de hunt do PxG.",
    };
  let hasData = false;
  for (const area of arrayFields) {
    if (!Object.hasOwn(value, area)) continue;
    const rows = value[area];
    if (!Array.isArray(rows)) return invalid(area, "uma lista");
    hasData ||= rows.length > 0;
    for (let index = 0; index < rows.length; index++) {
      const row: unknown = rows[index];
      if (!isRecord(row)) return invalid(`${area}[${index}]`, "um objeto");
      for (const [field, type] of Object.entries(schemas[area])) {
        const entry = row[field],
          path = `${area}[${index}].${field}`;
        if (type === "string" && typeof entry !== "string")
          return invalid(path, "um texto");
        if ((type === "number" || type === "count") && !numeric(entry))
          return invalid(path, "um número finito e não negativo");
        if (type === "count" && !Number.isInteger(entry))
          return invalid(path, "um número inteiro");
        if (type === "boolean" && typeof entry !== "boolean")
          return invalid(path, "true ou false");
        if (
          type === "nullableBoolean" &&
          entry !== null &&
          typeof entry !== "boolean"
        )
          return invalid(path, "true, false ou null");
      }
    }
  }
  if (Object.hasOwn(value, "Session")) {
    if (!isRecord(value.Session)) return invalid("Session", "um objeto");
    for (const field of numericSessionFields) {
      if (!Object.hasOwn(value.Session, field)) continue;
      if (
        !numeric(
          value.Session[field],
          field === "Profit" || field === "Profit per hour",
        )
      )
        return invalid(`Session.${field}`, "um número finito válido");
      if (
        ["Kills", "Rare kills", "Session ID"].includes(field) &&
        !Number.isInteger(value.Session[field])
      )
        return invalid(`Session.${field}`, "um número inteiro");
      if (field !== "Session ID") hasData = true;
    }
    for (const field of stringSessionFields) {
      if (!Object.hasOwn(value.Session, field)) continue;
      if (typeof value.Session[field] !== "string")
        return invalid(`Session.${field}`, "um texto");
    }
    if (typeof value.Session.Duration === "string") {
      if (parseDuration(value.Session.Duration) === null)
        return invalid("Session.Duration", "uma duração no formato HH:MM:SS");
      hasData = true;
    }
  }
  return hasData
    ? { ok: true, data: value as PxGHuntData }
    : {
        ok: false,
        kind: "empty",
        message: "Esta sessão não possui dados suficientes para análise.",
      };
}
