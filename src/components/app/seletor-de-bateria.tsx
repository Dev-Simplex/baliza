"use client";

import { AlertTriangle, Check, Clock } from "lucide-react";

import {
  FICHAS_DE_TESTE,
  produzFatores,
  rotuloDeTempo,
  telasDaBateria,
  type Teste,
} from "@/lib/instrument/baterias";
import { cn } from "@/lib/utils";

/**
 * Escolha dos testes que a vaga aplica.
 *
 * Usado igual na criação e na edição da vaga — a mesma decisão nas duas telas,
 * com o mesmo aviso. Duplicar a lista era garantir que uma delas ficasse para
 * trás quando um quinto teste entrasse.
 *
 * Duas coisas o componente insiste em mostrar enquanto a pessoa mexe, porque
 * são as duas que ela só descobriria tarde demais:
 *
 *   · o TEMPO somado da prova — quem marca os quatro testes está pedindo
 *     ~30 min de um candidato que ainda não trabalha na empresa, e a taxa de
 *     abandono é o preço;
 *   · a perda da ADERÊNCIA — sem Prumo nem Big Five não há os cinco fatores, e
 *     sem eles não há ranking. A vaga continua funcionando, mas o número some.
 */
export function SeletorDeBateria({
  valor,
  aoMudar,
  desabilitado,
}: {
  valor: Teste[];
  aoMudar: (bateria: Teste[]) => void;
  desabilitado?: boolean;
}) {
  const escolhidos = new Set(valor);
  const vazio = valor.length === 0;
  const semAderencia = !vazio && !produzFatores(valor);

  function alternar(id: Teste) {
    // A ordem canônica é reimposta em `normalizarBateria`, no servidor. Aqui
    // basta manter a ordem do catálogo para a lista não dançar na tela.
    const proximo = escolhidos.has(id)
      ? valor.filter((t) => t !== id)
      : FICHAS_DE_TESTE.filter((f) => f.id === id || escolhidos.has(f.id)).map(
          (f) => f.id,
        );
    aoMudar(proximo);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {FICHAS_DE_TESTE.map((ficha) => {
          const ativo = escolhidos.has(ficha.id);
          return (
            <button
              key={ficha.id}
              type="button"
              onClick={() => alternar(ficha.id)}
              disabled={desabilitado}
              aria-pressed={ativo}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                ativo
                  ? "border-marca bg-marca-forte/8"
                  : "hover:border-marca/40 hover:bg-secondary/50",
              )}
            >
              {/* Quadrado e não círculo: a forma diz que dá para marcar mais de
                  um, antes de a pessoa tentar. */}
              <span
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border-[1.5px]",
                  ativo ? "border-marca bg-marca-forte" : "border-border",
                )}
              >
                {ativo && <Check className="size-2.5 text-background" />}
              </span>
              <span className="min-w-0">
                <span className="block t-corpo-sm font-medium">{ficha.nome}</span>
                <span className="mt-1 block t-legenda leading-relaxed text-muted-foreground">
                  {ficha.resumo}
                </span>
                <span className="etiqueta mt-1.5 block">
                  {ficha.telas} telas · {rotuloDeTempo([ficha.id])}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-secondary/60 px-3 py-2 t-legenda text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {vazio ? (
            <span className="text-destructive">
              Nenhum teste marcado — escolha pelo menos um.
            </span>
          ) : (
            <>
              O candidato responde{" "}
              <span className="leitura font-semibold text-foreground">
                {telasDaBateria(valor)} telas
              </span>{" "}
              em {rotuloDeTempo(valor)}
            </>
          )}
        </span>
      </div>

      {semAderencia && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5 t-legenda leading-relaxed"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-fora" />
          <span>
            Sem o Prumo nem o Big Five, esta vaga <strong>não calcula
            aderência</strong>: DISC descreve estilo e o SJT mede julgamento, e
            nenhum dos dois vira os cinco fatores do perfil-alvo. O ranking
            continua listando todo mundo, só que sem nota de aderência — em vez
            de mostrar zero, que se leria como candidato ruim.
          </span>
        </p>
      )}
    </div>
  );
}
