"use client";

/**
 * Falha na raiz — o layout não montou, então não há tokens, fontes nem
 * componentes. Tudo aqui é autossuficiente de propósito.
 */
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
          background: "#fbfbfd",
          color: "#0b0e14",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: "#596273",
              margin: 0,
            }}
          >
            Falha na aplicação
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              lineHeight: 1.15,
              letterSpacing: "-0.026em",
              margin: "0.75rem 0 0",
            }}
          >
            O Prumo não conseguiu iniciar.
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "#596273",
              margin: "0.75rem 0 0",
            }}
          >
            A falha foi registrada. Recarregar costuma resolver.
          </p>

          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fbfbfd",
              background: "#0b0e14",
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
                color: "#596273",
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
