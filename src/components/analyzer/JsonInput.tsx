"use client";
import {
  Braces,
  CheckCircle2,
  CircleAlert,
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  RotateCcw,
  CornerUpLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ParseResult } from "@/lib/pxg/parser";

interface Props {
  text: string;
  validation: ParseResult | null;
  isValidating: boolean;
  hasAnalysis: boolean;
  demo: boolean;
  onText: (text: string) => void;
  onExample: () => void;
  onAnalyze: () => void;
  onCancel: () => void;
}
export function JsonInput({
  text,
  validation,
  isValidating,
  hasAnalysis,
  demo,
  onText,
  onExample,
  onAnalyze,
  onCancel,
}: Props) {
  return (
    <section className="editor-layout" aria-labelledby="editor-title">
      <div className="editor-heading">
        <div className="eyebrow">Seu próximo insight começa aqui</div>
        <h1 id="editor-title">Cada hunt conta uma história.</h1>
        <p>
          Cole as estatísticas da sua sessão e descubra exatamente como foi sua
          hunt.
        </p>
      </div>
      <div className="editor-card">
        <div className="editor-toolbar">
          <label htmlFor="hunt-json" className="editor-toolbar-label">
            <Braces size={16} /> Estatísticas da hunt
          </label>
          <span className="editor-language">PXG / JSON</span>
        </div>
        <div className="code-area">
          <Textarea
            id="hunt-json"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder="Cole aqui o JSON das estatísticas da sua hunt..."
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-describedby="json-validation"
            aria-invalid={!!text && !!validation && !validation.ok}
          />
        </div>
        <div
          id="json-validation"
          role="status"
          aria-live="polite"
          className={`editor-status ${!isValidating && validation ? (validation.ok ? "valid" : "invalid") : ""}`}
        >
          {isValidating ? (
            <>
              <Braces /> Validando dados…
            </>
          ) : validation?.ok ? (
            <>
              <CheckCircle2 /> JSON válido{" "}
              <span className="muted">
                · {demo ? "Sessão de demonstração" : "Pronto para analisar"}
              </span>
            </>
          ) : validation ? (
            <>
              <CircleAlert />
              <span>
                <strong>
                  {validation.kind === "syntax"
                    ? "JSON inválido"
                    : "Dados incompatíveis"}
                </strong>{" "}
                · {validation.message}
              </span>
            </>
          ) : (
            <>
              <Braces /> Aguardando dados da sessão
            </>
          )}
        </div>
        <div className="editor-actions">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExample}>
              <FlaskConical /> Usar exemplo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onText("")}
              disabled={!text}
            >
              <RotateCcw /> Limpar
            </Button>
          </div>
          <Button
            onClick={onAnalyze}
            disabled={!validation?.ok || isValidating}
          >
            Analisar Hunt <ArrowRight />
          </Button>
        </div>
      </div>
      <p className="editor-privacy">
        <ShieldCheck /> Seus dados são analisados localmente no navegador e não
        são enviados para nenhum servidor.
      </p>
      {hasAnalysis ? (
        <Button variant="outline" onClick={onCancel}>
          <CornerUpLeft /> Voltar à análise atual
        </Button>
      ) : (
        <div className="workflow">
          <div className="workflow-step">
            <span>01</span>
            <div>
              <h2>Copie do PxG</h2>
              <p>Copie o JSON das estatísticas da sua sessão.</p>
            </div>
          </div>
          <div className="workflow-step">
            <span>02</span>
            <div>
              <h2>Cole e analise</h2>
              <p>Seus dados são validados automaticamente.</p>
            </div>
          </div>
          <div className="workflow-step">
            <span>03</span>
            <div>
              <h2>Entenda sua hunt</h2>
              <p>Loot, custos, experiência e combate em um só lugar.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
