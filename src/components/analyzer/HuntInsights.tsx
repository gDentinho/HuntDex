import { Gem, FlaskConical, Crosshair, Zap } from "lucide-react";
import type { HuntInsight } from "@/lib/pxg/types";
const icons = {
  drop: Gem,
  supply: FlaskConical,
  enemy: Crosshair,
  element: Zap,
};
export function HuntInsights({ insights }: { insights: HuntInsight[] }) {
  if (!insights.length) return null;
  return (
    <div className="insights-grid">
      {insights.map((insight) => {
        const Icon = icons[insight.kind];
        return (
          <article key={insight.title} className="insight">
            <div className="insight-icon">
              <Icon />
            </div>
            <div>
              <div className="insight-label">{insight.title}</div>
              <h3 className="insight-name">{insight.name}</h3>
              <p className="insight-detail">{insight.detail}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
