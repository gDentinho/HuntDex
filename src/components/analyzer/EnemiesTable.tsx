import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { HuntAnalysis, NormalizedEnemy } from "@/lib/pxg/types";
import { DataTable, type Column } from "./DataTable";
import { Panel } from "./Panel";
import { HorizontalChart } from "./Charts";
const columns: Column<NormalizedEnemy>[] = [
  {
    id: "name",
    label: "Pokémon",
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        {r.rare && <Star className="gold-text" size={13} />}
        <span className={r.rare ? "gold-text" : ""}>
          {r.name || "Pokémon sem nome"}
        </span>
        {r.ignored && (
          <Badge variant="outline" className="text-[9px]">
            Ignored
          </Badge>
        )}
      </span>
    ),
  },
  {
    id: "count",
    label: "Kills",
    sortValue: (r) => r.count,
    render: (r) => formatNumber(r.count),
  },
  { id: "share", label: "% das kills", render: (r) => formatPercent(r.share) },
  {
    id: "rare",
    label: "Raro",
    render: (r) =>
      r.rare ? (
        <Badge className="rare-badge" variant="outline">
          <Star size={10} />
          Rare
        </Badge>
      ) : (
        <span className="muted">—</span>
      ),
  },
];
export function EnemiesTable({ analysis }: { analysis: HuntAnalysis }) {
  return (
    <>
      <div className="tab-intro">
        <div>
          <h2>Pokémon derrotados</h2>
          <p>
            {analysis.enemies.length} espécies nos registros · Raros
            identificados pelo export
          </p>
        </div>
        <div className="total">
          {formatNumber(analysis.combat.kills)}{" "}
          <span className="text-xs muted">kills</span>
        </div>
      </div>
      <div className="panel">
        <DataTable
          rows={analysis.enemies}
          columns={columns}
          initialSort="count"
          rowKey={(r) => r.name}
          rowClassName={(r) => (r.rare ? "rare-row" : "")}
          caption="Pokémon derrotados na sessão"
        />
      </div>
      <div className="mt-[18px]">
        <Panel
          title="Kills por Pokémon"
          description="Até 12 espécies mais derrotadas"
        >
          <div className="panel-body">
            <HorizontalChart
              data={analysis.enemies.map((r) => ({
                name: r.name,
                value: r.count,
                color: r.rare ? "#d7b978" : undefined,
              }))}
              label="Kills por Pokémon"
              limit={12}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}
