import type { Metadata } from "next";
import Link from "next/link";

import "./palco.css";
import { CenaDaConversa, DiagramaDeFit } from "@/components/site/cena-da-conversa";
import { RevelaAoEntrar } from "@/components/site/revela";

export const metadata: Metadata = {
  title: "Prumo — a precisão que o seu recrutamento merece",
  description:
    "Um teste comportamental que não julga, mas que conecta a pessoa certa à vaga certa.",
};

/**
 * A página inicial.
 *
 * ─── Por que ela é clara, depois de duas versões pretas ───────────────────
 * A referência mudou, e a nova combina melhor com o produto. O que o Prumo
 * entrega é uma CONVERSA melhor — roteiro de entrevista em vez de veredito. Duas
 * poltronas frente a frente dizem isso; um objeto flutuando no espaço, não. O
 * prumo continua na cena, pendurado sobre as cadeiras: o método pairando sobre
 * o resultado.
 *
 * ─── O que ficou de fora, e não por acaso ─────────────────────────────────
 * Sem figura humana. A força da referência está no desenho das pessoas, e isso
 * não se faz em SVG à mão sem virar boneco de apresentação corporativa — que é
 * exatamente o que a direção recusa. A página fica com o que a linha faz bem:
 * mobiliário em contorno, diagrama, tipografia e muito branco.
 *
 * ─── Sobre os botões ──────────────────────────────────────────────────────
 * "Agende uma demonstração" pressupõe agenda, que não existe. Abrem um e-mail
 * real, com o endereço numa constante só — quando houver formulário, muda aqui
 * e em nenhum outro lugar. Botão que promete o que não acontece é a pior
 * primeira impressão possível.
 */

const CONTATO =
  "mailto:ederson.ricieri@gmail.com?subject=Prumo%20%E2%80%94%20quero%20conhecer";

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

function Cabecalho() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 sm:px-10">
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
    <section className="relative px-6 pb-24 pt-36 sm:px-10 sm:pb-32 sm:pt-44">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="palco-dado">Teste comportamental para seleção</p>

          <h1 className="palco-titulo mt-6 text-4xl sm:text-5xl lg:text-6xl">
            A precisão que o seu recrutamento merece.
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-[var(--palco-tinta-fraca)] sm:text-lg">
            Um teste comportamental que não julga, mas que conecta a pessoa certa
            à vaga certa.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={CONTATO} className="palco-cta">
              Agende uma demonstração
              <span className="seta" aria-hidden>
                →
              </span>
            </a>
            <Link href="/como-funciona" className="palco-cta-vazado">
              Entender em 5 minutos
            </Link>
          </div>
        </div>

        {/* A cena. Em telas estreitas ela vem DEPOIS do texto — a promessa se lê
            antes do desenho, porque é ela que faz alguém continuar. */}
        <CenaDaConversa className="w-full" />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2 — O diferencial
   ───────────────────────────────────────────────────────────────────────── */

const CAMINHOS = [
  { vaga: "Vaga A", papel: "Desenvolvedor", fit: 92, forte: true },
  { vaga: "Vaga B", papel: "Comercial", fit: 61, forte: false },
] as const;

function ODiferencial() {
  return (
    <section className="relative z-10 bg-[var(--palco-papel-2)] px-6 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <RevelaAoEntrar>
          <h2 className="palco-titulo max-w-2xl text-3xl sm:text-4xl">
            Não é um veredito, é conexão.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--palco-tinta-fraca)]">
            Esqueça os rótulos de &ldquo;bom&rdquo; ou &ldquo;mau&rdquo;
            candidato. O Prumo mede a <em>proximidade</em> — o quanto cada perfil
            único se aproxima do que <em>aquela vaga específica</em> exige.
          </p>
        </RevelaAoEntrar>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <RevelaAoEntrar>
            <DiagramaDeFit className="w-full" />
          </RevelaAoEntrar>

          <RevelaAoEntrar atraso={0.1}>
            <ul className="space-y-8">
              {CAMINHOS.map((c) => (
                <li key={c.vaga}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="flex items-baseline gap-3">
                      <span className="palco-dado">{c.vaga}</span>
                      <span className="text-base">{c.papel}</span>
                    </p>
                    <span
                      className={`text-3xl font-light tabular-nums ${
                        c.forte
                          ? "text-[var(--palco-marca)]"
                          : "text-[var(--palco-tinta-tenue)]"
                      }`}
                    >
                      {c.fit}%
                    </span>
                  </div>

                  {/* A largura É o número — não há barra ao lado de um valor. */}
                  <div className="mt-4 h-px w-full bg-[var(--palco-linha)]">
                    <div
                      className="h-px"
                      style={{
                        width: `${c.fit}%`,
                        background: c.forte
                          ? "var(--palco-marca-forte)"
                          : "var(--palco-tinta-tenue)",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-10 max-w-md text-sm leading-relaxed text-[var(--palco-tinta-tenue)]">
              A mesma pessoa, as mesmas respostas. O que mudou foi a vaga.
              Números ilustrativos.
            </p>
          </RevelaAoEntrar>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   3 — O entregável
   ───────────────────────────────────────────────────────────────────────── */

const BENEFICIOS = [
  {
    titulo: "Entrevistas guiadas",
    texto:
      "Perguntas escolhidas para aquela pessoa naquela vaga, com o motivo de cada uma ao lado.",
  },
  {
    titulo: "Insights de comportamento",
    texto:
      "O que puxou o resultado para cima e para baixo, em linguagem de gente.",
  },
  {
    titulo: "Alinhamento cultural",
    texto: "O perfil-alvo é seu: você define o peso de cada dimensão, por vaga.",
  },
] as const;

function OEntregavel() {
  return (
    <section className="relative z-10 px-6 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <RevelaAoEntrar>
          <h2 className="palco-titulo max-w-2xl text-3xl sm:text-4xl">
            Roteiro de entrevista, não um sim ou não.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--palco-tinta-fraca)]">
            Entregamos ao seu RH um roteiro personalizado e a leitura do perfil.
            Em vez de uma barreira, uma ponte para conversas melhores.
          </p>
        </RevelaAoEntrar>

        <ul className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {BENEFICIOS.map((b, i) => (
            <RevelaAoEntrar key={b.titulo} atraso={0.08 * i}>
              <li>
                {/* Numeração em latão, e não ícone: três ícones diferentes
                    puxariam o olho para os desenhos; o número mantém a leitura
                    no texto, que é onde está a informação. */}
                <p
                  className="text-2xl font-light tabular-nums text-[var(--palco-marca-forte)]"
                  style={{ fontFamily: "var(--fonte-mono)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className="mt-4 h-px w-10 bg-[var(--palco-linha)]" />
                <p className="mt-5 text-base">{b.titulo}</p>
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
    <section className="relative z-10 bg-[var(--palco-marca-suave)] px-6 py-24 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <RevelaAoEntrar>
          <h3 className="palco-titulo text-3xl sm:text-4xl">
            Pronto para elevar o nível do seu recrutamento?
          </h3>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[var(--palco-tinta-fraca)]">
            Mostramos o produto funcionando com uma vaga sua, sem compromisso.
          </p>
          <div className="mt-10 flex justify-center">
            <a href={CONTATO} className="palco-cta">
              Fale com um especialista Prumo
              <span className="seta" aria-hidden>
                →
              </span>
            </a>
          </div>
        </RevelaAoEntrar>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="relative z-10 px-6 pb-12 pt-16 sm:px-10">
      <div className="mx-auto max-w-6xl border-t border-[var(--palco-linha)] pt-6">
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
