import type { Metadata } from "next";
import Link from "next/link";

import "./palco.css";
import { Heroi } from "@/components/site/heroi";
import { NarrativaDoScroll, RevelaAoEntrar } from "@/components/site/narrativa";

export const metadata: Metadata = {
  title: "Prumo — não existe perfil ideal",
  description:
    "Existe o perfil certo para cada vaga. O Prumo mostra o encontro entre uma pessoa e uma oportunidade.",
};

/**
 * A página inicial.
 *
 * ─── A tese, e por que ela precisa ser DESCOBERTA ─────────────────────────
 * O prumo de pedreiro tem uma referência só, a gravidade, e por isso julga: a
 * parede está torta ou reta. Este produto tem uma referência POR VAGA, e por
 * isso não julga ninguém.
 *
 * Um bloco de texto dizendo isso convence pouco. Um objeto que se realinha
 * sozinho a cada vaga, mostrando 92% e depois 61% para o MESMO peso, convence
 * antes de qualquer frase — e é por isso que a página quase não tem texto.
 *
 * ─── Sobre o 3D ──────────────────────────────────────────────────────────
 * Eu havia feito a versão anterior em canvas 2D e argumentado contra Three.js
 * pelo peso. O dono do produto pediu 3D em wireframe duas vezes, com detalhe.
 * É decisão dele. O custo foi mitigado, não escondido: a cena inteira entra por
 * importação dinâmica, então o texto chega primeiro.
 */

/**
 * O mesmo perfil, três referências.
 *
 * Números ilustrativos, e a página diz isso. Poderiam sair do banco, mas a
 * página inicial é pública: exibir aderência real de alguém, mesmo sem nome, é
 * dado de candidato circulando sem necessidade.
 */
const VAGAS = [
  { nome: "Desenvolvedor full stack", fit: 92 },
  { nome: "Gestor de projetos", fit: 74 },
  { nome: "Executivo comercial", fit: 61 },
] as const;

export default function PaginaInicial() {
  return (
    <div className="palco relative min-h-svh overflow-x-clip">
      <Cabecalho />
      <Heroi vagas={[...VAGAS]} />
      <NarrativaDoScroll />
      <NaoJulga />
      <OMesmoPerfil />
      <TodaVagaTemUmPrumo />
      <OQueOPrumoNaoFaz />
      <Rodape />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Cabeçalho — texto técnico com borda, não navbar.
   ───────────────────────────────────────────────────────────────────────── */

function Cabecalho() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="palco-dado !text-[var(--palco-tinta)]">
        Prumo
      </Link>

      <nav className="flex items-center gap-2 sm:gap-3">
        <Link href="/como-funciona" className="palco-chip">
          [ Empresa ]
        </Link>
        <Link href="/entrar" className="palco-chip">
          [ Entrar ]
        </Link>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2 — O Prumo não julga.
   ───────────────────────────────────────────────────────────────────────── */

function NaoJulga() {
  return (
    <section className="relative z-10 px-6 py-40 sm:px-10 sm:py-56">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <p className="palco-dado">Profile_analysis</p>
          <h2 className="palco-declaracao mt-6 text-4xl sm:text-6xl">
            O Prumo não julga.
          </h2>
          <p className="palco-declaracao mt-4 text-4xl text-[var(--palco-cobre)] sm:text-6xl">
            Ele compara.
          </p>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   3 — O mesmo perfil.
   ───────────────────────────────────────────────────────────────────────── */

function OMesmoPerfil() {
  return (
    <section className="relative z-10 px-6 py-32 sm:px-10 sm:py-48">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <p className="palco-dado">Reference: vacancy</p>
          <h2 className="palco-declaracao mt-6 text-3xl sm:text-5xl">
            O mesmo perfil.
          </h2>
        </RevelaAoEntrar>

        {/* Leitura de instrumento, não cartões: cada vaga é uma linha, e a régua
            de cobre É o número — a largura carrega o dado, não uma decoração ao
            lado dele. */}
        <ul className="mt-20">
          {VAGAS.map((v, i) => (
            <RevelaAoEntrar key={v.nome} atraso={0.08 * i}>
              <li className="border-t border-[var(--palco-linha)] py-7">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <p className="flex items-baseline gap-4">
                    <span className="palco-dado">
                      Vaga {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="palco-declaracao text-xl text-[var(--palco-tinta)] sm:text-2xl">
                      {v.nome}
                    </span>
                  </p>
                  <span
                    className="text-3xl font-light tabular-nums text-[var(--palco-cobre)] sm:text-4xl"
                    style={{ fontFamily: "var(--fonte-mono)" }}
                  >
                    {v.fit}
                    <span className="align-super text-base">%</span>
                  </span>
                </div>

                <div className="mt-5 h-px w-full bg-[var(--palco-linha)]" aria-hidden>
                  <div
                    className="h-px bg-[var(--palco-cobre)]"
                    style={{ width: `${v.fit}%`, opacity: 0.7 }}
                  />
                </div>
              </li>
            </RevelaAoEntrar>
          ))}
        </ul>

        <RevelaAoEntrar atraso={0.1}>
          <p className="palco-declaracao mt-24 text-2xl sm:text-4xl">
            A pessoa é a mesma.
            <br />
            <span className="text-[var(--palco-tinta-fraca)]">
              A referência mudou.
            </span>
          </p>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-[var(--palco-tinta-tenue)]">
            Números ilustrativos.
          </p>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   4 — Toda vaga tem um prumo.
   ───────────────────────────────────────────────────────────────────────── */

const CADEIA = [
  { rotulo: "Vaga", texto: "o que aquele trabalho exige de comportamento" },
  { rotulo: "Referência", texto: "o peso de cada dimensão nessa vaga" },
  { rotulo: "Perfil", texto: "como a pessoa respondeu, sem certo nem errado" },
  { rotulo: "Aderência", texto: "a distância entre os dois" },
] as const;

function TodaVagaTemUmPrumo() {
  return (
    <section className="relative z-10 px-6 py-32 sm:px-10 sm:py-48">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <h2 className="palco-declaracao text-3xl sm:text-5xl">
            Toda vaga tem um prumo.
          </h2>
        </RevelaAoEntrar>

        {/* A cadeia desce como um fio: cada elo é um degrau, ligado ao seguinte
            por um traço vertical. É a forma do objeto virada diagrama, e por
            isso não precisa de setas nem caixas. */}
        <ol className="mt-20 max-w-2xl">
          {CADEIA.map((elo, i) => (
            <RevelaAoEntrar key={elo.rotulo} atraso={0.1 * i}>
              <li className="relative pb-12 pl-8">
                {i < CADEIA.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[3px] top-3 h-full w-px bg-[var(--palco-linha)]"
                  />
                )}
                <span
                  aria-hidden
                  className="absolute left-0 top-2 size-[7px] rounded-full"
                  style={{
                    background:
                      i === CADEIA.length - 1
                        ? "var(--palco-cobre)"
                        : "var(--palco-tinta-tenue)",
                  }}
                />
                <p className="palco-dado">{elo.rotulo}</p>
                <p className="mt-2 text-lg font-light leading-relaxed text-[var(--palco-tinta-fraca)]">
                  {elo.texto}
                </p>
              </li>
            </RevelaAoEntrar>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   5 — O que o Prumo não faz.
   ───────────────────────────────────────────────────────────────────────── */

const NEGACOES = [
  "Não é teste de QI.",
  "Não é prova de conhecimento.",
  "Não diz quem é bom ou ruim.",
  "Não reprova ninguém.",
] as const;

function OQueOPrumoNaoFaz() {
  return (
    <section className="relative z-10 px-6 py-32 sm:px-10 sm:py-48">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <h2 className="palco-declaracao text-3xl sm:text-5xl">
            O que o Prumo não faz.
          </h2>
        </RevelaAoEntrar>

        <ul className="mt-16">
          {NEGACOES.map((n, i) => (
            <RevelaAoEntrar key={n} atraso={0.07 * i}>
              <li className="border-t border-[var(--palco-linha)] py-6 text-xl font-light text-[var(--palco-tinta-fraca)] sm:text-2xl">
                {n}
              </li>
            </RevelaAoEntrar>
          ))}
        </ul>

        <RevelaAoEntrar atraso={0.15}>
          <div className="mt-28">
            <div className="palco-regua" />
            <p className="palco-declaracao mt-14 max-w-3xl text-3xl sm:text-5xl">
              Ele apenas mostra o{" "}
              <span className="text-[var(--palco-cobre)]">encontro</span> entre
              uma pessoa e uma oportunidade.
            </p>

            <Link href="/como-funciona" className="palco-botao mt-14">
              Entrar na lista
              <span className="seta" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Rodapé.
   ───────────────────────────────────────────────────────────────────────── */

function Rodape() {
  return (
    <footer className="relative z-10 px-6 pb-14 pt-24 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="palco-regua" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="palco-dado">Prumo® — Inteligência para recrutamento</p>
          <nav className="flex gap-6">
            <Link
              href="/como-funciona"
              className="palco-dado transition-colors hover:text-[var(--palco-tinta)]"
            >
              Como funciona
            </Link>
            <Link
              href="/privacidade"
              className="palco-dado transition-colors hover:text-[var(--palco-tinta)]"
            >
              Privacidade
            </Link>
            <Link
              href="/termos"
              className="palco-dado transition-colors hover:text-[var(--palco-tinta)]"
            >
              Termos
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
