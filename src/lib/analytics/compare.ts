import type {SavedHunt} from "../db/types";
import type {Metric} from "../pxg/types";
import {safeDivide} from "../formatters";
export interface ComparisonMetric {key:string;label:string;values:Metric[];difference:Metric;percentChange:Metric;duration?:boolean}
export function compareHunts(hunts:SavedHunt[]) {
  if(hunts.length<2||hunts.length>5||new Set(hunts.map(h=>h.id)).size!==hunts.length)throw new Error("Selecione de 2 a 5 hunts diferentes.");
  const row=(key:string,label:string,read:(h:SavedHunt)=>Metric,duration=false):ComparisonMetric=>{
    const values=hunts.map(read);const difference=values.length===2&&values[0]!==null&&values[1]!==null?values[1]-values[0]:null;
    const ratio=values[0]!==null&&values[0]>0?safeDivide(difference,values[0]):null;
    return {key,label,values,difference,percentChange:ratio!==null&&Number.isFinite(ratio*100)?ratio*100:null,duration};
  };
  const totals=[row("duration","Duração",h=>h.analysis.session.durationSeconds,true),row("xp","XP",h=>h.analysis.experience.total),row("profit","Profit",h=>h.analysis.financial.profit),row("loot","Loot",h=>h.analysis.financial.rawGains),row("supplies","Supplies",h=>h.analysis.financial.supplies),row("kills","Kills",h=>h.analysis.combat.kills),row("rares","Rare Kills",h=>h.analysis.combat.rareKills),row("dealt","Damage dealt",h=>h.analysis.combat.damageDealt),row("taken","Damage taken",h=>h.analysis.combat.damageTaken)];
  const normalized=[row("xpPerHour","XP/h",h=>h.analysis.experience.perHour),row("profitPerHour","Profit/h",h=>h.analysis.financial.profitPerHour),row("lootPerHour","Loot/h",h=>h.analysis.financial.rawGainsPerHour),row("suppliesPerHour","Supplies/h",h=>h.analysis.financial.suppliesPerHour),row("killsPerHour","Kills/h",h=>h.analysis.combat.killsPerHour),row("takenPerHour","Damage taken/h",h=>safeDivide(h.analysis.combat.damageTaken,h.analysis.session.durationSeconds===null?null:h.analysis.session.durationSeconds/3600)),row("xpPerKill","XP/kill",h=>h.analysis.experience.perKill),row("profitPerKill","Profit/kill",h=>h.analysis.financial.profitPerKill),row("lootPerKill","Loot/kill",h=>h.analysis.financial.lootPerKill),row("suppliesPerKill","Supplies/kill",h=>h.analysis.financial.supplyPerKill),row("takenPerKill","Damage taken/kill",h=>h.analysis.combat.damageTakenPerKill)];
  const highlights=[totals[3],totals[2],totals[4],normalized[0]].flatMap(metric=>{const known=metric.values.filter((v):v is number=>v!==null);if(!known.length)return [];const max=Math.max(...known);return [{label:metric.label,winners:hunts.filter((_,i)=>metric.values[i]===max),value:max}];});
  return {hunts,totals,normalized,highlights};
}
