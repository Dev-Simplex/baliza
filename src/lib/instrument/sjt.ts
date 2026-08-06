import type {
  CompetenciaSjt as CompetenciaSjtDeModulo,
  ResultadoSjt as ResultadoSjtDeModulo,
} from "./baterias";
import { criarAleatorio, embaralhar } from "./form";

/**
 * BATERIA 3 — Julgamento Situacional (SJT). Manual §4.
 *
 * ─── O que este arquivo é ───────────────────────────────────────────────────
 * Banco dos 8 cenários com gabarito, as equações do §4.4 (score geral e score
 * por competência) e a montagem da forma. Sem tela, sem persistência.
 *
 * ─── Divisão com `baterias.ts` ──────────────────────────────────────────────
 * Lá está o contrato (o enum dos testes e a forma enxuta do resultado gravado);
 * aqui, o motor. A saída rica se chama `ApuracaoSjt` e
 * `paraResultadoDeModuloSjt` reduz ao `ResultadoSjt` que é persistido — que,
 * repare, também não carrega gabarito: guarda pontos e competência, nunca qual
 * alternativa era a certa.
 *
 * ─── A regra que manda neste arquivo ────────────────────────────────────────
 * O SJT é o único dos três testes COM GABARITO (§4.1). Por isso o §4.2 é
 * categórico: o gabarito e a competência nunca são exibidos ao candidato — NEM
 * DEPOIS DE RESPONDER. O motivo é econômico, não moral: cenário divulgado é
 * cenário queimado, e reconstruir um banco de 8 cenários calibrados custa muito
 * mais que a devolutiva vale. A §5.1 fecha o cerco: a ficha do candidato não
 * mostra nem o score do SJT.
 *
 * A defesa aqui é estrutural, em três camadas:
 *
 *   1. `CenarioSjtParaCandidato` não TEM campo de pontos nem de competência —
 *      é o compilador barrando o vazamento, não a disciplina de quem escreve;
 *   2. `cenariosParaCandidatoSjt` é o único caminho de saída dos cenários;
 *   3. os ids das alternativas não seguem a ordem didática do banco (ver
 *      `PERMUTACAO_DE_IDS`), então nem o id sozinho entrega a pontuação.
 *
 * ─── Base legal ─────────────────────────────────────────────────────────────
 * O SJT é de construção interna (§1, regra 6).
 */

// ─── Competências (§4.3) ───────────────────────────────────────────────────

/**
 * Chaves das competências. O nome é `Chave…` porque `CompetenciaSjt` já existe
 * em `baterias.ts` querendo dizer outra coisa (a NOTA de uma competência).
 */
export type ChaveDeCompetenciaSjt =
  | "foco_no_cliente"
  | "responsabilidade"
  | "organizacao"
  | "trabalho_em_equipe"
  | "integridade"
  | "adaptabilidade"
  | "comunicacao"
  | "proatividade";

/**
 * `rotulo` é o nome cheio do §4.3; `curto` é o que cabe na ficha do analista
 * (§5.2: "Organização", "Equipe", "Adaptação").
 */
export const COMPETENCIAS_SJT: Record<
  ChaveDeCompetenciaSjt,
  { rotulo: string; curto: string }
> = {
  foco_no_cliente: { rotulo: "Foco no cliente", curto: "Foco no cliente" },
  responsabilidade: { rotulo: "Responsabilidade", curto: "Responsabilidade" },
  organizacao: { rotulo: "Organização e priorização", curto: "Organização" },
  trabalho_em_equipe: { rotulo: "Trabalho em equipe", curto: "Equipe" },
  integridade: { rotulo: "Integridade", curto: "Integridade" },
  adaptabilidade: { rotulo: "Adaptabilidade", curto: "Adaptação" },
  comunicacao: { rotulo: "Comunicação", curto: "Comunicação" },
  proatividade: { rotulo: "Proatividade", curto: "Proatividade" },
};

/** Texto exato da instrução ao candidato (§4.2). Não parafrasear. */
export const INSTRUCAO_SJT =
  "A seguir você verá situações comuns de trabalho. Para cada uma, escolha a " +
  "alternativa que descreve o que você realmente faria — não o que acha que " +
  "gostaríamos de ouvir. Escolha apenas uma alternativa por situação.";

// ─── Regras de montagem do banco (§4.2) ────────────────────────────────────

export type PontosSjt = 0 | 1 | 2;

/**
 * Todo cenário tem exatamente 4 alternativas: uma de 2 pontos (melhor ação),
 * duas de 1 (aceitáveis) e uma de 0 (pior ação).
 *
 * A distribuição não é decorativa. Com uma única alternativa boa e uma única
 * ruim, o score separa quem escolhe o ótimo de quem escolhe o aceitável, e o
 * zero fica isolado o bastante para virar o gatilho de entrevista do §4.6.
 */
export const DISTRIBUICAO_DE_PONTOS_SJT: readonly PontosSjt[] = [
  2, 1, 1, 0,
] as const;

export const ALTERNATIVAS_POR_CENARIO_SJT = DISTRIBUICAO_DE_PONTOS_SJT.length; // 4

/** Pontos da melhor alternativa — o "2" que multiplica em `pontos_maximos`. */
export const PONTOS_DA_MELHOR_SJT: PontosSjt = 2;

/** §4.2: aplicar 8 cenários por processo, mínimo 6, máximo 10. */
export const CENARIOS_POR_PROCESSO_SJT = 8;
export const MINIMO_DE_CENARIOS_SJT = 6;
export const MAXIMO_DE_CENARIOS_SJT = 10;

// ─── Banco de cenários (§4.3) ──────────────────────────────────────────────

export type AlternativaSjt = {
  id: string;
  texto: string;
  /** GABARITO. Uso interno absoluto — ver o cabeçalho deste arquivo. */
  pontos: PontosSjt;
};

export type CenarioSjt = {
  id: string;
  /** Número na tabela do §4.3 — permite conferir cenário a cenário. */
  numero: number;
  /** Aparece só na ficha do ANALISTA (§5.2), nunca para o candidato. */
  titulo: string;
  /** USO INTERNO (§4.2). */
  competencia: ChaveDeCompetenciaSjt;
  situacao: string;
  /** Sempre 4, em ordem DIDÁTICA no banco (2, 1, 1, 0) — nunca na tela. */
  alternativas: AlternativaSjt[];
};

/**
 * Letras dos ids, uma permutação por cenário.
 *
 * No banco as alternativas ficam em ordem didática (§4.3: da melhor para a
 * pior), que é o que torna a conferência contra o manual possível. Se os ids
 * seguissem essa mesma ordem — `a`, `b`, `c`, `d` — a última letra seria SEMPRE
 * a alternativa de 0 ponto, e o id que trafega até o navegador entregaria o
 * gabarito de graça.
 *
 * Aqui cada cenário recebe uma permutação diferente, então nenhuma letra
 * corresponde à mesma pontuação de um cenário para o outro. Estas permutações
 * são CONGELADAS: mexer nelas troca os ids das alternativas e invalida as
 * respostas já gravadas.
 */
const PERMUTACAO_DE_IDS: Array<[string, string, string, string]> = [
  ["c", "a", "d", "b"], // cenário 1
  ["b", "d", "c", "a"], // cenário 2
  ["d", "b", "a", "c"], // cenário 3
  ["a", "c", "b", "d"], // cenário 4
  ["c", "b", "d", "a"], // cenário 5
  ["d", "a", "c", "b"], // cenário 6
  ["b", "c", "a", "d"], // cenário 7
  ["a", "d", "b", "c"], // cenário 8
];

type EntradaDoBanco = {
  titulo: string;
  competencia: ChaveDeCompetenciaSjt;
  situacao: string;
  /** Na ordem didática do §4.3: [2], [1], [1], [0]. */
  alternativas: [string, string, string, string];
};

const TABELA_DO_MANUAL: EntradaDoBanco[] = [
  {
    titulo: "Cliente insatisfeito",
    competencia: "foco_no_cliente",
    situacao:
      "Um cliente liga irritado dizendo que o serviço combinado não foi entregue no prazo. O atraso foi causado por outro setor. O que você faz?",
    alternativas: [
      "Escuto, peço desculpas em nome da empresa, resolvo o que estiver ao meu alcance e depois alinho internamente com o outro setor.",
      "Anoto os detalhes da reclamação e garanto que alguém com mais autonomia retornará ainda hoje.",
      "Ofereço imediatamente uma compensação para acalmar o cliente e encerro a ligação.",
      "Explico que o atraso não foi culpa do meu setor e transfiro a ligação para o responsável.",
    ],
  },
  {
    titulo: "Erro próprio",
    competencia: "responsabilidade",
    situacao:
      "Você percebe que cometeu um erro em um trabalho já entregue ao seu gestor. Ninguém notou ainda, e corrigir vai expor a falha. O que você faz?",
    alternativas: [
      "Aviso o gestor imediatamente, explico o erro e já apresento a correção ou um plano para corrigir.",
      "Corrijo discretamente e aviso o gestor apenas se o erro tiver gerado alguma consequência.",
      "Peço orientação a um colega experiente sobre a melhor forma de reportar antes de falar com o gestor.",
      "Não falo nada — se ninguém notou, provavelmente não era importante.",
    ],
  },
  {
    titulo: "Prazo impossível",
    competencia: "organizacao",
    situacao:
      "Você está com três entregas para esta semana e seu gestor acaba de passar uma quarta tarefa urgente. Não há tempo para tudo. O que você faz?",
    alternativas: [
      "Apresento ao gestor a lista do que tenho, com prazos, e alinho com ele o que priorizar ou renegociar.",
      "Faço primeiro a nova tarefa urgente e aviso os envolvidos nas outras entregas que podem atrasar.",
      "Peço ajuda a um colega com folga na agenda para dividir as entregas.",
      "Aceito tudo sem comentar e trabalho até onde der — o que não der, fica.",
    ],
  },
  {
    titulo: "Conflito com colega",
    competencia: "trabalho_em_equipe",
    situacao:
      "Um colega criticou seu trabalho em uma reunião, na frente de todos, de forma que você achou injusta. O que você faz?",
    alternativas: [
      "Depois da reunião, converso em particular com ele, entendo o ponto e explico o meu, buscando um acordo de como tratar divergências.",
      "Respondo na hora, com calma, apresentando os fatos que sustentam meu trabalho.",
      "Deixo passar e sigo o trabalho, evitando desgaste — mas fico mais atento às interações com ele.",
      "Passo a criticar o trabalho dele nas próximas oportunidades, para que sinta o mesmo.",
    ],
  },
  {
    titulo: "Dilema ético",
    competencia: "integridade",
    situacao:
      'Seu gestor pede para você informar a um cliente que uma entrega está "quase pronta", mas você sabe que ela mal começou. O que você faz?',
    alternativas: [
      "Digo ao gestor que não me sinto confortável em passar uma informação falsa e proponho comunicar um novo prazo realista ao cliente.",
      "Peço ao gestor que ele mesmo faça essa comunicação, já que a orientação partiu dele.",
      "Comunico o cliente com uma mensagem vaga, sem confirmar nem negar o estágio da entrega, e busco acelerar o trabalho.",
      "Repasso a informação como o gestor pediu — a responsabilidade é dele.",
    ],
  },
  {
    titulo: "Mudança de escopo",
    competencia: "adaptabilidade",
    situacao:
      "Você passou duas semanas em um projeto e a direção decidiu mudar o rumo: metade do que você fez será descartada. O que você faz?",
    alternativas: [
      "Busco entender o motivo da mudança, identifico o que do trabalho feito pode ser aproveitado e replanejo com foco no novo objetivo.",
      "Aceito a decisão e recomeço pelo novo escopo imediatamente, sem questionar.",
      "Exponho meu desacordo com dados sobre o custo do descarte, mas sigo a decisão final.",
      "Continuo tocando partes do escopo antigo por conta própria, pois acredito que vão voltar atrás.",
    ],
  },
  {
    titulo: "Instrução ambígua",
    competencia: "comunicacao",
    situacao:
      "Você recebe por mensagem uma tarefa cujo objetivo pode ser interpretado de duas formas bem diferentes. O gestor está em reuniões o dia todo. O que você faz?",
    alternativas: [
      "Mando uma mensagem curta descrevendo as duas interpretações e qual pretendo seguir se ele não responder até determinada hora — e começo pelo que é comum às duas.",
      "Escolho a interpretação mais provável e começo, validando com o gestor assim que ele sair da reunião.",
      "Pergunto a colegas que já fizeram tarefas parecidas qual interpretação costuma ser a certa.",
      "Espero o gestor responder para começar — sem certeza, melhor não fazer nada.",
    ],
  },
  {
    titulo: "Melhoria de processo",
    competencia: "proatividade",
    situacao:
      'Você percebe que uma etapa do processo do seu setor gera retrabalho toda semana, mas "sempre foi assim" e ninguém reclama. O que você faz?',
    alternativas: [
      "Documento o problema com exemplos e números, penso em uma proposta de melhoria e apresento ao gestor.",
      "Comento o problema com o gestor na próxima conversa, sem proposta estruturada, para ver se há interesse.",
      "Ajusto meu próprio jeito de trabalhar para sofrer menos com o retrabalho, sem mexer no processo dos outros.",
      "Não mexo — se ninguém reclama, não é problema meu.",
    ],
  },
];

export const CENARIOS_SJT: readonly CenarioSjt[] = TABELA_DO_MANUAL.map(
  (entrada, indice) => {
    const numero = indice + 1;
    const cenarioId = `sjt-c${String(numero).padStart(2, "0")}`;
    const letras = PERMUTACAO_DE_IDS[indice];

    return {
      id: cenarioId,
      numero,
      titulo: entrada.titulo,
      competencia: entrada.competencia,
      situacao: entrada.situacao,
      alternativas: entrada.alternativas.map((texto, posicao) => ({
        id: `${cenarioId}-${letras[posicao]}`,
        texto,
        pontos: DISTRIBUICAO_DE_PONTOS_SJT[posicao],
      })),
    };
  },
);

export const CENARIO_SJT_POR_ID = new Map<string, CenarioSjt>(
  CENARIOS_SJT.map((c) => [c.id, c]),
);

// ─── Forma: quais cenários, em que ordem, com que ordem de alternativas ─────

export type FormaSjt = {
  semente: string;
  /** Ids dos cenários aplicados, na ordem de apresentação. */
  cenarios: string[];
  /** Id do cenário → ids das 4 alternativas, na ordem de apresentação. */
  alternativas: Record<string, string[]>;
};

/**
 * O que sai para o candidato. Repare no que NÃO existe neste tipo: `pontos`,
 * `competencia` e `titulo`.
 *
 * Os dois primeiros são a regra do §4.2. O título fica de fora por outro
 * motivo: "Dilema ético" ou "Conflito com colega" ANUNCIAM o tema antes da
 * leitura e induzem a resposta socialmente desejável — que é exatamente o que a
 * instrução do §4.2 pede para evitar ("não o que acha que gostaríamos de
 * ouvir"). O título continua no resultado, porque a ficha do analista cita o
 * cenário pelo nome (§5.2).
 */
export type CenarioSjtParaCandidato = {
  id: string;
  situacao: string;
  alternativas: Array<{ id: string; texto: string }>;
};

/**
 * Monta a prova desta pessoa: seleção dos cenários, ordem de apresentação e
 * ordem das 4 alternativas dentro de cada cenário (§4.2).
 *
 * Embaralhar as alternativas é obrigatório e não é detalhe: no banco elas estão
 * em ordem didática (a de 2 pontos primeiro), então ordem fixa faria "marcar
 * sempre a primeira" render 100.
 *
 * `quantidade` respeita a faixa do §4.2 (6 a 10) e é limitada pelo tamanho do
 * banco. Aplicar menos que 8 tem um custo que precisa ser consciente: neste
 * banco há UM cenário por competência, então cada cenário retirado apaga uma
 * competência inteira da abertura do §4.5.
 *
 * Seleção e ordem usam sementes derivadas diferentes de propósito — se
 * compartilhassem o gerador, o cenário sorteado primeiro tenderia a aparecer
 * primeiro na tela também.
 */
export function montarFormaSjt(
  semente: string,
  quantidade: number = CENARIOS_POR_PROCESSO_SJT,
): FormaSjt {
  const teto = Math.min(MAXIMO_DE_CENARIOS_SJT, CENARIOS_SJT.length);
  const quantos = Math.min(
    teto,
    Math.max(MINIMO_DE_CENARIOS_SJT, Math.floor(quantidade)),
  );

  const selecionados = embaralhar(
    CENARIOS_SJT.map((c) => c.id),
    criarAleatorio(`${semente}:sjt:selecao`),
  ).slice(0, quantos);

  const cenarios = embaralhar(
    selecionados,
    criarAleatorio(`${semente}:sjt:ordem`),
  );

  const alternativas: Record<string, string[]> = {};
  for (const cenarioId of cenarios) {
    const cenario = CENARIO_SJT_POR_ID.get(cenarioId);
    if (!cenario) continue;
    alternativas[cenarioId] = embaralhar(
      cenario.alternativas.map((a) => a.id),
      criarAleatorio(`${semente}:sjt:alternativas:${cenarioId}`),
    );
  }

  return { semente, cenarios, alternativas };
}

/** Único caminho de saída dos cenários para o candidato. Ver o cabeçalho. */
export function cenariosParaCandidatoSjt(
  forma: FormaSjt,
): CenarioSjtParaCandidato[] {
  return forma.cenarios
    .map((cenarioId) => {
      const cenario = CENARIO_SJT_POR_ID.get(cenarioId);
      if (!cenario) return null;
      const porId = new Map(cenario.alternativas.map((a) => [a.id, a]));
      const ordem =
        forma.alternativas[cenarioId] ?? cenario.alternativas.map((a) => a.id);

      return {
        id: cenario.id,
        situacao: cenario.situacao,
        alternativas: ordem
          .map((id) => porId.get(id))
          .filter((a): a is AlternativaSjt => Boolean(a))
          .map((a) => ({ id: a.id, texto: a.texto })),
      };
    })
    .filter((c): c is CenarioSjtParaCandidato => Boolean(c));
}

// ─── Respostas e validação ─────────────────────────────────────────────────

export type RespostaSjt = { cenarioId: string; alternativaId: string };

export type ViolacaoSjt = { regra: string; detalhe: string };

/**
 * Valida antes de pontuar.
 *
 * Diferente do Big Five e do DISC, aqui não existe "os 8 obrigatórios": o §4.2
 * permite de 6 a 10 cenários por processo, e o denominador do §4.4 é
 * "2 × nº de cenários APLICADOS". Então a regra é: cada cenário respondido uma
 * única vez, alternativa pertencente ao cenário, e a quantidade dentro da faixa
 * — abaixo de 6 o score deixa de significar o que o manual diz que significa.
 */
export function validarRespostasSjt(respostas: RespostaSjt[]): ViolacaoSjt[] {
  const violacoes: ViolacaoSjt[] = [];
  const vistos = new Set<string>();

  for (const resposta of respostas) {
    const cenario = CENARIO_SJT_POR_ID.get(resposta.cenarioId);

    if (!cenario) {
      violacoes.push({
        regra: "cenario_desconhecido",
        detalhe: `"${resposta.cenarioId}" não é cenário do SJT`,
      });
      continue;
    }

    if (vistos.has(cenario.id))
      violacoes.push({
        regra: "cenario_repetido",
        detalhe: `cenário ${cenario.numero} respondido mais de uma vez`,
      });
    vistos.add(cenario.id);

    if (!cenario.alternativas.some((a) => a.id === resposta.alternativaId))
      violacoes.push({
        regra: "alternativa_fora_do_cenario",
        detalhe: `"${resposta.alternativaId}" não pertence ao cenário ${cenario.numero}`,
      });
  }

  if (vistos.size < MINIMO_DE_CENARIOS_SJT)
    violacoes.push({
      regra: "cenarios_de_menos",
      detalhe: `${vistos.size} cenários respondidos, mínimo ${MINIMO_DE_CENARIOS_SJT}`,
    });

  if (vistos.size > MAXIMO_DE_CENARIOS_SJT)
    violacoes.push({
      regra: "cenarios_de_mais",
      detalhe: `${vistos.size} cenários respondidos, máximo ${MAXIMO_DE_CENARIOS_SJT}`,
    });

  return violacoes;
}

// ─── Equações (§4.4) ───────────────────────────────────────────────────────

/**
 * `score = (pontos_obtidos / pontos_maximos) × 100`, arredondado.
 *
 * `pontos_maximos = 2 × nº de cenários` — o mesmo cálculo serve para o score
 * geral e para o de cada competência, mudando só quais cenários entram na
 * conta. Como o piso natural já é zero (a pior alternativa vale 0), aqui não há
 * deslocamento de piso como no Big Five e no DISC: é razão pura.
 *
 * `Math.round` reproduz o §4.5: 68,75 → 69.
 */
export function escoreSjt(obtidos: number, cenarios: number): number {
  const maximos = PONTOS_DA_MELHOR_SJT * cenarios;
  if (maximos === 0) return 0;
  return Math.round((obtidos / maximos) * 100);
}

// ─── Faixas de interpretação (§4.6) ────────────────────────────────────────

/** Limites inclusivos em inteiro — o score já sai arredondado do §4.4. */
export const FAIXAS_SJT = [
  {
    nome: "divergente",
    rotulo: "Divergente do esperado",
    min: 0,
    max: 49,
    leitura:
      "Padrão de decisão divergente do esperado — aprofundar na entrevista antes de qualquer conclusão",
  },
  {
    nome: "adequado",
    rotulo: "Adequado",
    min: 50,
    max: 74,
    leitura:
      "Julgamento adequado com pontos específicos a explorar na entrevista",
  },
  {
    nome: "consistente",
    rotulo: "Consistente",
    min: 75,
    max: 100,
    leitura: "Julgamento consistentemente alinhado às melhores práticas",
  },
] as const;

export type FaixaSjt = (typeof FAIXAS_SJT)[number];

export function faixaSjt(score: number): FaixaSjt {
  return (
    FAIXAS_SJT.find((f) => score >= f.min && score <= f.max) ??
    FAIXAS_SJT[FAIXAS_SJT.length - 1]
  );
}

// ─── Resultado ─────────────────────────────────────────────────────────────

export type NotaDeCompetenciaSjt = {
  competencia: ChaveDeCompetenciaSjt;
  rotulo: string;
  curto: string;
  obtidos: number;
  maximos: number;
  score: number;
  /** Cenários que compuseram esta nota. Neste banco, um por competência. */
  cenarios: string[];
};

/** Escolha de alternativa [0] — gatilho obrigatório de entrevista (§4.6). */
export type PiorEscolhaSjt = {
  cenarioId: string;
  /** Título do cenário, como a ficha do analista o cita (§5.2). */
  titulo: string;
  competencia: ChaveDeCompetenciaSjt;
  rotulo: string;
};

/**
 * A saída rica da apuração. Para o que é GRAVADO, ver
 * `paraResultadoDeModuloSjt` no fim do arquivo.
 */
export type ApuracaoSjt = {
  /** Discriminante do enum `Teste` de `baterias.ts`. */
  teste: "SJT";
  obtidos: number;
  maximos: number;
  score: number;
  faixa: FaixaSjt;
  /** Ordem de aplicação — mesma dos cenários respondidos. */
  porCompetencia: NotaDeCompetenciaSjt[];
  /**
   * §4.6: "Toda alternativa [0] escolhida deve ser levada à entrevista como
   * pergunta situacional real, independentemente do score geral." É o que o
   * §5.3 converte em pergunta sugerida.
   */
  pioresEscolhas: PiorEscolhaSjt[];
};

/**
 * Aplica as equações do §4.4 sobre as respostas dadas.
 *
 * O denominador vem das respostas (nº de cenários aplicados), não do tamanho do
 * banco — é literalmente o que o §4.4 escreve, e é o que faz um processo de 6
 * cenários produzir um score comparável a um de 8.
 *
 * Lança se `validarRespostasSjt` acusar violação.
 */
export function pontuarSjt(respostas: RespostaSjt[]): ApuracaoSjt {
  const violacoes = validarRespostasSjt(respostas);
  if (violacoes.length > 0)
    throw new Error(
      `respostas do SJT inválidas: ${violacoes
        .map((v) => `${v.regra} (${v.detalhe})`)
        .join("; ")}`,
    );

  let obtidos = 0;
  const pioresEscolhas: PiorEscolhaSjt[] = [];
  const porCompetencia = new Map<ChaveDeCompetenciaSjt, NotaDeCompetenciaSjt>();

  for (const resposta of respostas) {
    const cenario = CENARIO_SJT_POR_ID.get(resposta.cenarioId);
    if (!cenario) continue; // inalcançável: a validação já barrou

    const alternativa = cenario.alternativas.find(
      (a) => a.id === resposta.alternativaId,
    );
    if (!alternativa) continue;

    obtidos += alternativa.pontos;

    if (alternativa.pontos === 0)
      pioresEscolhas.push({
        cenarioId: cenario.id,
        titulo: cenario.titulo,
        competencia: cenario.competencia,
        rotulo: COMPETENCIAS_SJT[cenario.competencia].rotulo,
      });

    // Mesma equação do geral, restrita aos cenários da competência (§4.4).
    const nomes = COMPETENCIAS_SJT[cenario.competencia];
    const nota = porCompetencia.get(cenario.competencia) ?? {
      competencia: cenario.competencia,
      rotulo: nomes.rotulo,
      curto: nomes.curto,
      obtidos: 0,
      maximos: 0,
      score: 0,
      cenarios: [],
    };
    nota.obtidos += alternativa.pontos;
    nota.maximos += PONTOS_DA_MELHOR_SJT;
    nota.cenarios.push(cenario.id);
    porCompetencia.set(cenario.competencia, nota);
  }

  for (const nota of porCompetencia.values())
    nota.score = escoreSjt(nota.obtidos, nota.cenarios.length);

  const cenarios = respostas.length;
  const score = escoreSjt(obtidos, cenarios);

  return {
    teste: "SJT",
    obtidos,
    maximos: PONTOS_DA_MELHOR_SJT * cenarios,
    score,
    faixa: faixaSjt(score),
    porCompetencia: [...porCompetencia.values()],
    pioresEscolhas,
  };
}

/**
 * Limiar do §5.3: competência abaixo de 50 vira pergunta de entrevista.
 *
 * Neste banco há um cenário por competência, então a nota só pode ser 0, 50 ou
 * 100 — e "< 50" isola exatamente quem escolheu a pior alternativa. O limiar
 * fica exposto como constante porque com dois cenários por competência (banco
 * ampliado) ele passa a discriminar de verdade.
 */
export const LIMIAR_DE_ATENCAO_SJT = 50;

// ─── Ponte para o resultado gravado (`baterias.ts`) ────────────────────────

/**
 * Reduz a apuração ao `ResultadoSjt` de `baterias.ts`, que é o que vai para
 * `Assessment.moduleResults`.
 *
 * Repare no que atravessa a fronteira: pontos e competência, nunca o gabarito.
 * O que fica gravado diz QUANTO a pessoa fez, jamais QUAL alternativa era a
 * certa — a mesma regra do §4.2 aplicada à camada de persistência, porque um
 * dia esse JSON vai ser lido por uma exportação de dados ou por um relatório
 * que ninguém previu.
 *
 * A competência sai como rótulo humano ("Foco no cliente") e não como chave: o
 * contrato pede `string`, e quem lê a ficha lê o rótulo.
 */
export function paraResultadoDeModuloSjt(
  apuracao: ApuracaoSjt,
): ResultadoSjtDeModulo {
  const porCompetencia: CompetenciaSjtDeModulo[] = apuracao.porCompetencia.map(
    (nota) => ({
      competencia: nota.rotulo,
      score: nota.score,
      cenarios: nota.cenarios.length,
    }),
  );

  return {
    teste: "SJT",
    score: apuracao.score,
    pontosObtidos: apuracao.obtidos,
    pontosMaximos: apuracao.maximos,
    porCompetencia,
    // O contrato chama de `blocoId` o que aqui é o id do cenário — é o mesmo
    // identificador, com o nome que o resto do sistema já usa para "a tela que
    // a pessoa respondeu".
    piores: apuracao.pioresEscolhas.map((p) => ({
      blocoId: p.cenarioId,
      competencia: p.rotulo,
    })),
  };
}
