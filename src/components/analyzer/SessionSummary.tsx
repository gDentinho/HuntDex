import {
  CalendarDays,
  Clock3,
  Hash,
  FileJson2,
  Plus,
  Pause,
  Circle,
} from "lucide-react";
import type {ReactNode} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatStart } from "@/lib/formatters";
import type { HuntAnalysis } from "@/lib/pxg/types";
export function SessionSummary({
  analysis,
  demo,
  onEdit,
  onNew,
  saveAction,
}: {
  analysis: HuntAnalysis;
  demo: boolean;
  onEdit: () => void;
  onNew: () => void;
  saveAction?:ReactNode;
}) {
  const s = analysis.session;
  const status = s.status
    ? ({
        Paused: "Pausada",
        Running: "Em andamento",
        Stopped: "Encerrada",
        Active: "Em andamento",
      }[s.status] ?? s.status)
    : null;
  return (
    <>
      <div className="eyebrow">
        Análise da sessão{" "}
        {demo && (
          <Badge
            variant="outline"
            className="ml-2 text-[9px] tracking-normal normal-case text-muted-foreground"
          >
            Demonstração
          </Badge>
        )}
      </div>
      <div className="session-header">
        <div>
          <h1 className="session-title">
            <span>
              <span className="prefix">Hunt de </span>
              {analysis.player}
            </span>
            {status && (
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground"
              >
                {s.status === "Paused" ? (
                  <Pause size={10} />
                ) : (
                  <Circle size={9} />
                )}{" "}
                {status}
              </Badge>
            )}
          </h1>
          <div className="session-meta">
            {s.start && (
              <span>
                <CalendarDays />
                {formatStart(s.start)}
              </span>
            )}
            {s.durationSeconds !== null && (
              <span>
                <Clock3 />
                {formatDuration(s.durationSeconds, true)} de hunt
              </span>
            )}
            {s.id !== undefined && (
              <span>
                <Hash />
                Sessão {s.id}
              </span>
            )}
            {s.pausedSeconds !== undefined && s.pausedSeconds > 0 && (
              <span>Pausa: {formatDuration(s.pausedSeconds, true)}</span>
            )}
          </div>
        </div>
        <div className="session-actions">
          {saveAction}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <FileJson2 />
            Editar JSON
          </Button>
          <Button size="sm" onClick={onNew}>
            <Plus />
            Analisar outra hunt
          </Button>
        </div>
      </div>
    </>
  );
}
