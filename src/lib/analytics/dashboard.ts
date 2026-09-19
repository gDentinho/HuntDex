import type {SavedHunt} from "../db/types";
import type {Metric,HuntAnalysis} from "../pxg/types";
import {safeDivide,formatNumber,formatPercent} from "../formatters";
import {filterByPeriod,localDateKey,type DateRange} from "./period";
import {aggregateRecords,sumKnown} from "./aggregations";
export const metricReaders = {
  durationSeconds:(a:HuntAnalysis)=>a.session.durationSeconds,
  experience:(a:HuntAnalysis)=>a.experience.total,
  profit:(a:HuntAnalysis)=>a.financial.profit,
  rawGains:(a:HuntAnalysis)=>a.financial.rawGains,
  suppliesCost:(a:HuntAnalysis)=>a.financial.supplies,
  kills:(a:HuntAnalysis)=>a.combat.kills,
  rareKills:(a:HuntAnalysis)=>a.combat.rareKills,
  damageDealt:(a:HuntAnalysis)=>a.combat.damageDealt,
  damageTaken:(a:HuntAnalysis)=>a.combat.damageTaken,
};
export type SummaryKey=keyof typeof metricReaders;
export type SummaryMetrics=Record<SummaryKey,Metric>;
export interface DailyMetrics extends SummaryMetrics {date:string;hunts:number}
export function buildDashboardAnalytics(all:SavedHunt[],period:DateRange) {
  const hunts=filterByPeriod(all,period);
  const totals={} as SummaryMetrics,rates={} as SummaryMetrics;
  const completeDuration=hunts.every(h=>h.analysis.session.durationSeconds!==null);
  let partial=false;
  for(const key of Object.keys(metricReaders) as SummaryKey[]) {const values=hunts.map(h=>metricReaders[key](h.analysis));totals[key]=sumKnown(values);if(values.some(v=>v===null))partial=true;}
  for(const key of Object.keys(metricReaders) as SummaryKey[]) rates[key]=completeDuration&&hunts.every(h=>metricReaders[key](h.analysis)!==null)?safeDivide(totals[key],totals.durationSeconds===null?null:totals.durationSeconds/3600):null;
  const records=aggregateRecords(hunts,totals.rawGains,totals.suppliesCost,totals.kills);
  const daily=new Map<string,SavedHunt[]>();
  for(const h of hunts) if(h.startTimestamp!==undefined){const date=localDateKey(h.startTimestamp);const group=daily.get(date)??[];group.push(h);daily.set(date,group);}
  const days:DailyMetrics[]=Array.from(daily,([date,rows])=>({date,hunts:rows.length,...Object.fromEntries(Object.entries(metricReaders).map(([key,read])=>[key,sumKnown(rows.map(h=>read(h.analysis)))]))} as DailyMetrics)).sort((a,b)=>a.date.localeCompare(b.date));
  const insights:{title:string;name:string;detail:string}[]=[];
  if(records.drops[0]?.total>0)insights.push({title:"Item que mais gerou valor",name:records.drops[0].name,detail:formatNumber(records.drops[0].total)});
  if(records.supplies[0]?.total>0)insights.push({title:"Maior gasto",name:records.supplies[0].name,detail:`${formatNumber(records.supplies[0].total)} · ${formatPercent(records.supplies[0].share)} dos gastos`});
  if(records.enemies[0]?.count>0)insights.push({title:"Pokémon mais derrotado",name:records.enemies[0].name,detail:`${formatNumber(records.enemies[0].count)} kills`});
  if(records.damageByEnemy[0]?.taken>0)insights.push({title:"Pokémon que mais causou dano",name:records.damageByEnemy[0].name,detail:`${formatNumber(records.damageByEnemy[0].taken)} de dano recebido`});
  return {hunts,totalHunts:hunts.length,totals,rates,...records,days,insights,partial,undatedCount:hunts.filter(h=>h.startTimestamp===undefined).length};
}
