"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, CircleSlash, HelpCircle, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  limparParecer,
  registrarParecer,
  type EstadoDoParecer,
} from "@/lib/actions/parecer";

export type Decisao = "ADVANCE" | "DOUBT" | "REJECT";

// O rótulo vem de `lib/formato` — ver a nota lá sobre por que ele mora fora
// deste arquivo. Reexportado só para quem já importava daqui.
export const ROTULO_DA_DECISAO: Record<Decisao, string> = {
  ADVANCE: "Avançar",
  DOUBT: "Dúvida",
  REJECT: "Não avançar",
};

const OPCOES: Array<{
  valor: Decisao;
  icone: typeof ThumbsUp;
  /** A cor codifica dado, e por isso vem dos tokens do tema, não de literal. */
  classe: string;
}> = [
  { valor: "ADVANCE", icone: ThumbsUp, classe: "text-dentro border-dentro/40 bg-dentro/5" },
  // Dúvida é neutra pelo mesmo motivo do selo de confiança: laranja é marca,
  // e marca não emite veredito sobre candidato.
  { valor: "DOUBT", icone: HelpCircle, classe: "text-foreground border-linha-forte bg-secondary" },
  { valor: "REJECT", icone: CircleSlash, classe: "text-fora border-fora/40 bg-fora/5" },
];

/**
 * O parecer do analista — a decisão que o produto não guardava.
 *
 * ─── Por que ele fica no fim da página, e não no topo ──────────────────────
 * A ordem da tela é a ordem do trabalho: primeiro o resultado, depois o roteiro,
 * e só então a decisão. Um seletor de "Avançar / Não avançar" acima do resultado
 * convidaria a decidir antes de ler — e o produto inteiro existe para que a
 * conversa venha antes do veredito.
 *
 * ─── Por que "Dúvida" tem o mesmo peso visual que as outras duas ───────────
 * Porque é o estado real da maioria das pessoas logo depois da entrevista.
 * Escondê-la como terceira opção discreta empurra para uma escolha apressada
 * entre sim e não, que é exatamente o que se quer evitar. Ela também é a única
 * que ainda pede ação de alguém, e por isso a lista a destaca.
 *
 * ─── Sobre confirmar antes de apagar ──────────────────────────────────────
 * "Remover" pede confirmação porque desfaz um registro com autoria e data —
 * pequeno na tela, mas é o rastro de quem decidiu o quê. Já REESCREVER não
 * pede: mudar de ideia é o caminho normal, e cada mudança fica na auditoria com
 * o valor anterior.
 */
export function ParecerDoAnalista({
  avaliacaoId,
  decisao,
  nota,
  decididoEm,
  decididoPor,
}: {
  avaliacaoId: string;
  decisao: Decisao | null;
  nota: string | null;
  decididoEm: string | null;
  decididoPor: string | null;
}) {
  const [escolha, setEscolha] = useState<Decisao | null>(decisao);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, transicaoDeRemocao] = useTransition();

  const [estado, enviar, enviando] = useActionState<EstadoDoParecer, FormData>(
    (anterior, dados) => registrarParecer(avaliacaoId, anterior, dados),
    {},
  );

  return (
    <section
      data-impressao="ocultar"
      className="rounded-xl border bg-card p-5"
      aria-labelledby="titulo-do-parecer"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-do-parecer" className="text-sm font-semibold">
          Parecer do analista
        </h2>
        {decisao && decididoEm && (
          <p className="t-legenda text-muted-foreground">
            {/* Autoria e data juntas: parecer sem quem e quando não sustenta um
                pedido de revisão nem uma conversa seis meses depois. */}
            {decididoPor ? `${decididoPor} · ` : ""}
            {decididoEm}
          </p>
        )}
      </div>

      <form action={enviar} className="mt-4">
        <fieldset>
          <legend className="sr-only">O que você decidiu</legend>
          <div className="flex flex-wrap gap-2">
            {OPCOES.map(({ valor, icone: Icone, classe }) => {
              const marcado = escolha === valor;
              return (
                <label
                  key={valor}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 t-corpo-sm transition-colors ${
                    marcado ? classe : "border-input hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="decisao"
                    value={valor}
                    checked={marcado}
                    onChange={() => setEscolha(valor)}
                    className="sr-only"
                  />
                  <Icone className="size-4" aria-hidden />
                  {ROTULO_DA_DECISAO[valor]}
                  {marcado && <Check className="size-3.5" aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4">
          <Label htmlFor="nota-do-parecer" className="t-legenda">
            Anotações da conversa
          </Label>
          <textarea
            id="nota-do-parecer"
            name="nota"
            defaultValue={nota ?? ""}
            rows={3}
            maxLength={2000}
            placeholder="O que a entrevista confirmou ou desmentiu."
            className="reset-base mt-1.5 w-full rounded-lg border border-input bg-transparent px-3 py-2 t-corpo-sm"
          />
          <p className="mt-1.5 t-legenda text-muted-foreground">
            Fica só aqui — não vai para o candidato em momento nenhum.
          </p>
        </div>

        {estado.erro && (
          <p className="mt-3 t-corpo-sm text-fora" role="alert">
            {estado.erro}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={!escolha || enviando}>
            {enviando ? "Salvando…" : decisao ? "Atualizar parecer" : "Salvar parecer"}
          </Button>

          {estado.ok && !enviando && (
            <span className="t-legenda text-dentro" role="status">
              Parecer salvo.
            </span>
          )}

          {decisao && !confirmandoRemocao && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setConfirmandoRemocao(true)}
            >
              Remover
            </Button>
          )}

          {confirmandoRemocao && (
            <span className="flex items-center gap-2 t-legenda">
              Remover o parecer?
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={removendo}
                onClick={() =>
                  transicaoDeRemocao(async () => {
                    await limparParecer(avaliacaoId);
                    setEscolha(null);
                    setConfirmandoRemocao(false);
                  })
                }
              >
                {removendo ? "Removendo…" : "Remover"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmandoRemocao(false)}
              >
                Cancelar
              </Button>
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
