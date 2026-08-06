import { AlertTriangle, ShieldCheck } from "lucide-react";

import type { BlocoBigFive, BlocoDisc, BlocoSjt, FichaDeModulos } from "@/lib/analise/ficha";
import type { QualidadeDasRespostas } from "@/lib/analise/qualidade";
import { cn } from "@/lib/utils";

/**
 * A ficha do analista para os módulos do manual — Big Five, DISC e SJT.
 *
 * Desenha o §5.2 na linguagem visual do produto: cartão, escala 0–100 sempre
 * visível, e nenhum número solto sem a leitura ao lado.
 *
 * ─── É componente de SERVIDOR, e isso não é detalhe ────────────────────────
 * Sem `"use client"`, de propósito. Ele recebe a ficha PRONTA em props e só
 * desenha: o banco de cenários do SJT — que carrega o gabarito — fica do outro
 * lado da fronteira, em `lib/analise/ficha.ts`. Transformar isto num componente
 * de cliente arrastaria o gabarito para o navegador (§4.2 do manual).
 */

/** Trilho de 0 a 100. É a mesma escala das faixas do Prumo, sem a faixa alvo. */
function Barra({
  valor,
  className,
}: {
  valor: number;
  className?: string;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full bg-marca-forte/70", className)}
        style={{ width: `${Math.max(0, Math.min(100, valor))}%` }}
      />
    </div>
  );
}

// ─── Big Five ──────────────────────────────────────────────────────────────

function CartaoBigFive({ bloco }: { bloco: BlocoBigFive }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Big Five</h2>
        <span className="etiqueta">Mini-IPIP · 0–100</span>
      </div>

      <ul className="mt-4 space-y-3.5">
        {bloco.notas.map((nota) => (
          <li key={nota.chave}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="t-corpo-sm">{nota.rotulo}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="etiqueta">{nota.faixa.rotulo}</span>
                <span className="leitura text-sm font-semibold">{nota.score}</span>
              </span>
            </div>
            <div className="mt-1.5">
              <Barra valor={nota.score} />
            </div>
            <p className="mt-1 t-legenda leading-relaxed text-muted-foreground">
              {nota.leitura}
            </p>
          </li>
        ))}
      </ul>

      {/* A nota do §2.6 que impede a leitura errada mais comum destes cinco
          números: não existe perfil bom universal. */}
      <p className="mt-4 border-t pt-3 t-legenda leading-relaxed text-muted-foreground">
        Não existe perfil bom ou ruim aqui — a leitura é sempre em relação à
        vaga. Extroversão baixa, por exemplo, pode ser exatamente o que um cargo
        analítico pede.
      </p>
    </section>
  );
}

// ─── DISC ──────────────────────────────────────────────────────────────────

function CartaoDisc({ bloco }: { bloco: BlocoDisc }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">DISC</h2>
        <span className="etiqueta">Estilo de trabalho · 0–100</span>
      </div>

      <ul className="mt-4 space-y-3">
        {bloco.dimensoes.map((d) => (
          <li key={d.dimensao}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="t-corpo-sm">
                <span className="leitura mr-1.5 text-marca">{d.dimensao}</span>
                {d.nome}
              </span>
              <span className="leitura shrink-0 text-sm font-semibold">
                {d.score}
              </span>
            </div>
            <div className="mt-1.5">
              <Barra valor={d.score} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t pt-4">
        <p className="etiqueta">Perfil</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{bloco.rotulo}</p>
        <p className="mt-0.5 t-corpo-sm text-marca">{bloco.resumo}</p>

        <dl className="mt-4 space-y-2.5 t-corpo-sm">
          <div>
            <dt className="etiqueta mb-0.5 text-dentro">Pontos fortes típicos</dt>
            <dd className="text-muted-foreground">{bloco.fortes.join(" · ")}</dd>
          </div>
          <div>
            <dt className="etiqueta mb-0.5 text-fora">Pontos de atenção típicos</dt>
            <dd className="text-muted-foreground">{bloco.atencao.join(" · ")}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 border-t pt-3 t-legenda leading-relaxed text-muted-foreground">
        DISC descreve estilo, não competência nem caráter. Serve para prever como
        a pessoa tende a trabalhar e se comunicar — nunca como nota de aprovação.
      </p>
    </section>
  );
}

// ─── SJT ───────────────────────────────────────────────────────────────────

function CartaoSjt({ bloco }: { bloco: BlocoSjt }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Julgamento situacional (SJT)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {bloco.faixa.leitura}
          </p>
        </div>
        <div className="text-right">
          <p className="etiqueta">Score</p>
          <p className="leitura text-3xl leading-none font-semibold text-marca">
            {bloco.score}
          </p>
          <p className="etiqueta mt-1">
            {bloco.pontosObtidos} de {bloco.pontosMaximos} pontos
          </p>
        </div>
      </div>

      {/* A abertura por competência é obrigatória, não um detalhamento
          opcional: o score geral esconde o zero (§4.5). Um 69 com um zero
          dentro e um 69 sem zero nenhum são duas pessoas diferentes. */}
      <div className="mt-5 border-t pt-4">
        <p className="etiqueta mb-3">Por competência</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {bloco.competencias.map((c) => (
            <li
              key={c.rotulo}
              className={cn(
                "flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2",
                c.atencao && "border-fora/40 bg-fora/5",
              )}
            >
              <span className="t-corpo-sm">
                {c.curto}
                {c.atencao && (
                  <AlertTriangle
                    aria-label="abaixo do limiar de atenção"
                    className="ml-1.5 inline size-3 align-[-1px] text-fora"
                  />
                )}
              </span>
              <span
                className={cn(
                  "leitura shrink-0 text-sm font-semibold",
                  c.atencao && "text-fora",
                )}
              >
                {c.score}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {bloco.piores.length > 0 && (
        <div className="mt-4 rounded-lg border border-fora/40 bg-fora/5 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-fora">
            <AlertTriangle className="size-3.5" />
            {bloco.piores.length === 1
              ? "Escolheu a pior alternativa em 1 cenário"
              : `Escolheu a pior alternativa em ${bloco.piores.length} cenários`}
          </p>
          <ul className="mt-2 space-y-1 t-corpo-sm">
            {bloco.piores.map((p) => (
              <li key={p.titulo}>
                “{p.titulo}” <span className="etiqueta">{p.competencia}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 t-legenda leading-relaxed text-muted-foreground">
            Vai para o roteiro de entrevista independentemente do score geral. O
            que se leva à conversa é a situação, nunca o cenário do teste — o
            banco é reaplicado em outros processos.
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Qualidade das respostas (§6.3) ────────────────────────────────────────

export function CartaoDeQualidade({
  qualidade,
}: {
  qualidade: QualidadeDasRespostas;
}) {
  const semAlertas = qualidade.avaliavel && qualidade.alertas.length === 0;

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        {semAlertas ? (
          <ShieldCheck className="size-4 text-dentro" />
        ) : (
          <AlertTriangle
            className={cn(
              "size-4",
              qualidade.avaliavel ? "text-fora" : "text-muted-foreground",
            )}
          />
        )}
        <h2 className="text-sm font-semibold">Qualidade das respostas</h2>
      </div>

      {!qualidade.avaliavel ? (
        <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
          Não foi possível conferir: as respostas brutas desta avaliação já foram
          apagadas pelo prazo de retenção. Isso não quer dizer “sem alertas” —
          quer dizer que não há mais o que conferir.
        </p>
      ) : semAlertas ? (
        <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
          Sem alertas. Nenhum dos três controles do manual (tempo por tela,
          padrão uniforme e itens espelhados) acusou nada.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {qualidade.alertas.map((a) => (
            <li key={a.chave} className="rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5">
              <p className="text-xs font-semibold text-fora">{a.titulo}</p>
              <p className="mt-1 t-corpo-sm text-muted-foreground">{a.detalhe}</p>
              <p className="mt-0.5 t-legenda text-muted-foreground">{a.acao}</p>
            </li>
          ))}
        </ul>
      )}

      {/* A frase que fecha o §6.3 e que não pode faltar em tela nenhuma. */}
      <p className="mt-4 border-t pt-3 t-legenda leading-relaxed text-muted-foreground">
        Alertas nunca eliminam candidato — orientam o analista sobre o quanto
        confiar no resultado.
      </p>
    </section>
  );
}

// ─── A ficha inteira ───────────────────────────────────────────────────────

export function FichaDosModulos({
  ficha,
  qualidade,
}: {
  ficha: FichaDeModulos;
  /** Ausente quando a bateria não tem módulo que produza alerta do §6.3. */
  qualidade?: QualidadeDasRespostas | null;
}) {
  if (!ficha.temAlgum) return null;

  return (
    <div className="space-y-4">
      {ficha.sjt && <CartaoSjt bloco={ficha.sjt} />}

      {(ficha.bigFive || ficha.disc) && (
        <div
          className={cn(
            "grid gap-4",
            ficha.bigFive && ficha.disc && "lg:grid-cols-2",
          )}
        >
          {ficha.bigFive && <CartaoBigFive bloco={ficha.bigFive} />}
          {ficha.disc && <CartaoDisc bloco={ficha.disc} />}
        </div>
      )}

      {qualidade && <CartaoDeQualidade qualidade={qualidade} />}
    </div>
  );
}
