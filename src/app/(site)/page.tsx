import type { Metadata } from "next";
import Link from "next/link";

import "./palco.css";
import { FundoNeural } from "@/components/site/fundo-neural";
import { RevelaAoEntrar } from "@/components/site/revela";

export const metadata: Metadata = {
  title: "Prumo — a precisão que o seu recrutamento merece",
  description:
    "Um teste comportamental que não julga, mas que conecta a pessoa certa à vaga certa.",
};

/**
 * A página inicial.
 *
 * ─── Sobre a imagem de referência ─────────────────────────────────────────
 * O briefing manda usar `image_0.png` como fundo do herói. Ela foi citada em
 * três pedidos e não chegou anexada em nenhum — procurei no disco, não existe.
 * O fundo é desenhado por código seguindo a descrição (fluxo neural vertical,
 * ciano no alto, magenta e vermelho embaixo) e vive isolado em `FundoNeural`,
 * de modo que trocar por um `<Image>` quando o arquivo chegar não toca em mais
 * nada desta página.
 *
 * ─── Onde o texto se afasta do que foi pedido, e por quê ──────────────────
 * "Agende uma Demonstração" e "Fale com um Especialista" pressupõem agenda e
 * time comercial, que hoje não existem. Botão que promete o que não acontece é
 * a pior primeira impressão possível — então os dois abrem um e-mail real, e o
 * endereço fica numa constante só. Quando houver formulário de verdade, muda
 * aqui e em nenhum outro lugar.
 */

/** Para onde os CTAs apontam hoje. Uma linha para trocar quando houver formulário. */
const CONTATO = "mailto:ederson.ricieri@gmail.com?subject=Prumo%20%E2%80%94%20quero%20conhecer";

export default function PaginaInicial() {
  return (
    <div className="palco relative min-h-svh overflow-x-clip">
      <Cabecalho />
      <Heroi />
      <ODiferencial />
      <OEntregavel />
      <ChamadaFinal />
      <Rodape />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Cabeçalho
   ───────────────────────────────────────────────────────────────────────── */

function Cabecalho() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="text-sm font-medium tracking-tight">
        Prumo
      </Link>
      <nav className="flex items-center gap-3">
        <Link href="/como-funciona" className="palco-cta-vazado">
          Como funciona
        </Link>
        <Link href="/entrar" className="palco-cta-vazado">
          Entrar
        </Link>
      </nav>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   1 — Herói
   ───────────────────────────────────────────────────────────────────────── */

function Heroi() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-6">
      <FundoNeural />

      {/* Véu sob o texto: o fluxo passa por trás e continua visível, mas o
          contraste do título fica garantido em qualquer ponto da composição.
          Sem ele, a legibilidade dependeria de onde os nodos caíram. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 z-[1] h-[60vh] -translate-y-1/2"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 50%, rgba(3,6,10,0.88), transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="palco-dado">Teste comportamental para seleção</p>

        <h1 className="palco-titulo mt-6 text-4xl sm:text-6xl">
          Prumo. A precisão que o seu recrutamento merece.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--palco-tinta-fraca)] sm:text-lg">
          Um teste comportamental que não julga, mas que conecta a pessoa certa à
          vaga certa.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href={CONTATO} className="palco-cta">
            Agende uma demonstração
            <span aria-hidden>→</span>
          </a>
          <Link href="/como-funciona" className="palco-cta-vazado">
            Entender em 5 minutos
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2 — O diferencial
   ───────────────────────────────────────────────────────────────────────── */

/** O mesmo perfil, duas vagas. Números ilustrativos, e a seção diz isso. */
const CAMINHOS = [
  { vaga: "Vaga A", papel: "Desenvolvedor", fit: 92, cor: "var(--palco-tinta)" },
  { vaga: "Vaga B", papel: "Comercial", fit: 61, cor: "var(--nodo-laranja)" },
] as const;

function ODiferencial() {
  return (
    <section className="relative z-10 bg-[var(--palco-preto)] px-6 py-28 sm:px-10 sm:py-40">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <h2 className="palco-titulo max-w-2xl text-3xl sm:text-5xl">
            Não é um veredito, é conexão.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--palco-tinta-fraca)] sm:text-lg">
            Esqueça os rótulos de &ldquo;bom&rdquo; ou &ldquo;mau&rdquo;
            candidato. O Prumo mede a <em>proximidade</em> — o quanto cada perfil
            único se aproxima do que <em>aquela vaga específica</em> exige.
          </p>
        </RevelaAoEntrar>

        {/* O gráfico: um perfil, dois caminhos, dois destinos. É a tese inteira
            em quinze elementos — e por isso ele não é ilustração decorativa, é
            o argumento. */}
        <RevelaAoEntrar atraso={0.12}>
          <div className="mt-20 grid items-center gap-10 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-4">
              <span className="nodo" style={{ ["--cor" as string]: "var(--nodo-ciano)" }} />
              <div>
                <p className="palco-dado">Perfil</p>
                <p className="text-sm text-[var(--palco-tinta)]">Candidato 001</p>
              </div>
            </div>

            <ul className="space-y-8">
              {CAMINHOS.map((c) => (
                <li key={c.vaga}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="flex items-center gap-3">
                      <span className="palco-dado">{c.vaga}</span>
                      <span className="text-base text-[var(--palco-tinta)]">
                        {c.papel}
                      </span>
                    </p>
                    <p className="flex items-center gap-3">
                      <span
                        className="nodo"
                        style={{ ["--cor" as string]: c.cor }}
                      />
                      <span
                        className="text-2xl font-light tabular-nums sm:text-3xl"
                        style={{ color: c.cor }}
                      >
                        {c.fit}%
                      </span>
                      <span className="palco-dado">fit</span>
                    </p>
                  </div>

                  {/* O caminho: a largura É o número, não uma barra ao lado dele. */}
                  <div className="mt-4 h-px w-full bg-[var(--palco-linha)]">
                    <div
                      className="h-px"
                      style={{
                        width: `${c.fit}%`,
                        background: c.cor,
                        boxShadow: `0 0 0.5rem 0 ${c.cor}`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-14 max-w-xl text-sm leading-relaxed text-[var(--palco-tinta-tenue)]">
            A mesma pessoa, as mesmas respostas. O que mudou foi a vaga. Números
            ilustrativos.
          </p>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   3 — O entregável
   ───────────────────────────────────────────────────────────────────────── */

const BENEFICIOS = [
  {
    cor: "var(--nodo-ciano)",
    titulo: "Entrevistas guiadas",
    texto:
      "Perguntas escolhidas para aquela pessoa naquela vaga, com o motivo de cada uma.",
  },
  {
    cor: "var(--nodo-laranja)",
    titulo: "Insights de comportamento",
    texto:
      "O que puxou o resultado para cima e para baixo, em linguagem de gente.",
  },
  {
    cor: "var(--nodo-rosa)",
    titulo: "Alinhamento cultural",
    texto:
      "O perfil-alvo é seu: você define o peso de cada dimensão em cada vaga.",
  },
] as const;

function OEntregavel() {
  return (
    <section className="relative z-10 bg-[var(--palco-preto)] px-6 py-28 sm:px-10 sm:py-40">
      <div className="mx-auto max-w-5xl">
        <RevelaAoEntrar>
          <h2 className="palco-titulo max-w-2xl text-3xl sm:text-5xl">
            Roteiro de entrevista, não um sim ou não.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--palco-tinta-fraca)] sm:text-lg">
            Entregamos ao seu RH um roteiro personalizado e a leitura do perfil.
            Em vez de uma barreira, uma ponte para conversas melhores.
          </p>
        </RevelaAoEntrar>

        <ul className="mt-20 grid gap-10 sm:grid-cols-3">
          {BENEFICIOS.map((b, i) => (
            <RevelaAoEntrar key={b.titulo} atraso={0.1 * i}>
              <li>
                <span className="nodo" style={{ ["--cor" as string]: b.cor }} />
                <p className="mt-6 text-base text-[var(--palco-tinta)]">
                  {b.titulo}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--palco-tinta-fraca)]">
                  {b.texto}
                </p>
              </li>
            </RevelaAoEntrar>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   4 — Chamada final
   ───────────────────────────────────────────────────────────────────────── */

function ChamadaFinal() {
  return (
    <section className="relative z-10 overflow-hidden px-6 py-32 sm:px-10 sm:py-48">
      {/* A cor vem do nodo vermelho do fim do fluxo — é o mesmo objeto do herói,
          reaparecendo no rodapé para fechar a composição. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[80%]"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 100%, rgba(255,45,85,0.16), transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <RevelaAoEntrar>
          <span
            className="nodo"
            style={{ ["--cor" as string]: "var(--nodo-vermelho)" }}
          />
          <h3 className="palco-titulo mt-8 text-3xl sm:text-5xl">
            Pronto para elevar o nível do seu recrutamento?
          </h3>
          <div className="mt-10 flex justify-center">
            <a
              href={CONTATO}
              className="palco-cta"
              style={{ ["--cor" as string]: "var(--nodo-vermelho)" }}
            >
              Fale com um especialista Prumo
              <span aria-hidden>→</span>
            </a>
          </div>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Rodapé
   ───────────────────────────────────────────────────────────────────────── */

function Rodape() {
  return (
    <footer className="relative z-10 px-6 pb-12 sm:px-10">
      <div className="mx-auto max-w-5xl border-t border-[var(--palco-linha)] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="palco-dado">
            © {new Date().getFullYear()} Prumo — Inteligência para recrutamento
          </p>
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
