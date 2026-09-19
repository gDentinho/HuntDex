import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber, formatRate } from "@/lib/formatters";
import type { Metric } from "@/lib/pxg/types";
export function MetricCard({
  label,
  value,
  unit,
  rate,
  detail,
  icon: Icon,
  profit = false,
  hint,
}: {
  label: string;
  value: Metric | string;
  unit?: string;
  rate?: Metric;
  detail?: string;
  icon: LucideIcon;
  profit?: boolean;
  hint?: string;
}) {
  const tone =
    profit && typeof value === "number"
      ? value < 0
        ? "negative-text"
        : value > 0
          ? "positive-text"
          : ""
      : "";
  return (
    <article
      className={`metric-card ${profit && typeof value === "number" && value !== 0 ? `profit ${value > 0 ? "positive" : ""}` : ""}`}
      aria-label={label}
    >
      <div className="metric-label">
        <span className="flex items-center gap-1.5">
          {label}
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label={`Sobre ${label}`} className="opacity-70">
                  <Info size={11} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{hint}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <Icon />
      </div>
      <div className={`metric-value ${tone}`}>
        {typeof value === "string" ? value : formatNumber(value)}
        {unit && value !== null && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-detail">
        {detail ??
          (rate !== undefined ? (
            <>
              <span className={`rate ${tone}`}>{formatRate(rate)}</span>
              {rate !== null && ` ${unit ?? ""}/h`}
            </>
          ) : (
            "Não informado"
          ))}
      </div>
    </article>
  );
}
