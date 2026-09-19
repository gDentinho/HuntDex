"use client";
import {useState} from "react";
import {BarChart,Bar,Cell,ResponsiveContainer,XAxis,YAxis,Tooltip,CartesianGrid,ReferenceLine} from "recharts";
import {Panel,EmptyState} from "../analyzer/Panel";
import {formatNumber,formatDuration} from "@/lib/formatters";
import type {DailyMetrics,SummaryKey} from "@/lib/analytics/dashboard";
const choices:{key:SummaryKey;label:string}[]=[{key:"profit",label:"Profit"},{key:"experience",label:"XP"},{key:"kills",label:"Kills"},{key:"durationSeconds",label:"Tempo"},{key:"rawGains",label:"Loot"},{key:"suppliesCost",label:"Supplies"}];
export function DailyChart({days}:{days:DailyMetrics[]}) {
 const [metric,setMetric]=useState<SummaryKey>("profit");
 return <Panel title="Evolução por dia" description="Totais agrupados pela data local de início da hunt" action={<select className="control" aria-label="Métrica do gráfico" value={metric} onChange={e=>setMetric(e.target.value as SummaryKey)}>{choices.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select>}>
 {days.length?<div className="daily-chart"><ResponsiveContainer width="100%" height={260} initialDimension={{width:600,height:260}}><BarChart data={days} margin={{left:0,right:18,top:15,bottom:10}}><CartesianGrid vertical={false} stroke="#29303a" strokeDasharray="3 3"/><XAxis dataKey="date" stroke="#98a4b3" tick={{fontSize:10}} tickFormatter={date=>date.slice(5).split('-').reverse().join('/')}/><YAxis width={70} stroke="#98a4b3" tick={{fontSize:10}} tickFormatter={v=>metric==="durationSeconds"?`${formatNumber(v/3600)}h`:new Intl.NumberFormat('pt-BR',{notation:'compact'}).format(v)}/><Tooltip contentStyle={{background:'#141920',border:'1px solid #29303a',borderRadius:8,color:'#edf1f5'}} labelFormatter={label=>String(label).split('-').reverse().join('/')} formatter={(value)=>[metric==="durationSeconds"?formatDuration(Number(value),true):formatNumber(Number(value)),choices.find(c=>c.key===metric)?.label]}/><ReferenceLine y={0} stroke="#526272"/><Bar dataKey={metric} maxBarSize={48} radius={[3,3,0,0]} isAnimationActive={false}>{days.map(day=><Cell key={day.date} fill={metric==="profit"&&(day.profit??0)<0?'#ef8b93':'#82c8d5'}/>)}</Bar></BarChart></ResponsiveContainer></div>:<EmptyState>Não há hunts com data para este gráfico.</EmptyState>}
 </Panel>;
}
