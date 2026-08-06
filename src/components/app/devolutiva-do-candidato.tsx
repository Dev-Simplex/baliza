import type { Devolutiva } from "@/lib/analise/devolutiva";

/**
 * A ficha do CANDIDATO — a devolutiva do §5.1 do manual.
 *
 * ═══ NÃO ESTÁ LIGADA A ROTA NENHUMA, E ISSO É DE PROPÓSITO ═════════════════
 * Neste produto o candidato não vê o próprio resultado (decisão do dono, commit
 * 9944ae9). Este componente e a `montarDevolutiva` que o alimenta existem
 * prontos porque o manual descreve a devolutiva — não porque ela esteja no ar.
 * Ligar isto numa página é reabrir a decisão de produto: leia o cabeçalho de
 * `lib/analise/devolutiva.ts` antes.
 *
 * O tom é outro, e não por capricho: aqui não há aderência, comparação, alerta
 * nem SJT. É autoconhecimento — um retrato que a pessoa leva para si.
 */
export function DevolutivaDoCandidato({ devolutiva }: { devolutiva: Devolutiva }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="t-titulo">{devolutiva.saudacao}</h1>
      </header>

      {devolutiva.bigFive && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="etiqueta">Seu perfil de personalidade</h2>

          <ul className="mt-4 space-y-3">
            {devolutiva.bigFive.notas.map((nota) => (
              <li key={nota.rotulo}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="t-corpo-sm">{nota.rotulo}</span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="etiqueta">{nota.faixa}</span>
                    <span className="leitura text-sm font-semibold">
                      {nota.score}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-marca-forte/70"
                    style={{ width: `${nota.score}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t pt-4 t-corpo leading-relaxed">
            {devolutiva.bigFive.texto}
          </p>
        </section>
      )}

      {devolutiva.disc && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="etiqueta">Seu estilo de trabalho</h2>

          <ul className="mt-4 grid grid-cols-2 gap-3">
            {devolutiva.disc.dimensoes.map((d) => (
              <li key={d.dimensao}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="t-corpo-sm">{d.nome}</span>
                  <span className="leitura text-sm font-semibold">{d.score}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-marca-forte/70"
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t pt-4 t-corpo leading-relaxed">
            <span className="font-semibold">Perfil {devolutiva.disc.rotulo}</span>
            {" — "}
            {devolutiva.disc.frase}.
          </p>
        </section>
      )}

      {devolutiva.fortes.length > 0 && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="etiqueta">Seus pontos fortes</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {devolutiva.fortes.map((forte) => (
              <li
                key={forte}
                className="rounded-full border border-marca/40 bg-marca-forte/[0.06] px-3 py-1 text-xs font-medium text-marca"
              >
                {forte}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* A linha que enquadra a devolutiva inteira (§5.1). Ela não é rodapé
          decorativo: é o que impede a pessoa de sair da tela achando que um
          questionário de vinte minutos disse quem ela é. */}
      <p className="rounded-xl border border-dashed px-5 py-4 text-center t-corpo-sm text-muted-foreground">
        {devolutiva.encerramento}
      </p>
    </div>
  );
}
