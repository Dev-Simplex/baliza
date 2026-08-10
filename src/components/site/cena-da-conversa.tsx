/**
 * A cena da conversa, em linha.
 *
 * ─── O que ela mostra, e o que ela deliberadamente NÃO mostra ─────────────
 * Duas poltronas frente a frente e uma mesa baixa entre elas — a composição da
 * referência, sem as pessoas. A ausência é escolha, não limitação disfarçada:
 * figura humana desenhada em SVG à mão vira boneco de apresentação corporativa,
 * que é exatamente o que a direção de arte recusa. As cadeiras vazias dizem
 * "conversa" com a mesma clareza e envelhecem melhor.
 *
 * ─── O fio ────────────────────────────────────────────────────────────────
 * Descendo do alto, entre as duas poltronas, um prumo. É o que amarra o nome do
 * produto à cena: o método (medir a referência) pairando sobre o resultado (a
 * conversa). Sem ele, seria uma ilustração de mobiliário; com ele, é a tese.
 *
 * ─── Sem componente de cliente ────────────────────────────────────────────
 * Nada aqui tem estado nem escuta evento. É SVG puro renderizado no servidor —
 * chega no primeiro byte do HTML, não custa JavaScript nenhum e aparece antes
 * de qualquer script. Numa página cujo trabalho é parecer calma, isso importa
 * mais que qualquer animação.
 */
export function CenaDaConversa({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 260"
      className={className}
      role="img"
      aria-label="Duas poltronas frente a frente com uma mesa baixa entre elas, e um prumo pendurado acima."
    >
      {/* ─── O prumo, descendo do alto ──────────────────────────────── */}
      <line x1="210" y1="0" x2="210" y2="96" className="tracado-fraco" />
      <path d="M204 96 h12 l-6 26 z" className="tracado-marca" />

      {/* ─── Poltrona da esquerda ───────────────────────────────────── */}
      <g className="tracado">
        {/* encosto */}
        <path d="M44 196 v-52 a26 26 0 0 1 26 -26 h34" />
        {/* braço externo */}
        <path d="M44 196 h72" />
        {/* assento */}
        <path d="M56 168 h58" />
        {/* braço da frente */}
        <path d="M56 168 v-14 a10 10 0 0 1 10 -10 h6" />
        {/* pés */}
        <path d="M52 196 v18" />
        <path d="M110 196 v18" />
      </g>

      {/* ─── Poltrona da direita (espelhada) ────────────────────────── */}
      <g className="tracado">
        <path d="M376 196 v-52 a26 26 0 0 0 -26 -26 h-34" />
        <path d="M376 196 h-72" />
        <path d="M364 168 h-58" />
        <path d="M364 168 v-14 a10 10 0 0 0 -10 -10 h-6" />
        <path d="M368 196 v18" />
        <path d="M310 196 v18" />
      </g>

      {/* ─── Mesa baixa ─────────────────────────────────────────────── */}
      <g className="tracado">
        <ellipse cx="210" cy="182" rx="52" ry="13" />
        <path d="M186 194 v20" />
        <path d="M234 194 v20" />
      </g>

      {/* Um caderno e um cartão sobre a mesa: os dois únicos objetos, e são o
          que a conversa produz. */}
      <g className="tracado-fraco">
        <rect x="190" y="174" width="22" height="8" rx="1.5" />
        <path d="M218 178 h14" />
      </g>

      {/* Chão: uma linha só, que apoia a cena sem desenhar ambiente. */}
      <line x1="20" y1="214" x2="400" y2="214" className="tracado-fraco" />
    </svg>
  );
}

/**
 * O diagrama do fit: um perfil, duas vagas, dois números.
 *
 * A largura de cada arco É o valor — não há barra decorativa ao lado de um
 * número. Quem olhar sem ler entende que um caminho é mais curto que o outro,
 * e é essa a leitura que a seção precisa entregar.
 */
export function DiagramaDeFit({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 200"
      className={className}
      role="img"
      aria-label="Um mesmo perfil ligado a duas vagas: 92 por cento para desenvolvedor, 61 por cento para comercial."
    >
      {/* O perfil, à esquerda */}
      <circle cx="46" cy="100" r="9" className="tracado-marca" />
      <text
        x="46"
        y="132"
        textAnchor="middle"
        className="palco-dado"
        style={{ fontSize: 9, letterSpacing: "0.14em", fill: "var(--palco-tinta-tenue)" }}
      >
        Perfil
      </text>

      {/* Caminho até a vaga A — longo, quase reto: o fit é alto. */}
      <path d="M60 96 C 150 60, 240 54, 330 52" className="tracado" />
      <circle cx="336" cy="52" r="5" className="tracado-marca" />

      {/* Caminho até a vaga B — mais curto e mais curvo: o fit é menor. */}
      <path d="M60 106 C 130 140, 190 156, 246 158" className="tracado-fraco" />
      <circle cx="252" cy="158" r="5" className="tracado-fraco" />
    </svg>
  );
}
