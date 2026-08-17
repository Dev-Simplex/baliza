import { AlertTriangle, ArrowDown, Check, Compass } from "lucide-react";

import type { Diagnostico, ItemDoDiagnostico } from "@/lib/analise/diagnostico";

/**
 * O diagnóstico, no topo da página do candidato.
 *
 * ─── Por que ele vem antes de tudo ─────────────────────────────────────────
 * A ordem da página é a ordem do trabalho. Quem abre esta tela está a poucos
 * minutos de uma conversa e precisa da síntese primeiro; a aderência, as
 * faixas, a ficha dos módulos e o radar continuam logo abaixo, na mesma ordem
 * de sempre, para quem for verificar. Nada foi removido — o que mudou é que a
 * conclusão parou de ser trabalho do leitor.
 *
 * ─── Componente de SERVIDOR ────────────────────────────────────────────────
 * Sem `"use client"`, pelo mesmo motivo de `ficha-de-modulos.tsx`: recebe dado
 * pronto e só desenha. O que monta o diagnóstico fica do outro lado da
 * fronteira, junto do banco de cenários.
 */

/** Uma linha de achado: nome, a evidência com a régua, e o "e daí". */
function Achado({
  item,
  tom,
}: {
  item: ItemDoDiagnostico;
  tom: "dentro" | "fora";
}) {
  return (
    <li className="flex gap-2.5">
      <span
        className={
          tom === "dentro"
            ? "mt-1 shrink-0 text-dentro"
            : "mt-1 shrink-0 text-fora"
        }
      >
        {tom === "dentro" ? (
          <Check className="size-3.5" />
        ) : (
          <AlertTriangle className="size-3.5" />
        )}
      </span>
      <div className="min-w-0">
        <p className="t-corpo-sm font-semibold">
          {item.titulo}
          {/* O obrigatório do §4.6 é o único achado que ganha marca própria:
              ele não pode ser lido como "mais um item da lista". */}
          {item.obrigatorio && (
            <span className="etiqueta ml-2 align-middle text-fora">
              levar à entrevista
            </span>
          )}
        </p>
        {/* Evidência antes da leitura, sempre. O número sozinho vira nota; a
            leitura sozinha vira opinião. Os dois juntos podem ser contestados,
            que é o que o produto quer que aconteça. */}
        <p className="leitura mt-0.5 t-legenda text-muted-foreground">
          {item.evidencia}
        </p>
        <p className="mt-1 t-corpo-sm leading-relaxed text-muted-foreground">
          {item.consequencia}
        </p>
      </div>
    </li>
  );
}

export function DiagnosticoDoCandidato({
  diagnostico,
}: {
  diagnostico: Diagnostico;
}) {
  const { forcas, riscos, comoTrabalhar, confianca } = diagnostico;

  return (
    <section className="rounded-xl border border-marca/30 bg-marca-forte/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-marca" />
          <h2 className="text-sm font-semibold">Diagnóstico</h2>
        </div>
        {/* O selo anda colado na leitura, e não no rodapé: a regra do §4.4 vale
            aqui pelo mesmo motivo que vale para o número — uma síntese sem o
            grau de confiança dela é uma síntese com mais autoridade do que ela
            tem. */}
        {confianca && (
          <p className="etiqueta text-right">
            Confiança da leitura: {confianca.rotulo}
          </p>
        )}
      </div>

      <p className="mt-3 t-corpo leading-relaxed">{diagnostico.leitura}</p>

      {(forcas.length > 0 || riscos.length > 0) && (
        <div className="mt-6 grid gap-6 border-t pt-5 md:grid-cols-2">
          <div>
            <p className="etiqueta mb-3 text-dentro">
              O que sustenta esta contratação
            </p>
            {forcas.length > 0 ? (
              <ul className="space-y-3.5">
                {forcas.map((item, i) => (
                  <Achado key={`${item.titulo}-${i}`} item={item} tom="dentro" />
                ))}
              </ul>
            ) : (
              <p className="t-corpo-sm text-muted-foreground">
                Nenhuma dimensão com peso nesta vaga ficou dentro da faixa
                pedida.
              </p>
            )}
          </div>

          <div>
            <p className="etiqueta mb-3 text-fora">
              O que precisa ser confirmado
            </p>
            {riscos.length > 0 ? (
              <>
                <ul className="space-y-3.5">
                  {riscos.map((item, i) => (
                    <Achado key={`${item.titulo}-${i}`} item={item} tom="fora" />
                  ))}
                </ul>
                {/* A frase que impede a leitura errada mais cara desta coluna.
                    Sem ela, a lista inteira é lida como defeito encontrado — e
                    o que ela é, de verdade, é a pauta da conversa. */}
                <p className="mt-4 border-t pt-3 t-legenda leading-relaxed text-muted-foreground">
                  Nada aqui reprova ninguém: escore baixo descreve tendência,
                  não impedimento. Esta coluna é a pauta da entrevista, não uma
                  lista de defeitos.
                </p>
              </>
            ) : (
              <p className="t-corpo-sm text-muted-foreground">
                Nenhuma dimensão ficou fora da faixa e nenhum módulo acendeu
                alerta. Continua valendo confirmar as forças na entrevista.
              </p>
            )}
          </div>
        </div>
      )}

      {comoTrabalhar.length > 0 && (
        <div className="mt-6 border-t pt-5">
          <p className="etiqueta mb-2.5">Como trabalhar com essa pessoa</p>
          {/* A parte do diagnóstico que nenhum número responde: contratar não
              termina no sim. Isto é o que o gestor vai ter que dar. */}
          <ul className="space-y-1.5">
            {comoTrabalhar.map((linha, i) => (
              <li
                key={i}
                className="flex gap-2 t-corpo-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-2 size-1 shrink-0 rounded-full bg-marca/60" />
                {linha}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-start gap-2 border-t pt-4 t-legenda leading-relaxed text-muted-foreground">
        <ArrowDown className="mt-0.5 size-3 shrink-0" />
        <p>
          {diagnostico.perguntasNoRoteiro > 0 ? (
            <>
              As {diagnostico.perguntasNoRoteiro} perguntas do roteiro, mais
              abaixo, sondam exatamente estes pontos.{" "}
            </>
          ) : null}
          Isto é leitura de evidência, não recomendação de contratação: o
          instrumento descreve tendência, e quem decide — com nome e data — é o
          parecer no fim da página.
        </p>
      </div>
    </section>
  );
}
