"use client";

import { SIMBOLO_CANDIDATO, SIMBOLO_VAGA, SIMBOLO_VIEWBOX } from "@/components/marca-vetor";

/**
 * Falha na raiz — o layout não montou, então não há tokens, fontes nem
 * componentes. Tudo aqui é autossuficiente de propósito, e é a única tela do
 * produto onde as cores da marca aparecem como literal: `globals.css` não
 * carregou, então `var(--background)` não resolve nada.
 *
 * Os valores são os do tema claro (osso, tinta, laranja-sinal). Se a paleta
 * mudar, esta tela precisa mudar junto — é o preço de ser autossuficiente, e
 * é por isso que ela é curta.
 */

const OSSO = "#f6f4f1";
const TINTA = "#151515";
const CINZA = "#696560";
const LARANJA = "#ff5a1f";

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: OSSO,
          color: TINTA,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          {/* O símbolo desenhado à mão, e não `<Marca>`: importar o componente
              traria `next/link` e o `cn` para dentro de uma tela cuja única
              obrigação é funcionar quando nada mais funcionou. */}
          <svg
            viewBox={SIMBOLO_VIEWBOX}
            role="img"
            aria-label="Baliza"
            style={{ height: "1.5rem", width: "auto", display: "block" }}
          >
            <path d={SIMBOLO_CANDIDATO} fill={TINTA} fillRule="evenodd" />
            <path d={SIMBOLO_VAGA} fill={LARANJA} fillRule="evenodd" />
          </svg>

          <p
            style={{
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: CINZA,
              margin: "2rem 0 0",
            }}
          >
            Falha na aplicação
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              lineHeight: 1.15,
              letterSpacing: "-0.028em",
              fontWeight: 600,
              margin: "0.75rem 0 0",
            }}
          >
            A Baliza não conseguiu iniciar.
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: CINZA,
              margin: "0.75rem 0 0",
            }}
          >
            A falha foi registrada. Recarregar costuma resolver.
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              minHeight: "2.75rem",
              padding: "0 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              // Tinta sobre laranja (5,9:1). Branco sobre laranja daria 3,1:1.
              color: TINTA,
              background: LARANJA,
              border: "none",
              borderRadius: "0.625rem",
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.75rem",
                color: CINZA,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              código {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
