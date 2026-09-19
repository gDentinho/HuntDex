"use client";
import type {ReactNode} from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  ChartNoAxesCombined,
  Clock3,
  Coins,
  Crosshair,
  FlaskConical,
  Gem,
  Info,
  LayoutGrid,
  Sparkles,
  Star,
  Swords,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/formatters";
import type { HuntAnalysis, Metric, NormalizedItem } from "@/lib/pxg/types";
import { SessionSummary } from "./SessionSummary";
import { MetricCard } from "./MetricCard";
import { FinancialSummary } from "./FinancialSummary";
import { HuntInsights } from "./HuntInsights";
import { HorizontalChart } from "./Charts";
import { Panel, EmptyState } from "./Panel";
import { ItemAnalysis } from "./ItemAnalysis";
import { EnemiesTable } from "./EnemiesTable";
import { DamageAnalysis, ElementCharts } from "./DamageAnalysis";

function TopItems({
  rows,
  supply = false,
}: {
  rows: NormalizedItem[];
  supply?: boolean;
}) {
  return (
    <Panel
      title={supply ? "Maiores gastos" : "Principais drops"}
      description={
        supply
          ? "Supplies com maior custo total"
          : "Itens com maior valor na sessão"
      }
      action={
        <Badge variant="outline" className="text-[9px] muted">
          TOP 5
        </Badge>
      }
    >
      <div className="panel-body">
        {rows.length ? (
          rows.slice(0, 5).map((row) => (
            <div className="mini-row" key={row.name}>
              <div>
                <div className="name">
                  {supply ? (
                    <FlaskConical size={12} className="muted" />
                  ) : (
                    <Gem size={12} className="muted" />
                  )}
                  {row.name}
                </div>
                <div className="sub">
                  {formatNumber(row.count)}{" "}
                  {row.count === 1 ? "unidade" : "unidades"}
                </div>
              </div>
              <div className="text-right">
                <div className="value">{formatNumber(row.total)}</div>
                <div className="sub">{formatPercent(row.share)}</div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </Panel>
  );
}
function CombatMetrics({ analysis }: { analysis: HuntAnalysis }) {
  const c = analysis.combat,
    f = analysis.financial;
  const values: [string, Metric, string?][] = [
    ["Damage Dealt", c.damageDealt],
    ["Damage Taken", c.damageTaken],
    ["DPS", c.dps],
    ["Damage Taken/s", c.damageTakenPerSecond],
    ["Rare Kills", c.rareKills, "gold-text"],
    ["Rare Kills/h", c.rareKillsPerHour],
    [
      "Profit por kill",
      f.profitPerKill,
      f.profitPerKill !== null && f.profitPerKill < 0 ? "negative-text" : "",
    ],
    ["XP por kill", analysis.experience.perKill],
    ["Supply por kill", f.supplyPerKill],
    ["Loot por kill", f.lootPerKill],
  ];
  return (
    <>
      <h2 className="section-heading">
        <Activity />
        Combate e eficiência
      </h2>
      <dl className="compact-metrics">
        {values
          .filter(([, v]) => v !== null)
          .map(([label, value, tone]) => (
            <div key={label} className="compact-metric">
              <dt>{label}</dt>
              <dd className={tone}>{formatNumber(value)}</dd>
            </div>
          ))}
      </dl>
      <div className="flex flex-wrap gap-x-7 gap-y-2 mt-4 text-[10px] text-muted-foreground">
        {f.profitPerMinute !== null && (
          <span>
            Profit/min{" "}
            <strong className="font-mono text-foreground ml-2 font-normal">
              {formatNumber(f.profitPerMinute)}
            </strong>
          </span>
        )}
        {c.damageDealtPerKill !== null && (
          <span>
            Dano causado/kill{" "}
            <strong className="font-mono text-foreground ml-2 font-normal">
              {formatNumber(c.damageDealtPerKill)}
            </strong>
          </span>
        )}
        {c.damageTakenPerKill !== null && (
          <span>
            Dano recebido/kill{" "}
            <strong className="font-mono text-foreground ml-2 font-normal">
              {formatNumber(c.damageTakenPerKill)}
            </strong>
          </span>
        )}
      </div>
    </>
  );
}
export function HuntDashboard({
  analysis: a,
  demo,
  onEdit,
  onNew,
  saveAction,
}: {
  analysis: HuntAnalysis;
  demo: boolean;
  onEdit: () => void;
  onNew: () => void;
  saveAction?:ReactNode;
}) {
  const f = a.financial,
    c = a.combat,
    e = a.experience;
  const rares = a.enemies.filter((r) => r.rare && r.count > 0);
  const hasCombat = Object.values(c).some((v) => v !== null);
  return (
    <section className="dashboard">
      <SessionSummary analysis={a} demo={demo} onEdit={onEdit} onNew={onNew} saveAction={saveAction}/>
      <div className="metric-grid">
        {(f.profit !== null || f.profitPerHour !== null) && (
          <MetricCard
            label="Profit"
            value={f.profit}
            rate={f.profitPerHour}
            icon={Coins}
            profit
            hint="Resultado financeiro informado em Session ou, na ausência, loot menos supplies."
          />
        )}
        {(e.total !== null || e.perHour !== null) && (
          <MetricCard
            label="Experience"
            value={e.total}
            unit="XP"
            rate={e.perHour}
            icon={Zap}
          />
        )}
        {(f.rawGains !== null || f.rawGainsPerHour !== null) && (
          <MetricCard
            label="Loot"
            value={f.rawGains}
            rate={f.rawGainsPerHour}
            icon={Gem}
          />
        )}
        {(f.supplies !== null || f.suppliesPerHour !== null) && (
          <MetricCard
            label="Supplies"
            value={f.supplies}
            rate={f.suppliesPerHour}
            icon={FlaskConical}
          />
        )}
        {(c.kills !== null || c.killsPerHour !== null) && (
          <MetricCard
            label="Kills"
            value={c.kills}
            rate={c.killsPerHour}
            icon={Crosshair}
          />
        )}
        {(a.session.durationSeconds !== null ||
          e.timeToNextLevel !== undefined) && (
          <MetricCard
            label="Duração"
            value={a.session.durationFormatted}
            detail={
              e.timeToNextLevel
                ? `Próximo level em ${e.timeToNextLevel}`
                : "Tempo registrado da sessão"
            }
            icon={Clock3}
          />
        )}
      </div>
      <Tabs defaultValue="overview" className="dashboard-tabs">
        <TabsList aria-label="Análises da hunt">
          <TabsTrigger value="overview">
            <LayoutGrid />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="loot">
            <Gem />
            Loot <span className="tab-count">{a.drops.length}</span>
          </TabsTrigger>
          <TabsTrigger value="supplies">
            <FlaskConical />
            Supplies <span className="tab-count">{a.supplies.length}</span>
          </TabsTrigger>
          <TabsTrigger value="enemies">
            <Crosshair />
            Pokémon <span className="tab-count">{a.enemies.length}</span>
          </TabsTrigger>
          <TabsTrigger value="damage">
            <Swords />
            Damage
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="overview-primary">
            <FinancialSummary analysis={a} />
            <Panel
              title="Distribuição de kills"
              description="Pokémon mais derrotados nesta sessão"
              action={<Crosshair size={16} className="muted" />}
            >
              <div className="panel-body pb-1">
                <HorizontalChart
                  data={a.enemies.map((r) => ({
                    name: r.name,
                    value: r.count,
                    color: r.rare ? "#d7b978" : undefined,
                  }))}
                  label="Distribuição de kills"
                />
              </div>
              <p className="chart-note">
                {c.kills === null
                  ? "Total não informado"
                  : `${formatNumber(c.kills)} kills no total`}
                {c.rareKills !== null && (
                  <>
                    {" "}
                    <span className="mx-2">·</span>
                    <span className="gold-text">
                      {formatNumber(c.rareKills)} raros
                    </span>
                  </>
                )}
              </p>
            </Panel>
          </div>
          <HuntInsights insights={a.insights} />
          {hasCombat && <CombatMetrics analysis={a} />}
          <div className="two-columns">
            <TopItems rows={a.drops} />
            <TopItems rows={a.supplies} supply />
          </div>
          {rares.length > 0 && (
            <div className="rare-banner">
              <div className="rare-banner-title">
                <Sparkles size={18} />
                Encontros raros{" "}
                <Badge className="rare-badge" variant="outline">
                  {formatNumber(c.rareKills)}
                </Badge>
              </div>
              <div className="rare-list">
                {rares.slice(0, 12).map((row) => (
                  <span key={row.name}>
                    <Star />
                    {row.name}
                    <span className="font-mono muted">×{row.count}</span>
                  </span>
                ))}
                {rares.length > 12 && <span>Veja todos na aba Pokémon</span>}
              </div>
            </div>
          )}
          {a.damageByElement.length > 0 && (
            <>
              <h2 className="section-heading">
                <ChartNoAxesCombined />
                Elementos em combate
              </h2>
              <ElementCharts analysis={a} />
            </>
          )}
          {(c.damageDealt !== null || c.damageTaken !== null) && (
            <div className="flex flex-wrap gap-6 text-[10px] muted mt-4">
              <span className="flex items-center gap-2">
                <ArrowUpRight size={13} />
                Dano causado:{" "}
                <strong className="font-mono text-foreground font-normal">
                  {formatNumber(c.damageDealt)}
                </strong>
              </span>
              <span className="flex items-center gap-2">
                <ArrowDownToLine size={13} />
                Dano recebido:{" "}
                <strong className="font-mono text-foreground font-normal">
                  {formatNumber(c.damageTaken)}
                </strong>
              </span>
            </div>
          )}
        </TabsContent>
        <TabsContent value="loot">
          <ItemAnalysis rows={a.drops} total={f.rawGains} />
        </TabsContent>
        <TabsContent value="supplies">
          <ItemAnalysis rows={a.supplies} total={f.supplies} supply />
        </TabsContent>
        <TabsContent value="enemies">
          <EnemiesTable analysis={a} />
        </TabsContent>
        <TabsContent value="damage">
          <DamageAnalysis analysis={a} />
        </TabsContent>
      </Tabs>
      <details className="data-notes">
        <summary>
          <Info />
          Sobre os dados desta análise
          {a.warnings.length > 0 && (
            <span>
              · {a.warnings.length}{" "}
              {a.warnings.length === 1 ? "observação" : "observações"}
            </span>
          )}
        </summary>
        <ul>
          <li>
            Os valores de Session têm prioridade. Quando ausentes, usamos os
            registros disponíveis. Traços indicam métricas indisponíveis.
          </li>
          <li>
            Percentuais nas tabelas usam os totais da sessão. Diferenças entre
            Session e os registros podem alterar a soma desses percentuais.
          </li>
          {demo && (
            <li>
              Esta é uma sessão de demonstração. Os detalhes de dano e drops
              complementares são dados sintéticos compatíveis com o formato
              informado.
            </li>
          )}
          {a.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
