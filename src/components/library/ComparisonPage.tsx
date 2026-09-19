"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BarChart3, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Panel } from "@/components/analyzer/Panel";
import { compareHunts, type ComparisonMetric } from "@/lib/analytics/compare";
import type { SavedHunt } from "@/lib/db/types";
import { formatDuration, formatNumber, formatPercent } from "@/lib/formatters";

const PAGE_SIZE = 20;
const chartKeys = ["xpPerHour", "profitPerHour", "killsPerHour", "suppliesPerHour", "takenPerHour"];

function huntDate(hunt: SavedHunt) {
  return hunt.startTimestamp === undefined ? "Data não informada" : new Date(hunt.startTimestamp).toLocaleDateString("pt-BR");
}

function displayMetric(metric: ComparisonMetric, value: number | null) {
  return metric.duration ? formatDuration(value, true) : formatNumber(value);
}

function ComparisonTable({ title, rows, hunts }: { title: string; rows: ComparisonMetric[]; hunts: SavedHunt[] }) {
  return (
    <Panel title={title} description={title === "Totais" ? "Valores registrados em cada sessão." : "Indicadores ajustados por hora ou por kill."}>
      <div className="table-scroll">
        <table className="comparison-table">
          <caption className="sr-only">{title} das hunts selecionadas</caption>
          <thead><tr><th>Métrica</th>{hunts.map((hunt, index) => <th key={hunt.id}>Hunt {index + 1}<span className="block font-normal muted">{hunt.player}</span></th>)}</tr></thead>
          <tbody>{rows.map((metric) => {
            const known = metric.values.filter((value): value is number => value !== null);
            const highest = known.length ? Math.max(...known) : null;
            return <tr key={metric.key}><th scope="row">{metric.label}</th>{metric.values.map((value, index) => <td key={hunts[index].id} className={value !== null && value === highest ? "positive-text font-semibold" : ""}>{displayMetric(metric, value)}{value !== null && value === highest && <Trophy className="ml-1 inline h-3 w-3" aria-label="Maior valor" />}</td>)}</tr>;
          })}</tbody>
        </table>
      </div>
    </Panel>
  );
}

export function ComparisonPage({ hunts, selectedIds, onSelection }: { hunts: SavedHunt[]; selectedIds: string[]; onSelection: (ids: string[]) => void }) {
  const [draftIds, setDraftIds] = useState(selectedIds);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const matching = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return hunts;
    return hunts.filter((hunt) => `${hunt.player} ${hunt.start ?? ""} ${huntDate(hunt)}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [hunts, query]);
  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = matching.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = useMemo(() => selectedIds.map((id) => hunts.find((hunt) => hunt.id === id)).filter((hunt): hunt is SavedHunt => Boolean(hunt)), [hunts, selectedIds]);
  const comparison = useMemo(() => selected.length >= 2 && selected.length <= 5 ? compareHunts(selected) : null, [selected]);

  function toggle(id: string) {
    setDraftIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 5 ? [...current, id] : current);
  }

  if (hunts.length < 2) return <div className="library-empty"><EmptyState>Salve pelo menos duas hunts para utilizar o comparador.</EmptyState></div>;

  return <div className="space-y-5">
    <header className="page-heading"><div><span className="tab-intro">Análise lado a lado</span><h1>Comparar Hunts</h1><p>Selecione de duas a cinco sessões para comparar volume e eficiência.</p></div></header>

    <Panel title="Selecionar hunts" description={`${draftIds.length} de 5 selecionadas`} action={<Button disabled={draftIds.length < 2 || draftIds.length > 5} onClick={() => onSelection(draftIds)}>Comparar selecionadas <ArrowRight /></Button>}>
      <div className="library-toolbar">
        <label className="control flex-1"><span className="field-label">Buscar hunt</span><span className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 muted" /><input className="w-full pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Jogador ou data" /></span></label>
      </div>
      <div className="selection-list">{visible.map((hunt) => {
        const checked = draftIds.includes(hunt.id);
        return <label key={hunt.id} className="selection-row"><input type="checkbox" checked={checked} disabled={!checked && draftIds.length >= 5} onChange={() => toggle(hunt.id)} /><span className="min-w-0 flex-1"><strong className="block truncate">{hunt.player}</strong><span className="muted">{huntDate(hunt)} · {formatDuration(hunt.analysis.session.durationSeconds, true)}</span></span><span className="hidden text-right sm:block"><span className="block">{formatNumber(hunt.analysis.experience.perHour)} XP/h</span><span className={typeof hunt.analysis.financial.profitPerHour === "number" && hunt.analysis.financial.profitPerHour < 0 ? "negative-text" : "positive-text"}>{formatNumber(hunt.analysis.financial.profitPerHour)} profit/h</span></span></label>;
      })}{!visible.length && <EmptyState>Nenhuma hunt corresponde à busca.</EmptyState>}</div>
      {pages > 1 && <div className="flex items-center justify-between pt-3 text-sm"><span className="muted">{matching.length} hunts encontradas</span><div className="flex items-center gap-2"><Button variant="ghost" size="sm" disabled={currentPage === 0} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span>{currentPage + 1} / {pages}</span><Button variant="ghost" size="sm" disabled={currentPage === pages - 1} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></div>}
    </Panel>

    {!comparison ? <div className="library-empty"><EmptyState>Selecione e compare pelo menos duas hunts.</EmptyState></div> : <>
      {selected.length === 2 && <section className="library-metrics" aria-label="Diferenças entre as hunts">{comparison.normalized.filter((metric) => ["xpPerHour", "profitPerHour", "killsPerHour"].includes(metric.key)).map((metric) => <article className="metric-card" key={metric.key}><div className="metric-label"><span>{metric.label}</span><BarChart3 /></div><div className={`metric-value ${typeof metric.difference === "number" && metric.difference < 0 ? "negative-text" : "positive-text"}`}>{metric.difference !== null && metric.difference > 0 ? "+" : ""}{formatNumber(metric.difference)}</div><div className="metric-detail">vs. Hunt 1 {metric.percentChange !== null && <Badge variant="outline">{metric.percentChange > 0 ? "+" : ""}{formatPercent(metric.percentChange)}</Badge>}</div></article>)}</section>}
      <div className="two-columns"><ComparisonTable title="Totais" rows={comparison.totals} hunts={selected} /><ComparisonTable title="Normalizados" rows={comparison.normalized} hunts={selected} /></div>
      <Panel title="Destaques" description="Maiores valores entre as hunts, incluindo empates."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{comparison.highlights.map((highlight) => <article key={highlight.label} className="rounded-lg border border-white/10 p-3"><span className="field-label">{highlight.label}</span><strong className="mt-1 block">{formatNumber(highlight.value)}</strong><span className="muted text-sm">{highlight.winners.map((hunt) => hunt.player).join(", ")}</span></article>)}</div></Panel>
      <Panel title="Comparação visual" description="Indicadores por hora; profit negativo permanece abaixo da linha zero."><div className="grid gap-5 lg:grid-cols-2">{comparison.normalized.filter((metric) => chartKeys.includes(metric.key)).map((metric) => { const data = selected.map((hunt, index) => ({ name: `Hunt ${index + 1}`, value: metric.values[index] ?? 0 })); return <div key={metric.key}><h4 className="mb-2 text-sm font-semibold">{metric.label}</h4><div className="h-56" role="img" aria-label={`${metric.label}: ${data.map((row) => `${row.name}, ${formatNumber(row.value)}`).join("; ")}`}><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 420, height: 224 }}><BarChart data={data} margin={{ top: 8, right: 10, left: 4, bottom: 0 }}><CartesianGrid stroke="#25313d" vertical={false} /><XAxis dataKey="name" stroke="#98a4b3" fontSize={10} /><YAxis stroke="#98a4b3" fontSize={10} tickFormatter={(value) => formatNumber(value)} width={72} /><ReferenceLine y={0} stroke="#98a4b3" /><Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={{ background: "#171d24", border: "1px solid #33404d" }} /><Bar dataKey="value" fill="#82c8d5" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div></div>; })}</div></Panel>
    </>}
  </div>;
}
