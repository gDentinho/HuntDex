import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { Metric, NormalizedItem } from "@/lib/pxg/types";
import { DataTable, type Column } from "./DataTable";
import { HorizontalChart, SpendingChart } from "./Charts";
import { Panel } from "./Panel";
function itemColumns(supply: boolean): Column<NormalizedItem>[] {
  return [
    {
      id: "name",
      label: supply ? "Supply" : "Item",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          {r.name || "Item sem nome"}
          {r.ignored && (
            <Badge
              variant="outline"
              className="text-[9px] text-muted-foreground"
            >
              Ignored
            </Badge>
          )}
        </span>
      ),
    },
    {
      id: "count",
      label: "Quantidade",
      sortValue: (r) => r.count,
      render: (r) => formatNumber(r.count),
    },
    {
      id: "unit",
      label: "Valor unit.",
      sortValue: (r) => r.unitPrice,
      render: (r) =>
        r.variablePrice ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="underline decoration-dotted underline-offset-4"
                aria-label={`Preço médio de ${r.name}`}
              >
                {formatNumber(r.unitPrice)}*
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Preço médio ponderado: existem preços unitários diferentes para
              este item.
            </TooltipContent>
          </Tooltip>
        ) : (
          formatNumber(r.unitPrice)
        ),
    },
    {
      id: "total",
      label: "Valor total",
      sortValue: (r) => r.total,
      render: (r) => (
        <span className={r.total === 0 ? "muted" : ""}>
          {formatNumber(r.total)}
        </span>
      ),
    },
    {
      id: "share",
      label: supply ? "% dos gastos" : "% do loot",
      render: (r) => formatPercent(r.share),
    },
  ];
}
const lootColumns = itemColumns(false),
  supplyColumns = itemColumns(true);
export function ItemAnalysis({
  rows,
  total,
  supply = false,
}: {
  rows: NormalizedItem[];
  total: Metric;
  supply?: boolean;
}) {
  return (
    <>
      <div className="tab-intro">
        <div>
          <h2>{supply ? "Supplies da sessão" : "Loot da sessão"}</h2>
          <p>
            {rows.length}{" "}
            {rows.length === 1 ? "item registrado" : "itens registrados"} ·
            Valores do seu export do PxG
          </p>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1 text-right">
            {supply ? "Gasto total" : "Loot total"}
          </div>
          <strong className="total">{formatNumber(total)}</strong>
        </div>
      </div>
      <div className="panel">
        <DataTable
          rows={rows}
          columns={supply ? supplyColumns : lootColumns}
          initialSort="total"
          rowKey={(r) => r.name}
          caption={
            supply ? "Supplies utilizados na hunt" : "Loot obtido na hunt"
          }
        />
      </div>
      <div className="two-columns">
        <Panel
          title={
            supply ? "Distribuição dos gastos" : "Itens que mais geraram valor"
          }
          description={
            supply
              ? "Participação nos gastos dos registros de supplies"
              : "Até 8 itens, ordenados pelo valor total"
          }
        >
          {supply ? (
            <SpendingChart
              data={rows.map((r) => ({ name: r.name, value: r.total }))}
            />
          ) : (
            <div className="panel-body">
              <HorizontalChart
                data={rows.map((r) => ({ name: r.name, value: r.total }))}
                label="Valor por item"
              />
            </div>
          )}
        </Panel>
        <Panel
          title={supply ? "Composição dos custos" : "Sobre os valores"}
          description="Uma leitura fiel aos dados da sessão"
        >
          <div className="panel-body text-xs leading-7 text-muted-foreground">
            {supply && rows[0] && rows[0].total > 0 && (
              <p className="mb-4">
                <strong className="text-foreground">{rows[0].name}</strong>{" "}
                concentra {formatPercent(rows[0].share)} do gasto informado, com
                um total de{" "}
                <strong className="text-foreground font-mono">
                  {formatNumber(rows[0].total)}
                </strong>
                .
              </p>
            )}
            <p>
              O total informado em Session tem prioridade. As linhas mantêm os
              valores dos registros; pequenas diferenças podem ocorrer por
              arredondamento.
            </p>
            <p className="mt-3">
              {supply
                ? "Supplies com valor zero aparecem na tabela sem adicionar custo à sessão."
                : "O export não relaciona itens a criaturas. Esta análise mostra apenas os drops registrados."}
            </p>
            {rows.some((r) => r.variablePrice) && (
              <p className="mt-3">
                * Itens com preços diferentes mostram o preço médio ponderado.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
