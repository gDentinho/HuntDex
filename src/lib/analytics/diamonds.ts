import type {Metric} from "../pxg/types";
export function calculateDiamonds(profit:Metric,price:Metric) {
  if(profit===null||price===null||!Number.isFinite(profit)||!Number.isFinite(price)||price<=0)return null;
  if(profit<=0)return {equivalent:0,full:0,remaining:0};
  const equivalent=profit/price;
  if(!Number.isFinite(equivalent))return null;
  const full=Math.floor(equivalent);
  return {equivalent,full,remaining:Math.max(0,profit-full*price)};
}
