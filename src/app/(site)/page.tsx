import type { Metadata } from "next";
import Link from "next/link";

import "./palco.css";
import { PrumoInterativo } from "@/components/site/prumo-interativo";
import { NarrativaDoScroll, RevelaAoEntrar } from "@/components/site/narrativa";

export const metadata: Metadata = {
  title: "Prumo — toda vaga tem um prumo",
  description:
    "Não medimos pessoas. Medimos a aderência entre pessoas e oportunidades.",
};

/**
 * A página inicial.
 *
 * ─── O que ela deixou de ser ──────────────────────────────────────────────
 * Eram 609 linhas e dez seções: herói, métricas, como funciona, benefícios, o
 * que medimos, depoimentos, perguntas, chamada final. Uma landing de SaaS
 * competente e absolutamente igual a todas as outras — e um produto cujo
 * argumento é "olhe com mais cuidado antes de decidir" não pode se apresentar
 * com o mesmo template de quem vende assinatura.
 *
 * ─── A ideia que a página inteira existe para transmitir ──────────────────
 * O prumo de pedreiro tem UMA referência: a gravidade. Por isso ele julga —
 * a parede está torta ou reta. Este produto tem uma referência POR VAGA, e por
 * isso não julga ninguém: a mesma pessoa fica perto do que uma vaga pede e
 * longe do que outra pede.
 *
 * O objeto no centro da tela é o argumento. Ele é sempre o MESMO peso; o que
 * muda é o ponto de equilíbrio para onde ele vai. Quem olhar por vinte segundos
 * entende a tese sem ler uma linha — e é por isso que o texto pode ser tão
 * pouco.
 *
 * ─── Por que não há Three.js ──────────────────────────────────────────────
 * Três.js mais React Three Fiber custam entre 600 KB e 1 MB de JavaScript para
 * desenhar um peso e um fio. Numa página cujo trabalho é PARECER premium, o
 * primeiro sinal de qualidade é abrir rápido. O prumo é canvas 2D com pêndulo
 * amortecido de verdade — mesma imagem, alguns KB, e roda liso no celular.
 */

/**
 * O mesmo perfil, três referências.
 *
 * Os números são ilustrativos e a página diz isso no rodapé da seção. Poderiam
 * sair de uma resposta real do banco, mas a página inicial é pública: exibir
 * aderência real de alguém, mesmo sem nome, é dado de candidato circulando sem
 * necessidade nenhuma.
 */
const VAGAS = [
  { nome: "Desenvolvedor front-end", fit: 94, rotulo: "alta aderência" },
  { nome: "Gerente comercial", fit: 61, rotulo: "aderência parcial" },
  { nome: "Analista de dados", fit: 87, rotulo: "alta aderência" },
] as const;

export default function PaginaInicial() {
  return (
    <div className="palco relative min-h-svh overflow-x-clip">
      <Cabecalho />
      <Palco />
      <NarrativaDoScroll />
      <AReferenciaMudou />
      <NaoEAprovarOuReprovar />
      <Rodape />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Cabeçalho — três palavras e nada mais.
   ───────────────────────────────────────────────────────────────────────── */

function Cabecalho() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="palco-dado !text-[var(--palco-tinta)]">
        Prumo
      </Link>

      <nav className="flex items-center gap-6">
        <Link
          href="/como-funciona"
          className="palco-dado transition-colors hover:text-[var(--palco-tinta)]"
        >
          Conhecer o Prumo
        </Link>
        <Link
          href="/entrar"
          className="palco-dado transition-colors hover:text-[var(--palco-tinta)]"
        >
          Entrar
        </Link>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   O palco: uma tela inteira, um objeto, quatro linhas de texto.
   ───────────────────────────────────────────────────────────────────────── */

function Palco() {
  return (
    <section className="relative h-svh w-full">
      {/* O objeto ocupa a tela inteira e fica ATRÁS do texto: o fio desce do
          topo e precisa de altura total para a queda parecer queda. */}
      <div className="absolute inset-0 z-0">
        <PrumoInterativo vagas={[...VAGAS]} />
      </div>

      {/* Microcopy nos cantos. É o que dá o ar de instrumento: um aparelho de
          medição tem etiquetas, e nenhuma delas grita. */}
      <p className="palco-dado absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 [writing-mode:vertical-rl] lg:block">
        Reference / 001
      </p>
      <p className="palco-dado absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 rotate-180 [writing-mode:vertical-rl] lg:block">
        Profile / analysis
      </p>

      {/* O texto vive no rodapé da tela, e não no meio: o meio é do objeto.
          Empurrar a fala para a margem é o que faz a composição respirar. */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-14 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <h1 className="palco-declaracao text-2xl sm:text-3xl">
              Toda vaga tem um prumo.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--palco-tinta-fraca)]">
              Não medimos pessoas. Medimos a aderência entre pessoas e
              oportunidades.
            </p>
          </div>

          <Link href="/como-funciona" className="palco-botao shrink-0">
            Explorar Prumo
            <span className="seta" aria-hidden>
              →
            </span>
          </Link>
        </div>

        <div className="palco-regua mx-auto mt-10 max-w-5xl" />

        <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between">
          <p className="palco-dado">Prumo® — Inteligência para recrutamento</p>
          <p className="palco-dado hidden sm:block">Role para descobrir</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   A pessoa não mudou. A referência mudou.
   ───────────────────────────────────────────────────────────────────────── */

function AReferenciaMudou() {
  return (
    <section className="relative z-10 px-6 py-32 sm:px-10 sm:py-48">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <h2 className="palco-declaracao max-w-2xl text-3xl sm:text-5xl">
            A pessoa não mudou.
            <br />
            <span className="text-[var(--palco-tinta-fraca)]">
              A referência mudou.
            </span>
          </h2>
        </RevelaAoEntrar>

        {/* Leitura de instrumento, e não cartões. Cada vaga é uma linha com uma
            régua que se preenche até o valor — a mesma gramática do medidor que
            o produto usa lá dentro, para a página não prometer uma estética que
            o sistema não cumpre. */}
        <div className="mt-20">
          <p className="palco-dado">Candidato / 001</p>

          <ul className="mt-6">
            {VAGAS.map((v, i) => (
              <RevelaAoEntrar key={v.nome} atraso={0.08 * i}>
                <li className="border-t border-[var(--palco-linha)] py-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <p className="palco-declaracao text-xl text-[var(--palco-tinta)] sm:text-2xl">
                      {v.nome}
                    </p>
                    <p className="flex items-baseline gap-3">
                      <span className="palco-dado">{v.rotulo}</span>
                      <span
                        className="text-3xl font-light tabular-nums text-[var(--palco-cobre)] sm:text-4xl"
                        style={{ fontFamily: "var(--fonte-mono)" }}
                      >
                        {v.fit}
                        <span className="text-base align-super">%</span>
                      </span>
                    </p>
                  </div>

                  {/* A régua é o dado, não decoração: a largura É o número. */}
                  <div
                    className="mt-5 h-px w-full bg-[var(--palco-linha)]"
                    aria-hidden
                  >
                    <div
                      className="h-px bg-[var(--palco-cobre)]"
                      style={{ width: `${v.fit}%`, opacity: 0.7 }}
                    />
                  </div>
                </li>
              </RevelaAoEntrar>
            ))}
          </ul>

          <p className="mt-10 max-w-md text-sm leading-relaxed text-[var(--palco-tinta-tenue)]">
            As mesmas respostas, lidas contra três vagas diferentes. Números
            ilustrativos.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Não é sobre aprovar ou reprovar.
   ───────────────────────────────────────────────────────────────────────── */

function NaoEAprovarOuReprovar() {
  return (
    <section className="relative z-10 px-6 py-32 sm:px-10 sm:py-48">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <h2 className="palco-declaracao max-w-2xl text-3xl sm:text-5xl">
            Não é sobre aprovar ou reprovar.
          </h2>
        </RevelaAoEntrar>

        <RevelaAoEntrar atraso={0.1}>
          {/* Quatro negações, uma por linha. Em lista, cada uma tem peso; em
              parágrafo corrido, viram ruído e o leitor pula. */}
          <ul className="mt-14 space-y-4 text-lg font-light leading-relaxed text-[var(--palco-tinta-fraca)] sm:text-xl">
            <li>O Prumo não define quem é bom ou ruim.</li>
            <li>Não é teste de QI.</li>
            <li>Não é prova de conhecimento.</li>
            <li>Não elimina candidatos.</li>
          </ul>
        </RevelaAoEntrar>

        <RevelaAoEntrar atraso={0.2}>
          <div className="mt-24">
            <div className="palco-regua" />
            <p className="palco-declaracao mt-14 text-4xl sm:text-6xl">
              Ele mostra <span className="text-[var(--palco-cobre)]">contexto</span>.
            </p>
          </div>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Rodapé — o mínimo que a lei e a educação pedem.
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
