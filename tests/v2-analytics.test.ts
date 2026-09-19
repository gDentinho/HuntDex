import {describe,it,expect} from "vitest";
import {analyzeHunt} from "../src/lib/pxg/analytics";
import type {PxGHuntData} from "../src/lib/pxg/types";
import type {SavedHunt} from "../src/lib/db/types";
import {getDateRange,filterByPeriod,parseLocalStart} from "../src/lib/analytics/period";
import {buildDashboardAnalytics} from "../src/lib/analytics/dashboard";
import {calculateDiamonds} from "../src/lib/analytics/diamonds";
import {compareHunts} from "../src/lib/analytics/compare";
import {buildRareTracker} from "../src/lib/analytics/rares";
const hunt=(raw:PxGHuntData,id="a"):SavedHunt=>({id,duplicateKey:id,player:"P",start:raw.Session?.Start,startTimestamp:parseLocalStart(raw.Session?.Start),createdAt:0,rawJson:raw,analysis:analyzeHunt(raw)});
describe("períodos locais",()=>{
 const dates=["2026-09-13 12:00:00","2026-09-14 00:00:00","2026-09-18 21:00:00","2026-09-20 23:59:59","2026-10-01 00:00:00"];
 const hunts=dates.map((Start,i)=>hunt({Session:{Start,Kills:1}},String(i)));
 const filter=(period:"today"|"week"|"month"|"last30"|"all"|"custom",from="",to="")=>filterByPeriod(hunts,getDateRange({period,from,to},new Date(2026,8,18,12)));
 it("filtra hoje",()=>expect(filter("today")).toHaveLength(1));
 it("semana começa segunda e inclui domingo",()=>expect(filter("week").map(h=>h.id)).toEqual(["1","2","3"]));
 it("filtra mês",()=>expect(filter("month")).toHaveLength(4));
 it("intervalo personalizado inclui fim do dia",()=>expect(filter("custom","2026-09-14","2026-09-20")).toHaveLength(3));
 it("intervalo inválido não retorna hunts",()=>expect(filter("custom","2026-09-20","2026-09-14")).toHaveLength(0));
 it("últimos 30 dias excluem datas futuras",()=>expect(filter("last30")).toHaveLength(3));
 it("rejeita datas impossíveis e não atribui datas ausentes",()=>{expect(parseLocalStart("2026-02-30 10:00:00")).toBeUndefined();expect(filterByPeriod([hunt({Session:{Kills:1}})],{})).toHaveLength(1);expect(filterByPeriod([hunt({Session:{Kills:1}})],getDateRange({period:"today",from:"",to:""}))).toHaveLength(0);});
});
describe("dashboard ponderado",()=>{
 it("calcula 300 mil XP em 2,5h como 120 mil/h, ignorando média de taxas",()=>{
  const a=hunt({Session:{"Duration seconds":1800,Experience:100000,"Experience per hour":200000,Profit:10000,Kills:100}},"a");
  const b=hunt({Session:{"Duration seconds":7200,Experience:200000,"Experience per hour":100000,Profit:20000,Kills:200}},"b");
  const result=buildDashboardAnalytics([a,b],{});
  expect(result.totals.experience).toBe(300000);expect(result.rates.experience).toBe(120000);expect(result.rates.profit).toBe(12000);expect(result.rates.kills).toBe(120);
 });
 it("agrega loot, supplies e dano por criatura",()=>{
  const raw:PxGHuntData={Drops:[{Item:"Gem",Player:"P",Count:2,"Unit price":10,"Total price":20,Ignored:null}],Supplies:[{Item:"Potion",Player:"P",Count:1,"Unit price":5,"Total price":5,Ignored:null}],"Enemies Defeated":[{Enemy:"Abra",Player:"P",Count:2,Rare:false,Ignored:false}],Damage:[{Enemy:"Abra",Player:"P",Element:"Ghost","Damage dealt":100,"Damage taken":40}],Session:{Start:"2026-09-18 21:00:00","Duration seconds":60}};
  const r=buildDashboardAnalytics([hunt(raw,"a"),hunt(raw,"b")],{});
  expect(r.drops[0]).toMatchObject({name:"Gem",count:4,total:40});expect(r.supplies[0].total).toBe(10);expect(r.enemies[0]).toMatchObject({count:4,taken:80,takenPerKill:20});expect(r.days).toHaveLength(1);expect(r.days[0].profit).toBe(30);
 });
 it("filtra antes de calcular todos os indicadores",()=>{
  const a=hunt({Session:{Start:"2026-09-18 10:00:00",Profit:10,"Duration seconds":60}},"a"), b=hunt({Session:{Start:"2026-10-01 10:00:00",Profit:100,"Duration seconds":60}},"b");
  const r=buildDashboardAnalytics([a,b],getDateRange({period:"month",from:"",to:""},new Date(2026,8,18)));expect(r.totalHunts).toBe(1);expect(r.totals.profit).toBe(10);expect(r.days).toHaveLength(1);
 });
 it("dados ausentes não viram zero e não há divisão por zero",()=>{const r=buildDashboardAnalytics([hunt({Session:{"Duration seconds":0}})],{});expect(r.totals.profit).toBeNull();expect(r.rates.profit).toBeNull();});
});
describe("diamonds",()=>{
 it("calcula valor equivalente, inteiros e saldo",()=>expect(calculateDiamonds(842430,7500)).toMatchObject({equivalent:112.324,full:112,remaining:2430}));
 it("prejuízo não gera diamonds negativos",()=>expect(calculateDiamonds(-48000,7500)).toMatchObject({equivalent:0,full:0,remaining:0}));
 it("preço ausente/zero/infinito é inválido",()=>{expect(calculateDiamonds(100,null)).toBeNull();expect(calculateDiamonds(100,0)).toBeNull();expect(calculateDiamonds(100,Infinity)).toBeNull();});
});
describe("comparação",()=>{
 it("preserva taxas oficiais individuais e calcula diferenças",()=>{
  const a=hunt({Session:{Experience:100,"Experience per hour":200,Profit:-10,"Profit per hour":-20,Kills:10,"Duration seconds":1800}},"a"), b=hunt({Session:{Experience:300,"Experience per hour":300,Profit:30,"Profit per hour":30,Kills:15,"Duration seconds":3600}},"b");
  const r=compareHunts([a,b]);expect(r.normalized.find(m=>m.key==="xpPerHour")?.values).toEqual([200,300]);expect(r.normalized.find(m=>m.key==="xpPerHour")?.percentChange).toBe(50);expect(r.normalized.find(m=>m.key==="profitPerHour")?.difference).toBe(50);
 });
 it("rejeita seleção fora do intervalo 2 a 5 e repetida",()=>{expect(()=>compareHunts([])).toThrow();const a=hunt({Session:{Kills:1}});expect(()=>compareHunts([a,a])).toThrow();});
 it("diferença percentual não divide por zero",()=>{const a=hunt({Session:{"Experience per hour":0}},"a"),b=hunt({Session:{"Experience per hour":10}},"b");expect(compareHunts([a,b]).normalized[0].percentChange).toBeNull();});
});
describe("rares",()=>{
 it("Rare=true é fonte de verdade, Shiny somente categoriza",()=>{
  const rows=[["Shiny Alakazam",2,true],["Shiny Hypno",1,true],["Rare X",4,true],["Shiny fake",50,false]] as const;
  const a=hunt({"Enemies Defeated":rows.map(([Enemy,Count,Rare])=>({Enemy,Count,Rare,Player:"P",Ignored:false})),Session:{Start:"2026-09-18 10:00:00","Duration seconds":3600}});
  const r=buildRareTracker([a]);expect(r.total).toBe(7);expect(r.shinies).toBe(3);expect(r.others).toBe(4);expect(r.species).toHaveLength(3);expect(r.perHour).toBe(7);
 });
 it("datas vêm da sessão, taxa considera também hunts sem raro",()=>{
  const raw:PxGHuntData={"Enemies Defeated":[{Enemy:"Shiny Abra",Rare:true,Count:1,Ignored:false,Player:"P"}],Session:{Start:"2026-09-18 12:00:00","Duration seconds":3600}};
  const r=buildRareTracker([hunt(raw,"a"),hunt({Session:{"Duration seconds":3600}},"b")]);expect(r.perHour).toBe(.5);expect(r.species[0].first).toBe(parseLocalStart(raw.Session?.Start));expect(r.huntsWithRare).toBe(1);
 });
});
