"use client";
import {CalendarDays} from "lucide-react";
import type {Period,PeriodSelection} from "@/lib/analytics/period";
export function PeriodFilter({value,onChange}:{value:PeriodSelection;onChange:(value:PeriodSelection)=>void}) {
 return <div className="period-filter"><label className="field-inline"><CalendarDays size={14}/><span className="sr-only">Período</span><select className="control" aria-label="Período" value={value.period} onChange={e=>onChange({...value,period:e.target.value as Period})}><option value="today">Hoje</option><option value="week">Esta semana</option><option value="month">Este mês</option><option value="last30">Últimos 30 dias</option><option value="all">Tudo</option><option value="custom">Personalizado</option></select></label>{value.period==="custom"&&<><label className="field-inline"><span>Data inicial</span><input type="date" className="control" value={value.from} onChange={e=>onChange({...value,from:e.target.value})}/></label><label className="field-inline"><span>Data final</span><input type="date" className="control" value={value.to} onChange={e=>onChange({...value,to:e.target.value})}/></label></>}</div>;
}
