"use client";
import {useMemo,useState} from "react";
import {ExternalLink,GitCompareArrows,Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {DataTable,type Column} from "../analyzer/DataTable";
import {EmptyState} from "../analyzer/Panel";
import {formatDuration,formatNumber,formatStart} from "@/lib/formatters";
import {defaultPeriod,getDateRange,filterByPeriod} from "@/lib/analytics/period";
import type {SavedHunt} from "@/lib/db/types";
import {PeriodFilter} from "./PeriodFilter";
import {ConfirmDialog} from "./ConfirmDialog";
export function HistoryPage({hunts,onOpen,onCompare,onDelete}:{hunts:SavedHunt[];onOpen:(h:SavedHunt)=>void;onCompare:(h:SavedHunt)=>void;onDelete:(id:string)=>Promise<void>}) {
 const [period,setPeriod]=useState(defaultPeriod),[query,setQuery]=useState(''),[profit,setProfit]=useState('all'),[rare,setRare]=useState(false),[deleting,setDeleting]=useState<SavedHunt|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const range=useMemo(()=>getDateRange(period),[period]);
 const rows=useMemo(()=>filterByPeriod(hunts,range).filter(h=>h.player.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))&&(profit==='all'||(profit==='positive'?(h.analysis.financial.profit??0)>0:(h.analysis.financial.profit??0)<0))&&(!rare||(h.analysis.combat.rareKills??0)>0)),[hunts,range,query,profit,rare]);
 const columns:Column<SavedHunt>[]=[
  {id:'date',label:'Data',render:h=>formatStart(h.start),sortValue:h=>h.startTimestamp??-Infinity},
  {id:'player',label:'Player',render:h=>h.player,sortValue:h=>h.player},
  {id:'duration',label:'Duração',render:h=>formatDuration(h.analysis.session.durationSeconds),sortValue:h=>h.analysis.session.durationSeconds??-Infinity},
  {id:'xp',label:'XP',render:h=>formatNumber(h.analysis.experience.total)},
  {id:'xpHour',label:'XP/h',render:h=>formatNumber(h.analysis.experience.perHour),sortValue:h=>h.analysis.experience.perHour??-Infinity},
  {id:'profit',label:'Profit',render:h=><span className={(h.analysis.financial.profit??0)<0?'negative-text':(h.analysis.financial.profit??0)>0?'positive-text':''}>{formatNumber(h.analysis.financial.profit)}</span>},
  {id:'profitHour',label:'Profit/h',render:h=>formatNumber(h.analysis.financial.profitPerHour),sortValue:h=>h.analysis.financial.profitPerHour??-Infinity},
  {id:'kills',label:'Kills',render:h=>formatNumber(h.analysis.combat.kills)},
  {id:'rares',label:'Rares',render:h=>formatNumber(h.analysis.combat.rareKills)},
  {id:'actions',label:'Ações',render:h=><div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" aria-label={`Abrir análise de ${h.player}, ${formatStart(h.start)}`} onClick={()=>onOpen(h)}><ExternalLink/></Button><Button size="icon-sm" variant="ghost" aria-label={`Comparar hunt de ${h.player}, ${formatStart(h.start)}`} onClick={()=>onCompare(h)}><GitCompareArrows/></Button><Button size="icon-sm" variant="ghost" aria-label={`Excluir hunt de ${h.player}, ${formatStart(h.start)}`} onClick={()=>{setDeleting(h);setError('');}}><Trash2/></Button></div>},
 ];
 async function remove(){if(!deleting)return;setBusy(true);try{await onDelete(deleting.id);setDeleting(null);}catch{setError('Não foi possível excluir a hunt. Tente novamente.');}finally{setBusy(false);}}
 return <section><div className="page-heading"><div><div className="eyebrow">Sua biblioteca local</div><h1>Histórico</h1><p>{hunts.length} hunts salvas neste navegador.</p></div><PeriodFilter value={period} onChange={setPeriod}/></div><div className="library-toolbar"><label className="field-inline grow"><span>Jogador</span><input className="control" placeholder="Buscar jogador" value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="field-inline"><span>Resultado</span><select className="control" value={profit} onChange={e=>setProfit(e.target.value)}><option value="all">Todos</option><option value="positive">Profit positivo</option><option value="negative">Profit negativo</option></select></label><label className="field-inline"><input type="checkbox" checked={rare} onChange={e=>setRare(e.target.checked)}/>Com Rare</label></div>
 {range.invalid&&<p className="form-error">Informe um intervalo válido.</p>}{error&&<p role="alert" className="form-error">{error}</p>}{!hunts.length?<EmptyState>Nenhuma hunt salva.</EmptyState>:!rows.length?<EmptyState>Nenhuma hunt encontrada com esses filtros.</EmptyState>:<div className="panel"><DataTable rows={rows} columns={columns} initialSort="date" rowKey={h=>h.id} caption="Histórico de hunts"/></div>}
 <ConfirmDialog open={!!deleting} onOpenChange={open=>!open&&!busy&&setDeleting(null)} title="Excluir esta hunt?" description={`A hunt de ${deleting?.player??''} (${formatStart(deleting?.start)}) será removida do histórico local. ${error}`} onConfirm={()=>void remove()} busy={busy}/></section>;
}
