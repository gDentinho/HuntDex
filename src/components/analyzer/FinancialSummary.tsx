import { Panel } from "./Panel";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { HuntAnalysis } from "@/lib/pxg/types";
export function FinancialSummary({ analysis }: { analysis: HuntAnalysis }) {
  const f = analysis.financial;
  const state =
    f.profit === null
      ? "Sem resultado"
      : f.profit > 0
        ? "Lucro"
        : f.profit < 0
          ? "Prejuízo"
          : "Empate";
  const tone =
    f.profit === null || f.profit === 0
      ? "neutral"
      : f.profit > 0
        ? "positive"
        : "";
  const textTone =
    f.profit === null || f.profit === 0
      ? ""
      : f.profit > 0
        ? "positive-text"
        : "negative-text";
  return (
    <Panel
      title="Resumo financeiro"
      description="O que entrou. O que saiu. O que ficou."
      action={<span className={`financial-result ${tone}`}>{state}</span>}
    >
      <div className="panel-body">
        <div className="financial-ledger">
          <span />
          <span className="column-title text-right">Total</span>
          <span className="column-title text-right">Por hora</span>
          <span className="muted">Loot</span>
          <span className="amount positive-text">
            {f.rawGains === null ? "—" : `+ ${formatNumber(f.rawGains)}`}
          </span>
          <span className="amount muted">
            {formatNumber(f.rawGainsPerHour)}
          </span>
          <span className="muted">Supplies</span>
          <span className="amount negative-text">
            {f.supplies === null ? "—" : `− ${formatNumber(f.supplies)}`}
          </span>
          <span className="amount muted">
            {formatNumber(f.suppliesPerHour)}
          </span>
          <span className="profit-row">Profit</span>
          <span className={`amount profit-row ${textTone}`}>
            {formatNumber(f.profit)}
          </span>
          <span className={`amount profit-row ${textTone}`}>
            {formatNumber(f.profitPerHour)}
          </span>
        </div>
        {f.lootSupplyRatio !== null && (
          <div className="coverage">
            <div className="coverage-label">
              <span>Relação loot / supplies</span>
              <strong className="text-foreground font-mono">
                {formatNumber(f.lootSupplyRatio)}x
              </strong>
            </div>
            <div className="coverage-track">
              <span
                style={{ width: `${Math.min(f.lootSupplyRatio * 100, 100)}%` }}
              />
            </div>
            <p>
              O loot equivale a{" "}
              <span className="text-foreground">
                {formatPercent(f.lootSupplyRatio * 100)}
              </span>{" "}
              do gasto com supplies.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}
