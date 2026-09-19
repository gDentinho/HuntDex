import type { CSSProperties } from "react";
import { formatNumber, formatPercent } from "@/lib/formatters";
import { elementColor } from "@/lib/pxg/elements";
import type { DamageGroup, HuntAnalysis } from "@/lib/pxg/types";
import { DataTable, type Column } from "./DataTable";
import { HorizontalChart } from "./Charts";
import { Panel } from "./Panel";
export function ElementBadge({ name }: { name: string }) {
  return (
    <span
      className="element-badge"
      style={{ "--element-color": elementColor(name) } as CSSProperties}
    >
      {name || "Não informado"}
    </span>
  );
}
const damageColumns: Column<DamageGroup>[] = [
  { id: "name", label: "Pokémon", render: (r) => r.name },
  {
    id: "dealt",
    label: "Damage Dealt",
    sortValue: (r) => r.dealt,
    render: (r) => formatNumber(r.dealt),
  },
  {
    id: "dealtShare",
    label: "% causado",
    render: (r) => formatPercent(r.dealtShare),
  },
  {
    id: "taken",
    label: "Damage Taken",
    sortValue: (r) => r.taken,
    render: (r) => formatNumber(r.taken),
  },
  {
    id: "takenShare",
    label: "% recebido",
    render: (r) => formatPercent(r.takenShare),
  },
];
const elementColumns: Column<DamageGroup>[] = damageColumns.map((c) =>
  c.id === "name"
    ? { ...c, label: "Elemento", render: (r) => <ElementBadge name={r.name} /> }
    : c,
);
export function ElementCharts({ analysis }: { analysis: HuntAnalysis }) {
  return (
    <div className="two-columns">
      {(["dealt", "taken"] as const).map((perspective) => (
        <Panel
          key={perspective}
          title={
            perspective === "dealt"
              ? "Dano causado por elemento"
              : "Dano recebido por elemento"
          }
          description="Participação dos elementos nos registros de dano"
        >
          <div className="panel-body">
            <HorizontalChart
              data={analysis.damageByElement.map((r) => ({
                name: r.name,
                value: r[perspective],
                color: elementColor(r.name),
              }))}
              label={
                perspective === "dealt"
                  ? "Dano causado por elemento"
                  : "Dano recebido por elemento"
              }
              limit={12}
            />
          </div>
        </Panel>
      ))}
    </div>
  );
}
export function DamageAnalysis({ analysis }: { analysis: HuntAnalysis }) {
  return (
    <>
      <div className="tab-intro">
        <div>
          <h2>Análise de dano</h2>
          <p>
            Registros agrupados por Pokémon e elemento, com dano causado e
            recebido separados.
          </p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header pb-5">
          <h3 className="panel-title">Damage by Pokémon</h3>
          <span className="text-[10px] muted">
            Todos os elementos agrupados
          </span>
        </div>
        <DataTable
          rows={analysis.damageByEnemy}
          columns={damageColumns}
          initialSort="dealt"
          rowKey={(r) => r.name}
          caption="Dano causado e recebido por Pokémon"
        />
      </div>
      <ElementCharts analysis={analysis} />
      <div className="panel mt-[18px]">
        <div className="panel-header pb-5">
          <h3 className="panel-title">Damage by Element</h3>
        </div>
        <DataTable
          rows={analysis.damageByElement}
          columns={elementColumns}
          initialSort="dealt"
          rowKey={(r) => r.name}
          caption="Dano causado e recebido por elemento"
        />
      </div>
    </>
  );
}
