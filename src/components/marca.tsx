import Link from "next/link";

import {
  LOCKUP_LARANJA,
  LOCKUP_TINTA,
  LOCKUP_VIEWBOX,
  SIMBOLO_CANDIDATO,
  SIMBOLO_VAGA,
  SIMBOLO_VIEWBOX,
} from "@/components/marca-vetor";
import { cn } from "@/lib/utils";

/**
 * A marca.
 *
 * O símbolo é o conceito FIT desenhado: duas metades voltadas uma para a outra —
 * à esquerda o candidato, à direita a vaga — e entre elas um vazio que só existe
 * porque as duas estão em relação. Esse vazio é a aderência. Sozinha, nenhuma
 * das metades quer dizer coisa alguma; é a mesma tese do produto, que nunca
 * mostra um escore sem a vaga contra a qual ele foi lido.
 *
 * A metade do candidato usa `currentColor` e vira papel no tema escuro. A metade
 * da vaga é laranja-sinal em qualquer tema: é a única cor que a marca tem, e
 * marca que troca de cor conforme o fundo deixa de ser marca.
 *
 * Regra herdada do brand kit e que vale para todo uso: laranja-sinal identifica a
 * MARCA. Ele nunca significa "bom" nem "ruim" — quem codifica dado é o par
 * dentro/fora (`--dentro`, `--fora`), e os dois vivem longe daqui de propósito.
 */

const ALTURA_DO_LOCKUP = {
  sm: "h-4",
  md: "h-5",
  lg: "h-7",
} as const;

const ALTURA_DO_SIMBOLO = {
  sm: "h-4",
  md: "h-5",
  lg: "h-7",
} as const;

export type TamanhoDaMarca = keyof typeof ALTURA_DO_LOCKUP;

/**
 * O símbolo isolado — favicon, barra lateral recolhida, avatar do produto,
 * carregamento e telas onde o espaço horizontal é crítico.
 */
export function Simbolo({
  className,
  tamanho = "md",
}: {
  className?: string;
  tamanho?: TamanhoDaMarca;
}) {
  return (
    <svg
      viewBox={SIMBOLO_VIEWBOX}
      aria-hidden
      focusable="false"
      className={cn("w-auto shrink-0", ALTURA_DO_SIMBOLO[tamanho], className)}
    >
      <path d={SIMBOLO_CANDIDATO} fill="currentColor" fillRule="evenodd" />
      <path d={SIMBOLO_VAGA} fill="var(--marca)" fillRule="evenodd" />
    </svg>
  );
}

/**
 * O símbolo se encaixando — para splash e carregamento.
 *
 * As duas metades entram de fora e se aproximam até o vazio central ganhar
 * forma: é o FIT acontecendo, e não um logotipo girando. A animação é CSS puro
 * (nada de `motion` num arquivo que a barra lateral e o rodapé importam), dura
 * 700ms e não repete — ela conta uma coisa e para.
 *
 * `motion-reduce:animate-none` desliga as duas metades para quem pediu redução;
 * o símbolo aparece inteiro e parado, que é o estado final de qualquer jeito.
 */
export function SimboloEncaixando({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox={SIMBOLO_VIEWBOX}
      role="img"
      aria-label="Baliza — carregando"
      className={cn("h-10 w-auto shrink-0 text-foreground", className)}
    >
      <path
        d={SIMBOLO_CANDIDATO}
        fill="currentColor"
        fillRule="evenodd"
        className="origin-center animate-[baliza-encaixe-esquerda_700ms_cubic-bezier(0.32,0.72,0,1)_both] motion-reduce:animate-none"
      />
      <path
        d={SIMBOLO_VAGA}
        fill="var(--marca)"
        fillRule="evenodd"
        className="origin-center animate-[baliza-encaixe-direita_700ms_cubic-bezier(0.32,0.72,0,1)_both] motion-reduce:animate-none"
      />
    </svg>
  );
}

/**
 * O lockup horizontal — landing, contas, barra lateral no desktop, documentos.
 *
 * O wordmark é o vetor aprovado, e não um `<span>Baliza</span>` com a fonte da
 * interface: o desenho das letras é parte da marca e não sobrevive a uma troca de
 * fonte. O nome acessível vai no `aria-label`, porque para o leitor de tela o
 * traçado não existe.
 */
export function Lockup({
  className,
  tamanho = "md",
}: {
  className?: string;
  tamanho?: TamanhoDaMarca;
}) {
  return (
    <svg
      viewBox={LOCKUP_VIEWBOX}
      role="img"
      aria-label="Baliza"
      className={cn("w-auto shrink-0", ALTURA_DO_LOCKUP[tamanho], className)}
    >
      <path d={LOCKUP_TINTA} fill="currentColor" fillRule="evenodd" />
      <path d={LOCKUP_LARANJA} fill="var(--marca)" fillRule="evenodd" />
    </svg>
  );
}

/**
 * A marca como elemento de interface.
 *
 * `href = null` devolve a marca sem link — para cabeçalho de documento, onde
 * clicar não leva a lugar nenhum, e para dentro de outro link, onde aninhar
 * âncoras é HTML inválido.
 */
export function Marca({
  className,
  href = "/",
  tamanho = "md",
  variante = "lockup",
}: {
  className?: string;
  href?: string | null;
  tamanho?: TamanhoDaMarca;
  /** `simbolo` para espaços estreitos; `lockup` traz o nome junto. */
  variante?: "lockup" | "simbolo";
}) {
  const marca =
    variante === "simbolo" ? (
      <span className={cn("inline-flex text-foreground", className)}>
        <Simbolo tamanho={tamanho} />
        <span className="sr-only">Baliza</span>
      </span>
    ) : (
      <Lockup tamanho={tamanho} className={cn("text-foreground", className)} />
    );

  if (!href) return marca;

  return (
    <Link
      href={href}
      aria-label="Baliza — início"
      className="inline-flex rounded-sm transition-opacity hover:opacity-80"
    >
      {marca}
    </Link>
  );
}
