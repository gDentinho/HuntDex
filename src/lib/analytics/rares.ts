import type {SavedHunt} from "../db/types";
import {safeDivide} from "../formatters";
import {sumKnown} from "./aggregations";
export interface RareSpecies {name:string;count:number;shiny:boolean;first?:number;last?:number}
export interface RareEvent {huntId:string;name:string;count:number;start?:string;timestamp?:number;player:string}
export function buildRareTracker(hunts:SavedHunt[]) {
  const map=new Map<string,RareSpecies>(),timeline:RareEvent[]=[];
  let total=0,shinies=0,huntsWithRare=0;
  for(const h of hunts) {
    const rows=h.rawJson["Enemies Defeated"]?.filter(r=>r.Rare&&r.Count>0)??[];
    if(rows.length)huntsWithRare++;
    const sessionGroups=new Map<string,number>();
    for(const row of rows) {
      const shiny=/shiny/i.test(row.Enemy);total+=row.Count;if(shiny)shinies+=row.Count;
      const r=map.get(row.Enemy)??{name:row.Enemy,count:0,shiny};r.count+=row.Count;
      if(h.startTimestamp!==undefined){r.first=r.first===undefined?h.startTimestamp:Math.min(r.first,h.startTimestamp);r.last=r.last===undefined?h.startTimestamp:Math.max(r.last,h.startTimestamp);}
      map.set(row.Enemy,r);sessionGroups.set(row.Enemy,(sessionGroups.get(row.Enemy)??0)+row.Count);
    }
    for(const [name,count] of sessionGroups)timeline.push({huntId:h.id,name,count,start:h.start,timestamp:h.startTimestamp,player:h.player});
  }
  const duration=sumKnown(hunts.map(h=>h.analysis.session.durationSeconds));
  return {total,shinies,others:total-shinies,huntsWithRare,perHour:hunts.every(h=>h.analysis.session.durationSeconds!==null)?safeDivide(total,duration===null?null:duration/3600):null,species:[...map.values()].sort((a,b)=>b.count-a.count),timeline:timeline.sort((a,b)=>(b.timestamp??-Infinity)-(a.timestamp??-Infinity)),reportedTotal:sumKnown(hunts.map(h=>h.analysis.combat.rareKills))};
}
