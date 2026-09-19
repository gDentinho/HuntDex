import type {PxGHuntData} from "../lib/pxg/types";
import {exampleHunt} from "./exampleHunt";
// Fixtures explícitas; nunca são salvas automaticamente no histórico do usuário.
export const exampleHuntsV2:PxGHuntData[]=[exampleHunt,...[
  {id:1743,start:"2026-09-19 10:00:00",duration:3600,xp:400000,loot:80000,supplies:20000,kills:650,rare:0},
  {id:1744,start:"2026-09-20 16:00:00",duration:2700,xp:350000,loot:95000,supplies:25000,kills:500,rare:1},
  {id:1745,start:"2026-10-01 20:00:00",duration:7200,xp:900000,loot:300000,supplies:50000,kills:1300,rare:3},
].map(v=>({Session:{"Session ID":v.id,Start:v.start,"Duration seconds":v.duration,Experience:v.xp,"Raw gains":v.loot,Supplies:v.supplies,Profit:v.loot-v.supplies,Kills:v.kills,"Rare kills":v.rare,"Damage dealt":v.kills*6000,"Damage taken":v.kills*700},Experience:[{Player:"Spectral Flame",Experience:v.xp}],Drops:[{Item:"Enigma Stone",Count:v.loot/5000,"Unit price":5000,"Total price":v.loot,Player:"Spectral Flame",Ignored:null}],Supplies:[{Item:"Revive",Count:v.supplies/250,"Unit price":250,"Total price":v.supplies,Player:"Spectral Flame",Ignored:null}],"Enemies Defeated":[{Enemy:"Alakazam",Count:v.kills-v.rare,Rare:false,Ignored:false,Player:"Spectral Flame"},{Enemy:"Shiny Alakazam",Count:v.rare,Rare:true,Ignored:false,Player:"Spectral Flame"}],Damage:[{Enemy:"Alakazam",Element:"Ghost",Player:"Spectral Flame","Damage dealt":v.kills*6000,"Damage taken":v.kills*700}]}))];
