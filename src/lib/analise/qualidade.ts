import {
  ESPELHO_DA_ESCALA,
  ITENS_BIG_FIVE_POR_FATOR,
  ITEM_BIG_FIVE_POR_ID,
  TOTAL_DE_ITENS_BIG_FIVE,
  type FatorBigFive,
  type ItemBigFive,
} from "@/lib/instrument/bigfive";
import { FATORES_BIG_FIVE } from "@/lib/instrument/baterias";

/**
 * Controle de qualidade das respostas — §6.3 do manual.
 *
 * ─── O que esta camada é, e o que ela não é ────────────────────────────────
 * São três alertas INTERNOS, para o analista: respostas apressadas, padrão
 * uniforme e inconsistência entre itens espelhados. O manual fecha a seção com
 * a frase que governa este arquivo inteiro:
 *
 *   > Alertas NUNCA eliminam o candidato — apenas orientam o analista.
 *
 * Por isso nada aqui devolve "reprovado", "inválido" ou qualquer coisa que
 * outra parte do sistema possa ler como veredito. O que sai é uma lista de
 * observações com o número que as disparou, para ir à entrevista.
 *
 * E eles não vão para a ficha do candidato (§5.1) — a devolutiva não contém
 * alerta nenhum. Ver `devolutiva.ts`.
 *
 * ─── Por que é calculado na LEITURA, e não gravado no encerramento ─────────
 * Os três alertas moram na resposta BRUTA (o valor marcado item a item e o
 * tempo de cada tela), que é justamente o que o expurgo de retenção apaga
 * depois do prazo (`retencao.ts`), preservando só o consolidado.
 *
 * Isso tem uma consequência que precisa aparecer na tela em vez de virar
 * silêncio: passado o prazo, os alertas deixam de ser calculáveis. "Sem
 * alertas" e "não dá mais para saber" são coisas diferentes, e confundir as
 * duas seria afirmar qualidade que ninguém verificou. Daí o campo `avaliavel`.
 */

// ─── Limiares do §6.3 ──────────────────────────────────────────────────────

/** Tempo mediano por item abaixo do qual a resposta é "apressada" (§6.3). */
export const SEGUNDOS_MINIMOS_POR_ITEM = 2;

/** ≥ 90% das respostas do Big Five com o mesmo valor (§6.3). */
export const PROPORCAO_DE_PADRAO_UNIFORME = 0.9;

/**
 * Divergência mínima, em pontos da escala, para um par espelhado contar (§6.3).
 */
export const DIVERGENCIA_MINIMA_DO_PAR = 3;

/** Quantos pares espelhados divergentes disparam o alerta (§6.3: "2+"). */
export const PARES_DIVERGENTES_PARA_ALERTA = 2;

/**
 * Fração mínima de respostas com tempo registrado para a mediana valer.
 *
 * `elapsedMs` é anulável: uma prova retomada em outro aparelho, ou uma resposta
 * gravada por caminho que não passou pelo cronômetro, chega sem tempo. Calcular
 * a mediana de duas telas cronometradas em vinte produziria um alerta a partir
 * de 10% da evidência — e alerta é o que faz o analista desconfiar de uma
 * pessoa. Abaixo desta fração o alerta não é levantado nem negado: fica sem
 * medida, e isso é dito.
 */
export const COBERTURA_MINIMA_DE_TEMPO = 0.5;

// ─── Pares espelhados do Big Five ──────────────────────────────────────────

export type ParEspelhado = {
  fator: FatorBigFive;
  /** Item de pontuação direta. */
  direto: ItemBigFive;
  /** O gêmeo invertido, o `(R)` do manual. */
  reverso: ItemBigFive;
};

/**
 * Os pares que o §6.3 manda conferir — "(ex.: itens 2 × 17, 5 × 20)".
 *
 * A regra por trás dos dois exemplos: cada fator do Mini-IPIP tem o primeiro
 * item na forma direta e o último na forma invertida, e é esse par que mede a
 * mesma coisa por dois lados opostos. 2 (`Tenho empatia…`) × 17 (`Não me
 * interesso de verdade pelas outras pessoas`) e 5 (`Tenho uma imaginação
 * vívida`) × 20 (`Não tenho uma boa imaginação`) são exatamente isso.
 *
 * Derivado do banco em vez de escrito como `[[2,17],[5,20],…]`: a tabela do
 * §2.3 é a fonte, e uma lista de números soltos aqui sairia do ar em silêncio
 * no dia em que um item mudasse de forma.
 */
export const PARES_ESPELHADOS_BIG_FIVE: readonly ParEspelhado[] =
  FATORES_BIG_FIVE.map((fator) => {
    const itens = ITENS_BIG_FIVE_POR_FATOR[fator];
    const direto = itens.find((i) => !i.reverso);
    const reverso = [...itens].reverse().find((i) => i.reverso);
    return direto && reverso ? { fator, direto, reverso } : null;
  }).filter((p): p is ParEspelhado => p !== null);

/**
 * O quanto as duas respostas de um par espelhado se contradizem.
 *
 * ─── Cuidado com a leitura literal do manual ───────────────────────────────
 * O §6.3 diz "diferença ≥ 3 pontos (antes da inversão)". Lido ao pé da letra
 * como `|resposta_a − resposta_b|`, o alerta dispara em quem responde de forma
 * PERFEITAMENTE coerente: quem tem empatia marca 5 no item 2 e 1 no item 17
 * (discorda de "não me interesso"), e a diferença crua é 4. O critério
 * acusaria exatamente quem leu com atenção.
 *
 * O que "antes da inversão" quer dizer é de onde os números saem — das
 * respostas cruas, sem passar pela escoragem —, não que a inversão seja
 * ignorada. Um par espelhado é coerente quando as duas respostas somam o ponto
 * neutro dobrado (5 + 1 = 6); a contradição é o quanto essa soma se afasta de 6:
 *
 *     divergência = |resposta_direta + resposta_reversa − 6|
 *
 * Que é a mesma conta de comparar os dois valores JÁ invertidos — e é a única
 * das duas leituras que chama de inconsistente quem de fato se contradisse
 * (marcar 5 nos dois itens do par dá divergência 4).
 */
export function divergenciaDoPar(
  respostaDireta: number,
  respostaReversa: number,
): number {
  return Math.abs(respostaDireta + respostaReversa - ESPELHO_DA_ESCALA);
}

// ─── Entrada ───────────────────────────────────────────────────────────────

/**
 * A resposta bruta como ela sai do banco.
 *
 * Big Five vem de `ItemResponse` (valor Likert 1..5 + tempo) e DISC vem de
 * `ScenarioResponse` (o par MAIS/MENOS, do qual só o tempo interessa aqui: o
 * §6.3 não tem alerta de conteúdo para o DISC, porque escolha forçada não
 * permite nem linha reta nem par espelhado).
 */
export type RespostasBrutas = {
  bigFive?: Array<{ itemId: string; valor: number; tempoMs: number | null }>;
  disc?: Array<{ blocoId: string; tempoMs: number | null }>;
};

// ─── Saída ─────────────────────────────────────────────────────────────────

export type ChaveDeAlerta = "apressadas" | "uniforme" | "inconsistencia";

export type AlertaDeQualidade = {
  chave: ChaveDeAlerta;
  titulo: string;
  /** O número que disparou — alerta sem a medida vira acusação sem prova. */
  detalhe: string;
  /** A ação do §6.3. Nunca "descartar": os alertas não eliminam ninguém. */
  acao: string;
};

export type MedidasDeQualidade = {
  /** Mediana de segundos por item do Big Five. `null` = sem tempo suficiente. */
  segundosPorItemBigFive: number | null;
  /** Mediana de segundos por bloco do DISC. `null` = sem tempo suficiente. */
  segundosPorBlocoDisc: number | null;
  /** Maior fração de respostas do Big Five com o mesmo valor (0 a 1). */
  maiorProporcaoIgual: number | null;
  /** Pares espelhados com divergência ≥ 3. */
  paresDivergentes: number;
  /** Pares que puderam ser conferidos (os dois itens respondidos). */
  paresConferidos: number;
};

export type QualidadeDasRespostas = {
  /**
   * Havia resposta bruta para conferir?
   *
   * `false` não é "passou": é "não dá para saber" — prova expurgada pela
   * retenção, ou módulo que não guarda o dado. A tela precisa dizer isso.
   */
  avaliavel: boolean;
  alertas: AlertaDeQualidade[];
  medidas: MedidasDeQualidade;
};

// ─── Cálculo ───────────────────────────────────────────────────────────────

/** Mediana simples. Lista vazia devolve `null`, não 0 — 0 seria uma medida. */
function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenado = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenado.length / 2);
  return ordenado.length % 2 === 1
    ? ordenado[meio]
    : (ordenado[meio - 1] + ordenado[meio]) / 2;
}

/**
 * Mediana de segundos por tela, só quando há cronômetro em respostas
 * suficientes (ver `COBERTURA_MINIMA_DE_TEMPO`).
 */
function segundosPorTela(tempos: Array<number | null>): number | null {
  if (tempos.length === 0) return null;
  const medidos = tempos.filter((t): t is number => t != null && t >= 0);
  if (medidos.length / tempos.length < COBERTURA_MINIMA_DE_TEMPO) return null;
  const m = mediana(medidos);
  return m == null ? null : Math.round((m / 1000) * 10) / 10;
}

/**
 * Aplica os três alertas do §6.3 sobre a resposta bruta.
 *
 * Nunca lança: esta função roda no caminho de renderização de uma ficha que
 * precisa aparecer inteira mesmo quando a prova chegou torta. Dado que falta
 * vira medida `null`, e medida `null` não vira alerta.
 */
export function avaliarQualidade(
  respostas: RespostasBrutas,
): QualidadeDasRespostas {
  const bigFive = respostas.bigFive ?? [];
  const disc = respostas.disc ?? [];

  const segundosBigFive = segundosPorTela(bigFive.map((r) => r.tempoMs));
  const segundosDisc = segundosPorTela(disc.map((r) => r.tempoMs));

  // ─── Alerta 1: respostas apressadas ─────────────────────────────────────
  // O manual mede "por item no Big Five/DISC" — os dois entram, e basta um
  // deles ficar abaixo do piso. Um módulo respondido no automático contamina a
  // leitura do outro pela mesma pessoa.
  const apressados: string[] = [];
  if (segundosBigFive != null && segundosBigFive < SEGUNDOS_MINIMOS_POR_ITEM)
    apressados.push(`Big Five ${segundosBigFive}s por item`);
  if (segundosDisc != null && segundosDisc < SEGUNDOS_MINIMOS_POR_ITEM)
    apressados.push(`DISC ${segundosDisc}s por bloco`);

  // ─── Alerta 2: padrão uniforme (só Big Five) ────────────────────────────
  // O DISC fica de fora por construção: escolha forçada não deixa marcar o
  // mesmo valor vinte vezes.
  const contagem = new Map<number, number>();
  for (const r of bigFive) contagem.set(r.valor, (contagem.get(r.valor) ?? 0) + 1);
  const maiorContagem = Math.max(0, ...contagem.values());
  const maiorProporcaoIgual =
    bigFive.length > 0 ? maiorContagem / bigFive.length : null;

  // ─── Alerta 3: inconsistência entre pares espelhados (só Big Five) ──────
  const porItem = new Map(bigFive.map((r) => [r.itemId, r.valor]));
  let paresConferidos = 0;
  const divergentes: ParEspelhado[] = [];

  for (const par of PARES_ESPELHADOS_BIG_FIVE) {
    const direta = porItem.get(par.direto.id);
    const reversa = porItem.get(par.reverso.id);
    if (direta == null || reversa == null) continue;
    paresConferidos += 1;
    if (divergenciaDoPar(direta, reversa) >= DIVERGENCIA_MINIMA_DO_PAR)
      divergentes.push(par);
  }

  const alertas: AlertaDeQualidade[] = [];

  if (apressados.length > 0)
    alertas.push({
      chave: "apressadas",
      titulo: "Respostas apressadas",
      detalhe: `Tempo mediano abaixo de ${SEGUNDOS_MINIMOS_POR_ITEM}s por tela (${apressados.join(" · ")}).`,
      acao: "Ler o resultado com reserva e checar a coerência na entrevista.",
    });

  if (
    maiorProporcaoIgual != null &&
    bigFive.length > 0 &&
    maiorProporcaoIgual >= PROPORCAO_DE_PADRAO_UNIFORME
  )
    alertas.push({
      chave: "uniforme",
      titulo: "Padrão uniforme",
      detalhe: `${maiorContagem} das ${bigFive.length} respostas do Big Five têm o mesmo valor (${Math.round(maiorProporcaoIgual * 100)}%).`,
      acao: "Ler o resultado com reserva e checar a coerência na entrevista.",
    });

  if (divergentes.length >= PARES_DIVERGENTES_PARA_ALERTA)
    alertas.push({
      chave: "inconsistencia",
      titulo: "Inconsistência entre itens espelhados",
      detalhe: `${divergentes.length} pares com divergência de ${DIVERGENCIA_MINIMA_DO_PAR} pontos ou mais (itens ${divergentes
        .map((p) => `${p.direto.numero}×${p.reverso.numero}`)
        .join(", ")}).`,
      acao: "Ler o resultado com reserva e checar a coerência na entrevista.",
    });

  return {
    // Sem nenhuma resposta bruta não há o que conferir — e é diferente de
    // conferir e não achar nada.
    avaliavel: bigFive.length > 0 || disc.length > 0,
    alertas,
    medidas: {
      segundosPorItemBigFive: segundosBigFive,
      segundosPorBlocoDisc: segundosDisc,
      maiorProporcaoIgual,
      paresDivergentes: divergentes.length,
      paresConferidos,
    },
  };
}

// ─── O selo, quando os cinco fatores vêm do Big Five ───────────────────────

/**
 * O formato que o `SeloDeConfianca` consome. Repetido aqui como tipo estrutural
 * para a camada de análise não depender de um componente de tela.
 */
export type SeloDeConfianca = {
  selo: "alta" | "media" | "baixa";
  rotulo: string;
  emoji: string;
  sinais: string[];
  texto: string;
};

/**
 * O teto do selo derivado do Big Five.
 *
 * ─── Por que existe, e por que não chega a "alta" ──────────────────────────
 * Regra do §4.4 do produto, que não cai: o fit NUNCA aparece sozinho — vem
 * sempre com o selo ao lado, senão vira nota de aprovação. Só que o selo do
 * Prumo é calculado pelo `calcularConfianca`, que lê itens de desejabilidade
 * social, pares de consistência do banco e a convergência entre afirmações e
 * cenários. Nada disso existe no Mini-IPIP.
 *
 * Uma bateria só com Big Five produz os cinco fatores e, portanto, produz
 * aderência (`escoresParaFit`) — mas com `confidence` nulo. Deixar o número
 * aparecer sem selo quebraria a regra; carimbar "Alta" com três checagens onde
 * o Prumo faz cinco prometeria uma verificação que não houve.
 *
 * Então o selo do Big Five é montado a partir dos alertas do §6.3 e tem teto
 * MÉDIA. Zero alerta não vira "alta": vira "média, e aqui está o porquê".
 */
export const SELO_MAXIMO_DO_BIG_FIVE: SeloDeConfianca["selo"] = "media";

const TEXTO_DO_SELO_BIG_FIVE: Record<SeloDeConfianca["selo"], string> = {
  alta: "",
  media:
    "A aderência veio do Big Five (20 itens), não do Prumo. Os três controles de qualidade do manual não acusaram nada — mas são três, contra os cinco do Prumo, e por isso este selo não passa de média. Trate como pista e confirme na entrevista.",
  baixa:
    "O padrão de respostas do Big Five levantou sinal de atenção. Não elimina ninguém e não invalida a prova: significa ler o resultado com reserva e confirmar os pontos na entrevista.",
};

/** Nome legível de cada alerta, para o selo listar o que disparou. */
export const NOME_DO_ALERTA: Record<ChaveDeAlerta, string> = {
  apressadas: "tempo por tela abaixo do necessário para ler",
  uniforme: "quase todas as respostas com o mesmo valor",
  inconsistencia: "itens espelhados com respostas que se contradizem",
};

export function seloDoBigFive(
  qualidade: QualidadeDasRespostas,
): SeloDeConfianca {
  // Um alerta já derruba para baixa. O critério é mais duro que o do Prumo
  // (onde um sinal ainda dá "média") porque aqui o teto já é média: sem o
  // degrau de cima, o degrau de baixo é o único jeito de o selo se mexer.
  const selo: SeloDeConfianca["selo"] =
    qualidade.alertas.length === 0 ? SELO_MAXIMO_DO_BIG_FIVE : "baixa";

  return {
    selo,
    rotulo: selo === "media" ? "Média" : "Baixa",
    emoji: selo === "media" ? "🟡" : "🔴",
    sinais: qualidade.alertas.map((a) => a.chave),
    texto: qualidade.avaliavel
      ? TEXTO_DO_SELO_BIG_FIVE[selo]
      : "A aderência veio do Big Five (20 itens), não do Prumo. As respostas brutas já foram apagadas pelo prazo de retenção, então os controles de qualidade do manual não puderam ser conferidos.",
  };
}

/** Total de itens do Big Five — reexportado para quem monta a entrada. */
export { TOTAL_DE_ITENS_BIG_FIVE, ITEM_BIG_FIVE_POR_ID };
