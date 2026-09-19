import type { SavedHunt } from "../db/types";
export type Period = "today" | "week" | "month" | "last30" | "all" | "custom";
export interface DateRange { from?: number; to?: number; invalid?: boolean }
export interface PeriodSelection { period: Period; from: string; to: string }
export const defaultPeriod: PeriodSelection = {period:"all",from:"",to:""};

export function parseLocalStart(value?: string): number | undefined {
  if(!value) return undefined;
  const m=/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value);
  if(!m) return undefined;
  const [,ys,ms,ds,hs="0",mins="0",ss="0"]=m;
  const [y,mo,d,h,mi,s]=[ys,ms,ds,hs,mins,ss].map(Number);
  const date=new Date(y,mo-1,d,h,mi,s);
  if(y<100 || date.getFullYear()!==y || date.getMonth()!==mo-1 || date.getDate()!==d || h>23 || mi>59 || s>59) return undefined;
  return date.getTime();
}
export function localDateKey(timestamp: number):string {
  const d=new Date(timestamp); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export function getDateRange(selection: PeriodSelection, now=new Date()): DateRange {
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const end=new Date(start); end.setDate(end.getDate()+1); end.setMilliseconds(-1);
  switch(selection.period) {
    case "all": return {};
    case "today": return {from:start.getTime(),to:end.getTime()};
    case "week": start.setDate(start.getDate()-((start.getDay()+6)%7)); {const next=new Date(start);next.setDate(next.getDate()+7);return {from:start.getTime(),to:next.getTime()-1};}
    case "month": return {from:new Date(now.getFullYear(),now.getMonth(),1).getTime(),to:new Date(now.getFullYear(),now.getMonth()+1,1).getTime()-1};
    case "last30": start.setDate(start.getDate()-29);return {from:start.getTime(),to:end.getTime()};
    case "custom": {
      const from=parseLocalStart(selection.from),last=parseLocalStart(selection.to);
      if(from===undefined||last===undefined||from>last)return {invalid:true};
      const until=new Date(last);until.setDate(until.getDate()+1);
      return {from,to:until.getTime()-1};
    }
  }
}
export function filterByPeriod(hunts:SavedHunt[],range:DateRange):SavedHunt[] {
  if(range.invalid)return [];
  if(range.from===undefined&&range.to===undefined)return hunts;
  return hunts.filter(h=>h.startTimestamp!==undefined&&(range.from===undefined||h.startTimestamp>=range.from)&&(range.to===undefined||h.startTimestamp<=range.to));
}
