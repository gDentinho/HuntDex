"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, ExternalLink, Gem, Sparkles, Target, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/analyzer/DataTable";
import { EmptyState, Panel } from "@/components/analyzer/Panel";
import { MetricCard } from "@/components/analyzer/MetricCard";
import { buildRareTracker, type RareSpecies } from "@/lib/analytics/rares";
import { defaultPeriod, filterByPeriod, getDateRange, type PeriodSelection } from "@/lib/analytics/period";
import type { SavedHunt } from "@/lib/db/types";
import { formatNumber } from "@/lib/formatters";
import { PeriodFilter } from "./PeriodFilter";

function formatDate(timestamp?: number) {
  return timestamp === undefined ? "Data não informada" : new Date(timestamp).toLocaleDateString("pt-BR");
}

export function RareTrackerPage({ hunts, onOpen }: { hunts: SavedHunt[]; onOpen: (hunt: SavedHunt) => void }) {
  const [period, setPeriod] = useState<PeriodSelection>(defaultPeriod);
  const range = useMemo(() => getDateRange(period), [period]);
  const filtered = useMemo(() => filterByPeriod(hunts, range), [hunts, range]);
  const tracker = useMemo(() => buildRareTracker(filtered), [filtered]);
  const huntById = useMemo(() => new Map(hunts.map((hunt) => [hunt.id, hunt])), [hunts]);
  const columns = useMemo<Column<RareSpecies>[]>(() => [
    { id: "name", label: "Pokémon", render: (row) => <span className="flex items-center gap-2 font-medium">{row.name}{row.shiny && <Badge className="rare-badge" variant="outline">Shiny</Badge>}</span>, sortValue: (row) => row.name },
    { id: "count", label: "Quantidade", render: (row) => formatNumber(row.count), sortValue: (row) => row.count },
    { id: "first", label: "Primeira vez", render: (row) => formatDate(row.first), sortValue: (row) => row.first ?? 0 },
    { id: "last", label: "Última vez", render: (row) => formatDate(row.last), sortValue: (row) => row.last ?? 0 },
  ], []);
  const mismatch = tracker.reportedTotal !== null && tracker.reportedTotal !== tracker.total;

  return <div className="space-y-5">
    <header className="page-heading"><div><span className="tab-intro">Registro de encontros</span><h1>Rare Tracker</h1><p>Rares derrotados nas hunts salvas, agrupados por espécie e período.</p></div><PeriodFilter value={period} onChange={setPeriod} /></header>

    {range.invalid && <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200"><AlertTriangle className="mr-2 inline h-4 w-4" />Informe um período personalizado válido.</div>}
    {mismatch && <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />O total reportado pela sessão ({formatNumber(tracker.reportedTotal)}) difere dos rares identificados por espécie ({formatNumber(tracker.total)}). A lista abaixo usa os inimigos marcados como Rare.</div>}

    <section className="library-metrics" aria-label="Resumo de rares">
      <MetricCard label="Rare kills" value={tracker.total} detail="Identificados por espécie" icon={Gem} />
      <MetricCard label="Shinies" value={tracker.shinies} detail="Derrotados" icon={Sparkles} />
      <MetricCard label="Outros rares" value={tracker.others} detail="Sem Shiny no nome" icon={Target} />
      <MetricCard label="Hunts com Rare" value={tracker.huntsWithRare} detail={`de ${filtered.length} no período`} icon={UsersRound} />
      <MetricCard label="Rare kills/h" value={tracker.perHour} detail="Taxa ponderada pelo tempo" icon={Clock3} />
      <MetricCard label="Espécies" value={tracker.species.length} detail="Rares diferentes" icon={Gem} />
    </section>

    {!tracker.total ? <div className="library-empty"><EmptyState>Nenhum Rare registrado neste período.</EmptyState></div> : <div className="two-columns">
      <Panel title="Rares por espécie" description="Quantidade, primeiro e último registro nas hunts do período."><DataTable rows={tracker.species} columns={columns} initialSort="count" rowKey={(row) => row.name} caption="Rares agrupados por espécie" /></Panel>
      <Panel title="Últimos Rares" description="A data corresponde ao início da hunt; o JSON não informa o horário individual do encontro.">
        <div className="selection-list">{tracker.timeline.slice(0, 25).map((event) => { const hunt = huntById.get(event.huntId); return <article key={`${event.huntId}-${event.name}`} className="selection-row"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10"><Sparkles className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate">{event.name}</strong><span className="muted text-sm">{formatDate(event.timestamp)} · data da hunt · {event.player}</span></span><Badge variant="outline">×{formatNumber(event.count)}</Badge><Button variant="ghost" size="sm" disabled={!hunt} aria-label={`Abrir análise de ${event.name}`} onClick={() => hunt && onOpen(hunt)}>Abrir análise <ExternalLink /></Button></article>; })}</div>
      </Panel>
    </div>}
  </div>;
}
