"use client";
import {useState} from "react";
import {Gem} from "lucide-react";
import {Panel} from "../analyzer/Panel";
import {Button} from "@/components/ui/button";
import {calculateDiamonds} from "@/lib/analytics/diamonds";
import {formatNumber} from "@/lib/formatters";
import type {Metric} from "@/lib/pxg/types";
export function DiamondPanel({profit,price,onPrice}:{profit:Metric;price:Metric;onPrice:(price:Metric)=>void}) {
 const [draft,setDraft]=useState(price===null?"":String(price));
 const value=draft.trim()?Number(draft):null;
 const invalid=value!==null&&(!Number.isFinite(value)||value<=0);
 const converted=calculateDiamonds(profit,price);
 return <Panel title="Diamonds equivalentes" description="Converta o profit do período pelo preço do seu servidor" action={<Gem size={18} className="text-primary"/>}><div className="panel-body"><form onSubmit={e=>{e.preventDefault();if(!invalid)onPrice(value);}}><label className="field-label" htmlFor="diamond-price">Preço de 1 Diamond no seu servidor</label><div className="flex gap-2 mt-2"><input id="diamond-price" type="number" className="control min-w-0 flex-1" min="0.000001" step="any" placeholder="Ex.: 7500" value={draft} onChange={e=>setDraft(e.target.value)} aria-invalid={invalid}/><Button type="submit" variant="outline" disabled={invalid}>Salvar preço</Button></div>{invalid&&<p className="form-error">Informe um preço maior que zero.</p>}</form>
 {price===null?<p className="muted text-xs mt-5 leading-6">Informe o preço do Diamond para calcular o equivalente do seu profit.</p>:profit===null?<p className="muted text-xs mt-5">Profit não informado nas hunts do período.</p>:profit<=0?<div className="mt-5"><strong className="text-lg">0 Diamonds disponíveis</strong><p className="text-xs muted mt-2">{profit<0?`O período selecionado está com prejuízo líquido de ${formatNumber(Math.abs(profit))}.`:"O período selecionado está em equilíbrio financeiro."}</p></div>:converted?<div className="diamond-result"><div><strong>{formatNumber(converted.equivalent)}</strong><span>Diamonds equivalentes</span></div><dl><div><dt>Diamonds inteiros</dt><dd>{formatNumber(converted.full)}</dd></div><div><dt>Saldo restante</dt><dd>{formatNumber(converted.remaining)}</dd></div></dl></div>:<p className="form-error mt-4">O valor informado não permite uma conversão válida.</p>}
 </div></Panel>;
}
