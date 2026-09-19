import type {SavedHunt} from "../db/types";
import type {Metric,DamageGroup} from "../pxg/types";
import {safeDivide} from "../formatters";
export interface AccumulatedItem {name:string;count:number;total:number;share:Metric}
export interface AccumulatedEnemy {name:string;count:number;rare:boolean;share:Metric;dealt:Metric;taken:Metric;takenPerKill:Metric}
export const share=(value:Metric,total:Metric)=>{const ratio=safeDivide(value,total);return ratio!==null&&Number.isFinite(ratio*100)?ratio*100:null;};
export function sumKnown(values:Metric[]):Metric {const known=values.filter((v):v is number=>v!==null);if(!known.length)return null;const sum=known.reduce((a,b)=>a+b,0);return Number.isFinite(sum)?sum:null;}
export function aggregateRecords(hunts:SavedHunt[],lootTotal:Metric,supplyTotal:Metric,kills:Metric) {
  const drops=new Map<string,AccumulatedItem>(),supplies=new Map<string,AccumulatedItem>(),enemies=new Map<string,AccumulatedEnemy>();
  const byEnemy=new Map<string,DamageGroup>(),byElement=new Map<string,DamageGroup>();
  for(const hunt of hunts) {
    for(const [map,rows] of [[drops,hunt.analysis.drops],[supplies,hunt.analysis.supplies]] as const) for(const row of rows) {const v=map.get(row.name)??{name:row.name,count:0,total:0,share:null};v.count+=row.count;v.total+=row.total;map.set(row.name,v);}
    for(const row of hunt.analysis.enemies) {const v=enemies.get(row.name)??{name:row.name,count:0,rare:false,share:null,dealt:null,taken:null,takenPerKill:null};v.count+=row.count;v.rare ||= row.rare;enemies.set(row.name,v);}
    for(const [map,rows] of [[byEnemy,hunt.analysis.damageByEnemy],[byElement,hunt.analysis.damageByElement]] as const)for(const row of rows){const v=map.get(row.name)??{name:row.name,dealt:0,taken:0,dealtShare:null,takenShare:null};v.dealt+=row.dealt;v.taken+=row.taken;map.set(row.name,v);}
  }
  const items=(map:Map<string,AccumulatedItem>,total:Metric)=>Array.from(map.values(),r=>({...r,share:share(r.total,total)})).sort((a,b)=>b.total-a.total);
  return {
    drops:items(drops,lootTotal),supplies:items(supplies,supplyTotal),
    enemies:Array.from(enemies.values(),r=>{const dmg=byEnemy.get(r.name);return {...r,share:share(r.count,kills),dealt:dmg?.dealt??null,taken:dmg?.taken??null,takenPerKill:safeDivide(dmg?.taken??null,r.count)};}).sort((a,b)=>b.count-a.count),
    damageByEnemy:[...byEnemy.values()].sort((a,b)=>b.taken-a.taken),damageByElement:[...byElement.values()].sort((a,b)=>b.dealt-a.dealt),
  };
}
