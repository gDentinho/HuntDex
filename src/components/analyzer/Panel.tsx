import type { ReactNode } from "react";
import { ChartNoAxesCombined } from "lucide-react";
export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-header">
        <div>
          <h3 className="panel-title">{title}</h3>
          {description && <p className="panel-description">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function EmptyState({
  children = "Nenhum registro disponível nesta sessão.",
}: {
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <ChartNoAxesCombined />
      <p>{children}</p>
    </div>
  );
}
