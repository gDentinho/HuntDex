"use client";
import {useMemo,useState} from "react";
import {Activity,Clock3,Coins,Crosshair,FlaskConical,Gem,Layers,Star,Zap,Swords,Shield} from "lucide-react";
import {Button} from "@/components/ui/button";
import {MetricCard} from "../analyzer/MetricCard";
import {EmptyState} from "../analyzer/Panel";
import {buildDashboardAnalytics} from "@/lib/analytics/dashboard";
import {defaultPeriod,getDateRange} from "@/lib/analytics/period";
import {formatDuration} from "@/lib/formatters";
import type {SavedHunt,HuntSettings} from "@/lib/db/types";
import {PeriodFilter} from "./PeriodFilter";
import {DailyChart} from "./DailyChart";
import {DiamondPanel} from "./DiamondPanel";
import {AccumulatedTables} from "./AccumulatedTables";
export function OverviewPage({hunts,settings,onSettings,onAnalyze}:{hunts:SavedHunt[];settings:HuntSettings;onSettings:(s:HuntSettings)=>void;onAnalyze:()=>void}) {
 const [period,setPeriod]=useState(defaultPeriod);
 const range=useMemo(()=>getDateRange(period),[period]);
 const data=useMemo(()=>buildDashboardAnalytics(hunts,range),[hunts,range]);
 const t=data.totals,r=data.rates;
 return <section><div className="page-heading"><div><div className="eyebrow">Sua jornada em números</div><h1>Dashboard</h1><p>Uma visão de todas as suas hunts, no período que importa.</p></div><PeriodFilter value={period} onChange={setPeriod}/></div>
 {range.invalid&&<p role="alert" className="form-error">Informe um intervalo de datas válido.</p>}
 {!hunts.length?<div className="library-empty"><EmptyState>Você ainda não possui hunts salvas.<br/>Comece analisando sua primeira hunt.</EmptyState><Button onClick={onAnalyze}>Analisar primeira hunt</Button></div>:!data.totalHunts?<EmptyState>Nenhuma hunt encontrada neste período.</EmptyState>:<>
 <div className="library-metrics"><MetricCard label="Total de hunts" value={data.totalHunts} detail="No período selecionado" icon={Layers}/><MetricCard label="Tempo total de hunt" value={formatDuration(t.durationSeconds,true)} detail="Soma das durações registradas" icon={Clock3}/><MetricCard label="Experience total" value={t.experience} unit="XP" rate={r.experience} icon={Zap}/><MetricCard label="Profit total" value={t.profit} rate={r.profit} profit icon={Coins}/><MetricCard label="Loot total" value={t.rawGains} rate={r.rawGains} icon={Gem}/><MetricCard label="Supplies total" value={t.suppliesCost} rate={r.suppliesCost} icon={FlaskConical}/><MetricCard label="Kills" value={t.kills} rate={r.kills} icon={Crosshair}/><MetricCard label="Rare kills" value={t.rareKills} rate={r.rareKills} icon={Star}/><MetricCard label="Damage dealt" value={t.damageDealt} rate={r.damageDealt} icon={Swords}/><MetricCard label="Damage taken" value={t.damageTaken} rate={r.damageTaken} icon={Shield}/></div>
 <p className="aggregation-note"><Activity size={13}/> Taxas por hora = total do período ÷ tempo total. {data.partial&&"Há dados parciais: somamos os valores disponíveis e ocultamos taxas sem cobertura completa."} {data.undatedCount>0&&`${data.undatedCount} hunt(s) sem data estão nos totais, mas fora do gráfico diário.`}</p>
 <div className="overview-primary v2-summary"><DailyChart days={data.days}/><DiamondPanel key={String(settings.diamondPrice)} price={settings.diamondPrice} profit={t.profit} onPrice={price=>onSettings({...settings,diamondPrice:price})}/></div>
 <div className="insights-grid">{data.insights.map(i=><article className="insight" key={i.title}><div><p className="insight-label">{i.title}</p><h3 className="insight-name">{i.name}</h3><p className="insight-detail">{i.detail}</p></div></article>)}</div>
 <AccumulatedTables data={data}/></>}
 </section>;
}
