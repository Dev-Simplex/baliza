import path from "node:path";

import {
  Document,
  Font,
  Page,
  Path,
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import {
  LOCKUP_LARANJA,
  LOCKUP_TINTA,
  LOCKUP_VIEWBOX,
} from "@/components/marca-vetor";
import { FATORES, NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";
// Só tipo: nada de `lib/analise` entra no pacote deste arquivo. A estrutura é
// declarada uma vez e as duas representações do relatório comem dela — que é
// justamente o que impede a tela e o papel de divergirem.
import type { Diagnostico } from "@/lib/analise/diagnostico";
import type { BlocoDisc, FichaDeModulos } from "@/lib/analise/ficha";
import type { QualidadeDasRespostas } from "@/lib/analise/qualidade";

/**
 * O relatório em PDF, desenhado — não impresso.
 *
 * ─── Por que isto existe, depois de eu ter defendido o contrário ───────────
 * A primeira versão salvava em PDF pelo diálogo de impressão do navegador:
 * zero dependência nova e uma fonte de verdade só. O problema é que o diálogo
 * do navegador não SALVA, ele ABRE uma caixa de impressão — e carimba no papel
 * o que o navegador quer, não o que o documento quer: data no canto, título da
 * aba no topo, a URL inteira no rodapé e "1/3" ao lado. Nenhuma dessas quatro
 * coisas se desliga por CSS; são configuração do usuário, não do site.
 *
 * Um relatório que sai com `192.168.8.98:3300/candidatos/cms9a...` impresso no
 * pé não é documento, é captura de tela. Então o PDF passou a ser gerado no
 * servidor e devolvido como download.
 *
 * O custo é real e fica registrado: existem agora DUAS representações do
 * relatório, a da tela e esta. Quem mexer no cálculo precisa lembrar das duas.
 * O que reduz o risco é que ambas comem exatamente a mesma estrutura de dados
 * (`ContribuicaoDeFit`, `Escores`, o roteiro pronto) — nada é recalculado aqui,
 * este arquivo só desenha.
 *
 * `@react-pdf/renderer` e não Chromium headless: 2 MB de biblioteca contra
 * ~300 MB de navegador para subir a cada requisição.
 */

/* ─── Tipografia ────────────────────────────────────────────────────────────
   O PDF nascia inteiro em Helvetica, que é uma das 14 fontes que todo leitor
   de PDF já tem. Sai de graça — e sai igual a qualquer documento do mundo. O
   relatório é o único pedaço da Baliza que circula FORA do produto: vai por
   e-mail, é impresso, é lido por quem nunca abriu a ferramenta. Sair sem a
   cara do produto é desperdiçar a única peça que viaja sozinha.

   Agora ele usa a MESMA família da tela: Inter Tight em tudo. A Baliza não tem
   uma segunda fonte de display — a hierarquia sai de tamanho, peso e espaço, e
   uma família a menos são ~160 KB de TTF a menos embutidos em cada documento.

   Os arquivos estão VERSIONADOS em `fontes/`, e não buscados na hora. Duas
   razões: gerar relatório não pode depender de a Google estar no ar — o build
   já falhou uma vez hoje exatamente assim; e o arquivo tem que sair idêntico
   daqui a dois anos, quando a versão da fonte lá fora já tiver mudado. São
   ~1 MB de TTF sob licença aberta (OFL), que permite embutir.

   `process.cwd()` funciona porque o servidor roda da raiz do projeto. Se um
   dia virar `output: "standalone"`, estes arquivos precisam entrar na cópia. */
const PASTA_DE_FONTES = path.join(process.cwd(), "src/lib/pdf/fontes");
export const CORPO = "Inter Tight";
/** Mantido como nome próprio para o dia em que a marca ganhar um tipo de display. */
const DISPLAY = CORPO;

Font.register({
  family: CORPO,
  fonts: [
    { src: path.join(PASTA_DE_FONTES, "InterTight-Regular.ttf"), fontWeight: 400 },
    { src: path.join(PASTA_DE_FONTES, "InterTight-SemiBold.ttf"), fontWeight: 600 },
    // 700 fica registrado e sem uso de propósito: a escala da Baliza para em
    // 600, e deixar o peso disponível evita que alguém volte a introduzir uma
    // segunda família só para conseguir um título mais forte.
    { src: path.join(PASTA_DE_FONTES, "InterTight-Bold.ttf"), fontWeight: 700 },
  ],
});

/* Sem hifenização automática.

   A biblioteca quebra palavra no fim da linha usando um dicionário que é do
   INGLÊS. Em português ela corta em lugar que não existe — "comporta-mental",
   "entre-vista" — e num relatório que alguém vai imprimir e levar para uma
   conversa isso lê como erro de revisão. Devolver a palavra inteira desliga a
   quebra: prefiro uma linha com mais espaço do que uma palavra partida errado. */
Font.registerHyphenationCallback((palavra) => [palavra]);

/*
 * A base do papel — fontes, paleta e estilos — é exportada porque existe MAIS DE
 * UM documento.
 *
 * O relatório agregado (`agregado.tsx`) usa exatamente a mesma. Duplicar a
 * paleta faria os dois divergirem no primeiro ajuste de cor, e duplicar o
 * `Font.register` carregaria as fontes duas vezes — num servidor onde o teto de
 * memória é assunto, isso não é detalhe.
 *
 * Este arquivo é, de fato, a base. O nome não diz isso; a alternativa era um
 * terceiro arquivo só para mover constantes, e o custo disso é maior que o
 * ganho enquanto forem dois documentos.
 */

// As cores vêm dos mesmos valores do tema claro em `globals.css`. Repetidas
// como literal porque o PDF não tem CSS custom property para resolver.
export const COR = {
  tinta: "#151515",
  suave: "#55524d",
  linha: "#d8d4ce",
  linhaClara: "#f2f0ed",
  papel: "#ffffff",
  // Laranja-sinal um degrau mais escuro: em jato de tinta o #FF5A1F satura e o
  // traço fino da marca some dentro do próprio borrão.
  marca: "#a8380c",
  marcaForte: "#e04a12",
  marcaSuave: "#fdf0e9",
  dentro: "#26685a",
  dentroSuave: "#e4f0ed",
  fora: "#954f36",
  foraSuave: "#f4e7e1",
} as const;

/**
 * As cinco cores de fator, em papel.
 *
 * Espelham `--chart-1..5` do tema claro, um degrau mais escuras. Elas moram
 * AQUI, e não em `components/app/graficos`, porque lá elas são
 * `var(--chart-N)` — e uma custom property do CSS não existe dentro de um PDF:
 * os cinco pontos do radar saíam pretos, silenciosamente.
 */
const COR_DO_FATOR_IMPRESSA: Record<Fator, string> = {
  C: "#e04a12",
  E: "#8f8b84",
  X: "#26685a",
  A: "#954f36",
  O: "#55524d",
};

export const e = StyleSheet.create({
  pagina: {
    paddingTop: 42,
    paddingBottom: 84,
    paddingHorizontal: 42,
    fontSize: 9,
    color: COR.tinta,
    backgroundColor: COR.papel,
    fontFamily: CORPO,
  },

  // ─── Cabeçalho ───────────────────────────────────────────────────────────
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  marca: { flexDirection: "row", alignItems: "center", gap: 5 },
  etiqueta: {
    fontSize: 6.5,
    letterSpacing: 1.1,
    color: COR.suave,
    fontFamily: CORPO,
    textTransform: "uppercase",
  },
  // Display nos três lugares em que o documento se apresenta: a marca, o nome
  // de quem é o relatório e o número que resume tudo. O resto é leitura.
  nome: { fontSize: 17, fontFamily: DISPLAY, fontWeight: 600, letterSpacing: -0.4 },
  vaga: { fontSize: 9, color: COR.suave, marginTop: 1 },
  aderencia: { fontSize: 24, fontFamily: DISPLAY, fontWeight: 600, color: COR.marca, letterSpacing: -0.5 },

  selo: {
    marginTop: 4,
    alignSelf: "flex-end",
    borderWidth: 0.7,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 6.5,
  },

  regua: { height: 0.7, backgroundColor: COR.linha, marginVertical: 14 },

  // ─── Blocos ──────────────────────────────────────────────────────────────
  cartao: {
    borderWidth: 0.7,
    borderColor: COR.linha,
    borderRadius: 6,
    padding: 13,
    marginBottom: 11,
  },
  titulo: { fontSize: 10, fontFamily: CORPO, fontWeight: 600, marginBottom: 3 },
  legenda: { fontSize: 8, color: COR.suave, lineHeight: 1.45 },
  corpo: { fontSize: 9, lineHeight: 1.5 },

  // O cabeçalho corrido mora DENTRO do padding do topo; o rodapé, dentro do
  // de baixo. Por isso `paddingTop`/`paddingBottom` da página são generosos:
  // é o espaço que o fluxo não pode invadir, senão o texto passa por cima.
  corrido: {
    position: "absolute",
    top: 20,
    left: 42,
    right: 42,
    fontSize: 7,
    color: COR.suave,
  },

  rodape: {
    position: "absolute",
    bottom: 30,
    left: 42,
    right: 42,
    borderTopWidth: 0.7,
    borderTopColor: COR.linha,
    paddingTop: 7,
  },

  numeroDaPagina: {
    position: "absolute",
    bottom: 30,
    right: 42,
    fontSize: 6.5,
    letterSpacing: 1.1,
    color: COR.suave,
  },
});

/**
 * A marca no papel — o lockup horizontal, vetorial.
 *
 * São os mesmos paths de `components/marca-vetor`, que saem do SVG aprovado.
 * O wordmark NÃO é redesenhado com `<Text>`: o traçado das letras é parte da
 * marca e não sobrevive a uma troca de fonte, e este documento circula fora do
 * produto — é a única peça que viaja sozinha.
 */
export function MarcaNoPapel() {
  return (
    <Svg width={60} height={14} viewBox={LOCKUP_VIEWBOX}>
      <Path d={LOCKUP_TINTA} fill={COR.tinta} fillRule="evenodd" />
      <Path d={LOCKUP_LARANJA} fill={COR.marcaForte} fillRule="evenodd" />
    </Svg>
  );
}

export type DadosDoRelatorio = {
  candidato: string;
  email: string;
  empresa: string;
  vaga: string;
  respondidoEm: string | null;
  duracao: string | null;
  aderencia: string | null;
  resumoDoGap: string;
  /**
   * A síntese de contratação — a mesma da tela, montada por `analise/diagnostico`.
   *
   * Opcional porque o PDF é gerado de mais de um lugar e nenhum deles pode
   * quebrar por causa de um campo novo. Ausente, o relatório sai como sempre
   * saiu: sem a página do diagnóstico e sem buraco no lugar dela.
   */
  diagnostico?: Diagnostico | null;
  selo: { nivel: "alta" | "media" | "baixa"; rotulo: string; texto: string } | null;
  /**
   * Os cinco fatores — `null` quando a bateria não os produz.
   *
   * Antes era obrigatório porque o PDF só existia para o Mapeamento Baliza. Uma vaga que
   * aplique só DISC e SJT tem relatório (as fichas do §5.2 do manual) e não tem
   * radar: o gráfico some, e nada é desenhado com zero no lugar do que não foi
   * medido.
   */
  escores: Record<Fator, number> | null;
  faixas: Array<{
    fator: string;
    nome: string;
    escore: number;
    faixa: [number, number];
    peso: number;
    tipo: "maior_melhor" | "faixa_otima" | "menor_melhor" | "irrelevante";
    dentro: boolean;
  }>;
  puxaramPraCima: Array<{ nome: string; escore: number }>;
  puxaramPraBaixo: Array<{ nome: string; escore: number }>;
  perguntas: Array<{ pergunta: string; motivo: string }>;
  arquetipo: { nome: string; frase: string; brilha: string; trava: string } | null;
  facetas: Array<{ texto: string }>;
  faixasQualitativas: Array<{ nome: string; rotulo: string }>;
  /**
   * Os módulos do manual (Big Five, DISC, SJT) que a bateria aplicou.
   *
   * Ausente na vaga que só usa o Mapeamento Baliza — e é o que mantém o PDF dela idêntico
   * ao de sempre, sem uma linha a mais no papel.
   */
  modulos?: FichaDeModulos | null;
  qualidade?: QualidadeDasRespostas | null;
  /**
   * Nomes dos testes aplicados.
   *
   * Só é desenhado quando NÃO há aderência: aí a folha precisa dizer o que foi
   * aplicado e por que não há número, senão ela circula parecendo um relatório
   * ao qual faltou alguma coisa. Com aderência, a bateria é redundante — as
   * faixas e o radar já mostram de onde o número veio.
   */
  bateria?: string[];

  /**
   * O parecer já registrado, quando existe.
   *
   * `decisao` vem como o RÓTULO ("Avançar"/"Dúvida"/"Não avançar") e não como o
   * valor do banco: este arquivo desenha, não traduz. Quem lê do banco é a rota,
   * que é o único lugar onde o vocabulário do domínio precisa ser conhecido.
   */
  parecer?: {
    decisao: string;
    nota: string | null;
    por: string | null;
    em: string | null;
  } | null;
};

/**
 * Junta perguntas VIZINHAS que compartilham a mesma justificativa.
 *
 * Vizinhas, e não todas as iguais: a ordem do roteiro é deliberada (§6.1 manda
 * o SJT primeiro), e reagrupar por conteúdo a embaralharia. `primeiro` guarda o
 * índice original, que é o número impresso ao lado da pergunta — sem ele a
 * numeração recomeçaria a cada grupo.
 */
function agruparPorMotivo(perguntas: DadosDoRelatorio["perguntas"]) {
  const grupos: Array<{
    primeiro: number;
    itens: DadosDoRelatorio["perguntas"];
  }> = [];

  perguntas.forEach((p, i) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.itens[0].motivo === p.motivo) ultimo.itens.push(p);
    else grupos.push({ primeiro: i, itens: [p] });
  });

  return grupos;
}

const ROTULO_DO_TIPO: Record<DadosDoRelatorio["faixas"][number]["tipo"], string> = {
  maior_melhor: "quanto mais, melhor",
  faixa_otima: "faixa ótima — penaliza os dois lados",
  menor_melhor: "quanto menos, melhor",
  irrelevante: "não pesa nesta vaga",
};

// Espelha `ESTILO` de `components/app/selo-de-confianca`: média é NEUTRA. A cor
// da marca não codifica qualidade de dado — nem na tela, nem no papel.
const ESTILO_DO_SELO = {
  alta: { borderColor: COR.dentro, backgroundColor: COR.dentroSuave, color: COR.dentro },
  media: { borderColor: COR.linha, backgroundColor: COR.linhaClara, color: COR.tinta },
  baixa: { borderColor: COR.fora, backgroundColor: COR.foraSuave, color: COR.fora },
} as const;

/**
 * A Faixa — o elemento-assinatura do produto, redesenhado para o papel.
 *
 * A conta é a mesma de `components/faixa.tsx`: trilho de 0 a 100, a faixa alvo
 * pintada por cima, o marcador na posição do escore, e — quando ele cai FORA —
 * o trecho entre a borda da faixa e o marcador desenhado em argila. É esse
 * trecho que mostra o desvio que está custando pontos, e é a razão de o
 * gráfico existir em vez de um número solto.
 */
function FaixaDoPdf({ d }: { d: DadosDoRelatorio["faixas"][number] }) {
  const L = 460; // largura do trilho em pontos
  const [lo, hi] = d.faixa;
  const irrelevante = d.tipo === "irrelevante" || d.peso === 0;

  const px = (v: number) => (Math.max(0, Math.min(100, v)) / 100) * L;
  const borda = d.escore < lo ? lo : hi;
  const desvioX = px(Math.min(d.escore, borda));
  const desvioW = Math.abs(px(d.escore) - px(borda));

  const cor = irrelevante ? COR.suave : d.dentro ? COR.dentro : COR.fora;
  const marcador = px(d.escore);

  return (
    <View style={{ marginBottom: 11, opacity: irrelevante ? 0.55 : 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}>
          <Text style={e.etiqueta}>{d.fator}</Text>
          <Text style={{ fontSize: 9, fontFamily: CORPO, fontWeight: 600 }}>{d.nome}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={e.etiqueta}>{irrelevante ? "peso 0" : `peso ${d.peso}`}</Text>
          <Text style={{ fontSize: 11, fontFamily: CORPO, fontWeight: 600, color: cor }}>
            {Math.round(d.escore)}
          </Text>
        </View>
      </View>

      <Svg width={L} height={12} viewBox={`0 0 ${L} 12`} style={{ marginTop: 4 }}>
        {/* trilho */}
        <Rect x={0} y={4} width={L} height={4} rx={2} fill={COR.linhaClara} />
        {/* marcas de 10 em 10: dão escala sem precisar de números */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((t) => (
          <Rect key={t} x={px(t)} y={4} width={0.5} height={4} fill={COR.linha} />
        ))}
        {/* a faixa alvo */}
        {!irrelevante && (
          <>
            <Rect
              x={px(lo)}
              y={2}
              width={px(hi) - px(lo)}
              height={8}
              rx={1}
              fill={COR.dentro}
              fillOpacity={0.16}
            />
            <Rect x={px(lo)} y={2} width={0.8} height={8} fill={COR.dentro} />
            <Rect x={px(hi) - 0.8} y={2} width={0.8} height={8} fill={COR.dentro} />
          </>
        )}
        {/* o desvio, quando existe */}
        {!irrelevante && !d.dentro && desvioW > 0.5 && (
          <Rect
            x={desvioX}
            y={4}
            width={desvioW}
            height={4}
            rx={2}
            fill={COR.fora}
          />
        )}
        {/* O marcador da pessoa: agulha fina e cabeça redonda, o mesmo desenho
            da tela. A agulha é o que dá precisão — um losango solto deixa
            dúvida sobre qual ponto exatamente ele marca. */}
        <Rect
          x={marcador - 0.6}
          y={0.5}
          width={1.2}
          height={11}
          rx={0.6}
          fill={irrelevante ? COR.suave : COR.marcaForte}
        />
        <Rect
          x={marcador - 2}
          y={4}
          width={4}
          height={4}
          rx={2}
          fill={irrelevante ? COR.suave : COR.marcaForte}
        />
      </Svg>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
        <Text style={e.etiqueta}>{ROTULO_DO_TIPO[d.tipo]}</Text>
        {!irrelevante && (
          <Text style={e.etiqueta}>
            alvo {lo}–{hi}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * O radar, desenhado a mão em SVG.
 *
 * Recharts não roda aqui — ele desenha no DOM. Como são só cinco eixos e um
 * polígono, calcular os pontos custa menos que arrastar uma segunda biblioteca
 * de gráfico para dentro do gerador de PDF.
 */
function Radar({ escores }: { escores: Record<Fator, number> }) {
  const T = 210;
  const c = T / 2;
  // O raio deixa margem para os rótulos: radar sem nome de eixo é um pentágono
  // bonito que não informa nada, e foi assim que a primeira versão saiu.
  const raio = 58;

  const pos = (i: number, r: number) => {
    const ang = (Math.PI * 2 * i) / FATORES.length - Math.PI / 2;
    return [c + r * Math.cos(ang), c + r * Math.sin(ang)] as const;
  };
  const ponto = (i: number, valor: number) =>
    pos(i, (Math.max(0, Math.min(100, valor)) / 100) * raio);

  const anel = (frac: number) =>
    FATORES.map((_, i) => {
      const [x, y] = ponto(i, frac * 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  const forma = FATORES.map((f, i) => {
    const [x, y] = ponto(i, escores[f] ?? 0);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <Svg width={T} height={T} viewBox={`0 0 ${T} ${T}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <Polygon key={f} points={anel(f)} fill="none" stroke={COR.linha} strokeWidth={0.6} />
      ))}

      {FATORES.map((_, i) => {
        const [x, y] = ponto(i, 100);
        return (
          <Path
            key={`eixo-${i}`}
            d={`M${c},${c} L${x.toFixed(1)},${y.toFixed(1)}`}
            stroke={COR.linha}
            strokeWidth={0.6}
          />
        );
      })}

      <Polygon
        points={forma}
        fill={COR.marcaForte}
        fillOpacity={0.22}
        stroke={COR.marcaForte}
        strokeWidth={1.6}
      />

      {FATORES.map((f, i) => {
        const [x, y] = ponto(i, escores[f] ?? 0);
        return (
          <Rect
            key={`p-${f}`}
            x={x - 2}
            y={y - 2}
            width={4}
            height={4}
            rx={2}
            fill={COR_DO_FATOR_IMPRESSA[f]}
          />
        );
      })}

      {/* Os rótulos. `textAnchor` conforme o lado: à direita do eixo da direita,
          à esquerda do da esquerda, centralizado em cima e embaixo — senão o
          nome cruza por cima da própria teia. */}
      {FATORES.map((f, i) => {
        const [x, y] = pos(i, raio + 16);
        const dx = x - c;
        const ancora = Math.abs(dx) < 6 ? "middle" : dx > 0 ? "start" : "end";
        return (
          <Text
            key={`r-${f}`}
            x={x}
            y={y + 2.5}
            style={{ fontSize: 6.5, fill: COR.suave }}
            textAnchor={ancora}
          >
            {NOMES_DE_FATOR[f].curto}
          </Text>
        );
      })}

      {FATORES.map((f, i) => {
        const [x, y] = pos(i, raio + 16);
        const dx = x - c;
        const ancora = Math.abs(dx) < 6 ? "middle" : dx > 0 ? "start" : "end";
        return (
          <Text
            key={`v-${f}`}
            x={x}
            y={y + 10}
            style={{ fontSize: 7, fill: COR.tinta, fontFamily: CORPO, fontWeight: 600 }}
            textAnchor={ancora}
          >
            {Math.round(escores[f] ?? 0)}
          </Text>
        );
      })}
    </Svg>
  );
}

/**
 * Barra 0–100 dos módulos do manual.
 *
 * Deliberadamente mais simples que a `FaixaDoPdf`: ali há uma faixa alvo e um
 * desvio para desenhar, porque o número é comparado à vaga. Aqui não há
 * comparação nenhuma — Big Five e DISC descrevem, não medem aderência —, e uma
 * barra com faixa alvo sugeriria um alvo que não existe.
 */
function BarraDoModulo({ valor, largura = 150 }: { valor: number; largura?: number }) {
  const v = Math.max(0, Math.min(100, valor));
  return (
    <Svg width={largura} height={4} viewBox={`0 0 ${largura} 4`}>
      <Rect x={0} y={0} width={largura} height={4} rx={2} fill={COR.linhaClara} />
      <Rect
        x={0}
        y={0}
        width={(v / 100) * largura}
        height={4}
        rx={2}
        fill={COR.marcaForte}
        fillOpacity={0.7}
      />
    </Svg>
  );
}

/** Linha "rótulo ─── barra ─── número", o tijolo das fichas do §5.2. */
function LinhaDeModulo({
  rotulo,
  score,
  nota,
  destaque,
}: {
  rotulo: string;
  score: number;
  nota?: string;
  destaque?: boolean;
}) {
  return (
    <View style={{ marginBottom: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Text style={e.corpo}>{rotulo}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          {nota && <Text style={e.etiqueta}>{nota}</Text>}
          <Text
            style={{
              fontSize: 10,
              fontFamily: CORPO, fontWeight: 600,
              color: destaque ? COR.fora : COR.tinta,
            }}
          >
            {score}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 2 }}>
        <BarraDoModulo valor={score} largura={460} />
      </View>
    </View>
  );
}

/**
 * As fichas dos módulos do manual, desenhadas para o papel (§5.2).
 *
 * Ordem: SJT primeiro. É o teste com maior peso na decisão (§6.1) e o único com
 * gabarito — e a abertura por competência é a informação que o §4.5 manda não
 * deixar o score geral esconder.
 */
function ModulosDoManual({
  modulos,
  qualidade,
  emPaginaNova,
}: {
  modulos: FichaDeModulos;
  qualidade?: QualidadeDasRespostas | null;
  /**
   * Falso quando não houve página de aderência: aí as fichas são o relatório,
   * e quebrar a folha antes delas abriria uma página quase em branco.
   */
  emPaginaNova: boolean;
}) {
  return (
    /* Quebra CONDICIONAL, não incondicional.

       Era `break`, que quebra sempre. A intenção estava certa — esta seção não
       deve começar com dois centímetros de folha sobrando — mas o efeito foi o
       oposto do pretendido: o roteiro de entrevista terminava logo no topo de
       uma página, o `break` empurrava tudo para a SEGUINTE, e sobrava uma folha
       com uma pergunta e 95% de papel em branco. O relatório saía com 5 páginas
       onde cabiam 4, e quem imprime paga por essa folha.

       `minPresenceAhead` diz a mesma coisa de um jeito que se defende sozinho:
       "só comece aqui se houver ao menos 260pt de folha" — cerca de um terço de
       uma A4. Sobrando menos que isso, quebra; sobrando mais, preenche. */
    <View minPresenceAhead={emPaginaNova ? 260 : 0}>
      <Text style={[e.etiqueta, { marginBottom: 9 }]}>
        Outros testes desta bateria
      </Text>

      {modulos.sjt && (
        <View style={e.cartao}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flexShrink: 1, paddingRight: 12 }}>
              <Text style={e.titulo}>Julgamento situacional (SJT)</Text>
              <Text style={e.legenda}>{modulos.sjt.faixa.leitura}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={e.aderencia}>{modulos.sjt.score}</Text>
              <Text style={e.etiqueta}>
                {modulos.sjt.pontosObtidos} de {modulos.sjt.pontosMaximos} pontos
              </Text>
            </View>
          </View>

          {/* A abertura por competência não é detalhamento opcional: o score
              geral esconde o zero (§4.5). */}
          <Text style={[e.etiqueta, { marginTop: 11, marginBottom: 5 }]}>
            Por competência
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {modulos.sjt.competencias.map((c) => (
              <View
                key={c.rotulo}
                style={{
                  width: "50%",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingRight: 14,
                  paddingVertical: 2,
                }}
              >
                <Text style={[e.corpo, c.atencao ? { color: COR.fora } : {}]}>
                  {c.curto}
                  {c.atencao ? "  !" : ""}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: CORPO, fontWeight: 600,
                    color: c.atencao ? COR.fora : COR.tinta,
                  }}
                >
                  {c.score}
                </Text>
              </View>
            ))}
          </View>

          {/* Cor de atenção, não de reprovação — e a ressalva junto.
              O papel é o que circula fora de contexto: ele é encaminhado por
              e-mail, impresso e lido meses depois por quem nunca falou com o
              candidato. Se existe um lugar onde uma escolha ruim num caso
              escrito pode virar impressão de caráter, é este. */}
          {modulos.sjt.piores.length > 0 && (
            <View
              style={{
                marginTop: 11,
                borderWidth: 0.7,
                borderColor: COR.marca,
                backgroundColor: COR.marcaSuave,
                borderRadius: 4,
                padding: 8,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: CORPO, fontWeight: 600, color: COR.marca }}>
                Escolheu a alternativa mais fraca em{" "}
                {modulos.sjt.piores.length === 1
                  ? "1 cenário"
                  : `${modulos.sjt.piores.length} cenários`}
              </Text>
              {modulos.sjt.piores.map((p) => (
                <Text key={p.titulo} style={[e.corpo, { marginTop: 3 }]}>
                  “{p.titulo}” — {p.competencia}
                </Text>
              ))}
              <Text style={[e.legenda, { marginTop: 5 }]}>
                <Text style={{ fontWeight: 600 }}>Quer dizer: </Text>
                vale perguntar sobre uma situação parecida na entrevista — já
                está no roteiro, mesmo com score alto.
              </Text>
              <Text style={[e.legenda, { marginTop: 3 }]}>
                <Text style={{ fontWeight: 600 }}>Não quer dizer: </Text>
                não é erro de caráter e não reprova ninguém. O teste mede uma
                escolha num caso escrito, sem contexto e sem as pessoas
                envolvidas. Peça um exemplo real antes de concluir.
              </Text>
              <Text style={[e.legenda, { marginTop: 3 }]}>
                Na conversa, descreva a situação com suas palavras: não cite o
                cenário do teste.
              </Text>
            </View>
          )}
        </View>
      )}

      {modulos.bigFive && (
        <View style={e.cartao}>
          <Text style={e.titulo}>Big Five (Mini-IPIP)</Text>
          <Text style={[e.legenda, { marginBottom: 9 }]}>
            Não existe perfil bom ou ruim: a leitura é sempre em relação à vaga.
          </Text>
          {modulos.bigFive.notas.map((n) => (
            <LinhaDeModulo
              key={n.chave}
              rotulo={n.rotulo}
              score={n.score}
              nota={n.faixa.rotulo}
            />
          ))}
        </View>
      )}

      {modulos.disc && (
        <CartaoDiscDoPdf bloco={modulos.disc} titulo="DISC — estilo de trabalho" />
      )}

      {modulos.perfilComportamental && (
        <CartaoDiscDoPdf
          bloco={modulos.perfilComportamental}
          titulo="Inventário de Perfil Comportamental"
        />
      )}

      {qualidade && (
        <View style={e.cartao} wrap={false}>
          <Text style={e.titulo}>Qualidade das respostas</Text>
          {!qualidade.avaliavel ? (
            <Text style={e.corpo}>
              Não foi possível conferir: as respostas brutas já foram apagadas
              pelo prazo de retenção. Isso não quer dizer “sem alertas”.
            </Text>
          ) : qualidade.alertas.length === 0 ? (
            <Text style={e.corpo}>
              Sem alertas. Nenhum dos três controles do manual (tempo por tela,
              padrão uniforme e itens espelhados) acusou nada.
            </Text>
          ) : (
            qualidade.alertas.map((a) => (
              <View key={a.chave} style={{ marginTop: 4 }}>
                <Text
                  style={{ fontSize: 8, fontFamily: CORPO, fontWeight: 600, color: COR.fora }}
                >
                  {a.titulo}
                </Text>
                <Text style={e.corpo}>{a.detalhe}</Text>
                <Text style={e.legenda}>{a.acao}</Text>
              </View>
            ))
          )}
          <Text style={[e.legenda, { marginTop: 7 }]}>
            Alertas nunca eliminam candidato — orientam o analista sobre o
            quanto confiar no resultado.
          </Text>
        </View>
      )}

    </View>
  );
}

/**
 * O parecer, no papel.
 *
 * Ficava DENTRO do bloco dos modulos do manual, o que tinha uma consequencia
 * que so aparece olhando dois relatorios lado a lado: bateria sem modulo — a
 * vaga que aplica so o Mapeamento Baliza — imprimia sem caixa de parecer nenhuma. Quem
 * levava essa folha para a entrevista nao tinha onde anotar a decisao, e
 * agora que o parecer e um registro de verdade tambem nao teria onde LE-LO.
 * Fora do bloco, ele fecha todo relatorio.
 */
function ParecerNoPapel({ parecer }: { parecer: DadosDoRelatorio["parecer"] }) {
  /* O parecer do §5.2.

     Nasceu sempre em branco — três quadradinhos para preencher à caneta —
     porque o sistema não tinha onde guardar decisão nenhuma. Agora tem, e o
     papel passa a refletir o que está gravado: havendo parecer, ele sai
     MARCADO, com autoria, data e as anotações da conversa.

     A caixa vazia continua existindo para quem ainda não decidiu — é o caso de
     quem imprime ANTES da entrevista, que é o uso original: a folha vai para a
     mesa e volta escrita à mão. */
  return (
    <View style={e.cartao} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={e.titulo}>Parecer do analista</Text>
        {parecer && (
          <Text style={e.etiqueta}>
            {[parecer.por, parecer.em].filter(Boolean).join(" · ")}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 22, marginTop: 6 }}>
        {(["Avançar", "Dúvida", "Não avançar"] as const).map((opcao) => {
          const marcado = parecer?.decisao === opcao;
          return (
            <View
              key={opcao}
              style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              {/* O marcado é um disco cheio, e não um "x": impresso em preto e
                  branco, ou numa cópia de cópia, o preenchimento sobrevive e
                  o traço fino some. */}
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderWidth: 0.7,
                  borderColor: marcado ? COR.marca : COR.suave,
                  borderRadius: 4,
                  backgroundColor: marcado ? COR.marca : undefined,
                }}
              />
              <Text
                style={
                  marcado
                    ? [e.corpo, { fontFamily: CORPO, fontWeight: 600 }]
                    : e.corpo
                }
              >
                {opcao}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[e.etiqueta, { marginTop: 11 }]}>Anotações</Text>

      {parecer?.nota ? (
        <Text style={[e.corpo, { marginTop: 5 }]}>{parecer.nota}</Text>
      ) : (
        [0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              marginTop: 13,
              borderBottomWidth: 0.7,
              borderBottomColor: COR.linha,
            }}
          />
        ))
      )}
      <Text style={[e.legenda, { marginTop: 9 }]}>
        A decisão é humana e vem depois da entrevista. Nenhum destes testes
        aprova ou reprova alguém sozinho.
      </Text>
    </View>
  );
}

/**
 * O diagnóstico no papel.
 *
 * É a primeira coisa depois da identificação, pela mesma razão que na tela: o
 * PDF é justamente o que atravessa a mesa da entrevista, e quem o lê muitas
 * vezes não é quem rodou o processo. Sem `wrap={false}`: se a lista crescer, é
 * melhor quebrar de página do que espremer.
 */
function DiagnosticoDoPdf({ d }: { d: Diagnostico }) {
  return (
    <View style={e.cartao}>
      <Text style={e.titulo}>Diagnóstico</Text>
      <Text style={[e.corpo, { marginTop: 2 }]}>{d.leitura}</Text>

      {(d.forcas.length > 0 || d.riscos.length > 0) && (
        <View
          style={{
            flexDirection: "row",
            gap: 20,
            marginTop: 11,
            borderTopWidth: 0.7,
            borderTopColor: COR.linhaClara,
            paddingTop: 9,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[e.etiqueta, { color: COR.dentro }]}>
              O que sustenta
            </Text>
            {d.forcas.map((item, i) => (
              <View key={i} style={{ marginTop: 6 }}>
                <Text style={[e.corpo, { fontWeight: 600 }]}>{item.titulo}</Text>
                <Text style={e.legenda}>{item.evidencia}</Text>
                <Text style={[e.legenda, { marginTop: 1.5 }]}>
                  {item.consequencia}
                </Text>
              </View>
            ))}
            {d.forcas.length === 0 && (
              <Text style={[e.legenda, { marginTop: 6 }]}>
                Nenhuma dimensão com peso nesta vaga ficou dentro da faixa.
              </Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[e.etiqueta, { color: COR.fora }]}>
              O que precisa ser confirmado
            </Text>
            {d.riscos.map((item, i) => (
              <View key={i} style={{ marginTop: 6 }}>
                <Text style={[e.corpo, { fontWeight: 600 }]}>
                  {item.titulo}
                  {item.obrigatorio ? " — levar à entrevista" : ""}
                </Text>
                <Text style={e.legenda}>{item.evidencia}</Text>
                <Text style={[e.legenda, { marginTop: 1.5 }]}>
                  {item.consequencia}
                </Text>
              </View>
            ))}
            {d.riscos.length === 0 && (
              <Text style={[e.legenda, { marginTop: 6 }]}>
                Nenhuma dimensão fora da faixa e nenhum alerta de módulo.
              </Text>
            )}
            {d.riscos.length > 0 && (
              <Text style={[e.legenda, { marginTop: 7 }]}>
                Nada aqui reprova ninguém: escore baixo descreve tendência, não
                impedimento. Esta coluna é a pauta da entrevista.
              </Text>
            )}
          </View>
        </View>
      )}

      {d.comoTrabalhar.length > 0 && (
        <View
          style={{
            marginTop: 11,
            borderTopWidth: 0.7,
            borderTopColor: COR.linhaClara,
            paddingTop: 9,
          }}
        >
          <Text style={e.etiqueta}>Como trabalhar com essa pessoa</Text>
          {d.comoTrabalhar.map((linha, i) => (
            <Text key={i} style={[e.legenda, { marginTop: 3 }]}>
              • {linha}
            </Text>
          ))}
        </View>
      )}

      <Text style={[e.legenda, { marginTop: 9 }]}>
        Isto é leitura de evidência, não recomendação de contratação: o
        instrumento descreve tendência, e quem decide é o parecer registrado no
        fim deste relatório.
      </Text>
    </View>
  );
}

export function RelatorioPdf({ d }: { d: DadosDoRelatorio }) {
  return (
    <Document
      title={`Mapeamento comportamental — ${d.candidato}`}
      author="Baliza"
      subject={`${d.vaga} · ${d.empresa}`}
      creator="Baliza"
    >
      <Page size="A4" style={e.pagina}>
        {/* Cabeçalho corrido, da página 2 em diante. */}
        <Text
          fixed
          style={e.corrido}
          render={({ pageNumber }) =>
            pageNumber > 1 ? `${d.candidato} · ${d.vaga} · ${d.empresa}` : ""
          }
        />

        {/* ─── Identificação ────────────────────────────────────────────── */}
        <View style={e.topo}>
          <View>
            <View style={e.marca}>
              <MarcaNoPapel />
            </View>
            <Text style={[e.etiqueta, { marginTop: 5 }]}>
              Mapeamento comportamental
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={e.legenda}>{d.empresa}</Text>
            <Text style={e.legenda}>
              {d.respondidoEm ? `Respondido em ${d.respondidoEm}` : "Em andamento"}
              {d.duracao ? ` · ${d.duracao}` : ""}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 16,
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text style={e.nome}>{d.candidato}</Text>
            <Text style={e.vaga}>
              {d.vaga}
              {d.email ? ` · ${d.email}` : ""}
            </Text>
          </View>

          {d.aderencia && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={e.etiqueta}>Aderência</Text>
              <Text style={e.aderencia}>{d.aderencia}</Text>
              {d.selo && (
                <Text style={[e.selo, ESTILO_DO_SELO[d.selo.nivel]]}>
                  Confiança {d.selo.rotulo.toLowerCase()}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* O fit NUNCA aparece sozinho (§4.4): o texto do selo vem colado. */}
        {d.selo && <Text style={[e.legenda, { marginTop: 9 }]}>{d.selo.texto}</Text>}

        <View style={e.regua} />

        {/* A síntese antes da conta, como na tela. */}
        {d.diagnostico && <DiagnosticoDoPdf d={d.diagnostico} />}

        {/* Sem aderência, o lugar de dizer isso é aqui em cima — antes de
            qualquer número, e não numa nota de rodapé que ninguém lê. Zero não
            aparece em lugar nenhum: o que não foi medido é dito por extenso. */}
        {!d.aderencia && !d.escores && (
          <View style={e.cartao}>
            <Text style={e.titulo}>O que esta pessoa respondeu</Text>
            {(d.bateria ?? []).map((teste) => (
              <Text key={teste} style={[e.corpo, { marginTop: 2 }]}>
                • {teste}
              </Text>
            ))}
            <Text style={[e.legenda, { marginTop: 7 }]}>{d.resumoDoGap}</Text>
            <Text style={[e.legenda, { marginTop: 4 }]}>
              Não é aderência zero: é aderência não medida. Para ter o número, a
              vaga precisa aplicar o Mapeamento Baliza ou o Big Five.
            </Text>
          </View>
        )}

        {/* ─── Página 1: a conta ────────────────────────────────────────── */}
        {/* Bateria sem os cinco fatores não tem conta para mostrar. O cartão
            inteiro sai, em vez de sair uma moldura vazia com uma frase dentro —
            o relatório dela são as fichas dos módulos, mais adiante. */}
        {(d.faixas.length > 0 || d.escores) && (
        <View style={e.cartao}>
          <Text style={e.titulo}>
            {d.aderencia ? `Por que a aderência é ${d.aderencia}` : "Perfil por dimensão"}
          </Text>
          <Text style={[e.legenda, { marginBottom: 11 }]}>{d.resumoDoGap}</Text>

          {d.faixas.map((f) => (
            <FaixaDoPdf key={f.fator} d={f} />
          ))}

          {(d.puxaramPraCima.length > 0 || d.puxaramPraBaixo.length > 0) && (
            <View
              style={{
                flexDirection: "row",
                gap: 24,
                marginTop: 4,
                borderTopWidth: 0.7,
                borderTopColor: COR.linhaClara,
                paddingTop: 9,
              }}
            >
              {d.puxaramPraCima.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={[e.etiqueta, { color: COR.dentro }]}>
                    Puxaram pra cima
                  </Text>
                  {d.puxaramPraCima.map((c) => (
                    <Text key={c.nome} style={[e.corpo, { marginTop: 2 }]}>
                      {c.nome} {Math.round(c.escore)}
                    </Text>
                  ))}
                </View>
              )}
              {d.puxaramPraBaixo.length > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={[e.etiqueta, { color: COR.fora }]}>
                    Puxaram pra baixo
                  </Text>
                  {d.puxaramPraBaixo.map((c) => (
                    <Text key={c.nome} style={[e.corpo, { marginTop: 2 }]}>
                      {c.nome} {Math.round(c.escore)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        )}

        {/* A leitura qualitativa fecha a página 1: são cinco linhas curtas, e
            é o resumo que alguém lê antes de virar a folha. */}
        {d.faixasQualitativas.length > 0 && (
        <View style={e.cartao}>
          <Text style={e.titulo}>Leitura por dimensão</Text>
          <View style={{ marginTop: 5 }}>
            {d.faixasQualitativas.map((f) => (
              <View
                key={f.nome}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 2.5,
                }}
              >
                <Text style={e.corpo}>{f.nome}</Text>
                <Text style={e.etiqueta}>{f.rotulo}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* ─── Quem é, e o que perguntar ─────────────────────────────────── */}
        {/* Mesma troca da seção dos módulos, e pelo mesmo motivo — só que aqui
            eu só enxerguei o efeito DEPOIS de trocar a outra.

            Com as fontes novas o cartão "Leitura por dimensão" deixou de caber
            na primeira folha por alguns pontos e escorregou para a segunda.
            O `break` daqui então empurrava o radar para a TERCEIRA, e a segunda
            ficava com um cartão de cinco linhas e 80% de papel em branco: a
            folha vazia não sumiu, mudou de lugar. Quebra incondicional é assim
            — ela não pergunta quanto sobrou, e cada vez que o conteúdo acima
            muda de tamanho ela reabre o buraco em outro ponto.

            Com `minPresenceAhead` a regra passa a ser sobre o espaço, não sobre
            a posição: começa aqui se couber um terço de folha, senão vira. */}
        <View minPresenceAhead={d.escores ? 260 : 0}>
          {d.escores && (
          <View style={[e.cartao, { flexDirection: "row", gap: 18 }]} wrap={false}>
            <View style={{ width: 210 }}>
              <Text style={e.titulo}>Perfil comportamental</Text>
              <Radar escores={d.escores} />
            </View>

            <View style={{ flex: 1, justifyContent: "center" }}>
              {d.arquetipo ? (
                <View>
                  <Text style={e.etiqueta}>Arquétipo</Text>
                  <Text
                    style={{ fontSize: 13, fontFamily: CORPO, fontWeight: 600, marginTop: 2 }}
                  >
                    {d.arquetipo.nome}
                  </Text>
                  <Text style={[e.legenda, { marginTop: 2 }]}>{d.arquetipo.frase}</Text>
                  <Text style={[e.etiqueta, { marginTop: 9 }]}>Brilha em</Text>
                  <Text style={e.legenda}>{d.arquetipo.brilha}</Text>
                  <Text style={[e.etiqueta, { marginTop: 6 }]}>Trava em</Text>
                  <Text style={e.legenda}>{d.arquetipo.trava}</Text>
                  <Text style={[e.legenda, { marginTop: 9, fontSize: 7 }]}>
                    Arquétipo é camada de leitura: não entra no ranking, no fit nem
                    em nenhum filtro.
                  </Text>
                </View>
              ) : (
                <Text style={e.legenda}>
                  Cada eixo é uma dimensão, de 0 a 100. A forma diz onde a pessoa
                  se apoia — nunca se ela serve, que é a conta da página anterior.
                </Text>
              )}
            </View>
          </View>
          )}

          {d.perguntas.length > 0 && (
            <View style={e.cartao}>
              <Text style={e.titulo}>Roteiro de entrevista</Text>
              <Text style={[e.legenda, { marginBottom: 9 }]}>
                Perguntas comportamentais — a pessoa conta um fato que aconteceu.
                Cada uma sonda um ponto específico deste perfil.
              </Text>
              {/* O motivo repetido não se repete no papel.

                  O roteiro monta duas perguntas por dimensão fraca, e as duas
                  carregam a MESMA justificativa, palavra por palavra:
                  "Cooperação ficou em 50, abaixo do piso de 65 que esta vaga
                  pede." aparecia duas vezes seguidas, e "Escolheu a pior
                  alternativa…" três. Num relatório de entrevista isso lê como
                  texto de encher — e o leitor começa a pular o que está em
                  cinza, que é justamente onde mora o porquê de cada pergunta.

                  Some só quando é IDÊNTICA à anterior. É supressão de
                  apresentação: o dado que vem do roteiro não muda, e a tela
                  segue mostrando cada pergunta com a sua.

                  As que dividem motivo viram um BLOCO indivisível, e não itens
                  soltos com o texto escondido. A diferença aparece na quebra de
                  página: solto, o grupo podia partir e a pergunta de baixo
                  começava a folha seguinte sem porquê nenhum — pior do que a
                  repetição que eu estava removendo. */}
              {agruparPorMotivo(d.perguntas).map((grupo) => (
                <View key={grupo.primeiro} wrap={false}>
                  {grupo.itens.map((p, j) => (
                    <View
                      key={j}
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        marginBottom: j === grupo.itens.length - 1 ? 9 : 4,
                      }}
                    >
                      <Text style={{ fontSize: 8, color: COR.marca, width: 10 }}>
                        {grupo.primeiro + j + 1}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={e.corpo}>{p.pergunta}</Text>
                        {j === 0 && (
                          <Text style={[e.legenda, { marginTop: 2 }]}>
                            {p.motivo}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {d.facetas.length > 0 && (
            <View style={e.cartao}>
              <Text style={e.titulo}>Nuances dentro de cada dimensão</Text>
              {d.facetas.map((f, i) => (
                <Text key={i} style={[e.corpo, { marginTop: 3 }]}>
                  • {f.texto}
                </Text>
              ))}
              <Text style={[e.legenda, { marginTop: 7 }]}>
                Faceta tem poucos itens na prova: ela é leitura qualitativa e nunca
                vira número, gráfico ou critério de ranking.
              </Text>
            </View>
          )}
        </View>

        {/* ─── As fichas dos módulos do manual (§5.2) ───────────────────── */}
        {d.modulos?.temAlgum && (
          <ModulosDoManual
            modulos={d.modulos}
            qualidade={d.qualidade}
            emPaginaNova={Boolean(d.escores)}
          />
        )}

        {/* ─── O parecer fecha o documento, sempre ──────────────────────── */}
        <ParecerNoPapel parecer={d.parecer ?? null} />

        {/* ─── Rodapé, em toda página ───────────────────────────────────── */}
        <View style={e.rodape} fixed>
          <Text style={e.legenda}>
            Documento gerado pela Baliza. Contém dado pessoal de candidato: trate como
            confidencial e compartilhe apenas com quem participa deste processo
            seletivo.
          </Text>
          <Text style={[e.legenda, { marginTop: 2 }]}>
            O resultado é insumo para a entrevista, não decisão. Nenhuma dimensão
            aqui elimina candidato por si só.
          </Text>
        </View>

        <Text
          fixed
          style={e.numeroDaPagina}
          render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
        />
      </Page>
    </Document>
  );
}

/**
 * O cartão de D/I/S/C do PDF, usado por DOIS instrumentos.
 *
 * O DISC de 25 telas e o Inventário de Perfil Comportamental produzem a mesma
 * `BlocoDisc` (quatro dimensões, perfil, fortes, atenção), então o desenho é um
 * só e só o título muda. Duplicar o bloco faria a próxima correção de layout
 * pegar um dos dois e esquecer o outro.
 */
function CartaoDiscDoPdf({
  bloco,
  titulo,
}: {
  bloco: BlocoDisc;
  titulo: string;
}) {
  return (
    <View style={e.cartao} wrap={false}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Text style={e.titulo}>{titulo}</Text>
        <Text style={{ fontSize: 12, fontFamily: CORPO, fontWeight: 600 }}>
          {bloco.rotulo}
        </Text>
      </View>
      <Text style={[e.legenda, { marginBottom: 9 }]}>{bloco.resumo}</Text>

      {bloco.dimensoes.map((dim) => (
        <LinhaDeModulo
          key={dim.dimensao}
          rotulo={`${dim.dimensao} · ${dim.nome}`}
          score={dim.score}
        />
      ))}

      <View
        style={{
          flexDirection: "row",
          gap: 24,
          marginTop: 5,
          borderTopWidth: 0.7,
          borderTopColor: COR.linhaClara,
          paddingTop: 9,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[e.etiqueta, { color: COR.dentro }]}>
            Pontos fortes típicos
          </Text>
          <Text style={[e.corpo, { marginTop: 2 }]}>
            {bloco.fortes.join(" · ")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[e.etiqueta, { color: COR.fora }]}>
            Pontos de atenção típicos
          </Text>
          <Text style={[e.corpo, { marginTop: 2 }]}>
            {bloco.atencao.join(" · ")}
          </Text>
        </View>
      </View>

      <Text style={[e.legenda, { marginTop: 7 }]}>
        Descreve estilo, não competência nem caráter — serve para prever como a
        pessoa tende a trabalhar, nunca como nota.
      </Text>
    </View>
  );
}
