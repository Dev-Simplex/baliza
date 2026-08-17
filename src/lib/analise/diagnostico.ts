import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";
import type { FichaDeModulos } from "@/lib/analise/ficha";
import type { SeloDeConfianca } from "@/lib/analise/qualidade";
import type { Roteiro } from "@/lib/analise/roteiro";

/**
 * O DIAGNÓSTICO — a leitura de contratação, em cima do que já foi calculado.
 *
 * ─── Por que este arquivo existe ───────────────────────────────────────────
 * A página do candidato já mostrava tudo: aderência, faixa por dimensão, ficha
 * dos módulos, arquétipo, nuances, roteiro. O problema não era falta de dado —
 * era que a síntese ficava por conta de quem lia. Quem entrevista abre a tela
 * quinze minutos antes da conversa e precisa sair dela sabendo três coisas:
 *
 *   1. o que esta pessoa entrega que ESTA vaga precisa;
 *   2. onde está o risco, e o que ele custa na prática;
 *   3. o que a entrevista tem que confirmar.
 *
 * Antes, para chegar nisso, era preciso cruzar cinco blocos na cabeça. Este
 * módulo faz o cruzamento e entrega as três respostas em texto.
 *
 * ─── O que ele NÃO faz, e por quê ──────────────────────────────────────────
 * Não recalcula nada. Escore, aderência, faixa, perda, selo e perguntas já
 * foram computados por `scoring.ts`, `qualidade.ts`, `ficha.ts` e `roteiro.ts`.
 * Refazer qualquer uma dessas contas aqui criaria um segundo número para a
 * mesma coisa — a forma mais silenciosa de os dois divergirem.
 *
 * E não emite veredito. Não existe "contratar" / "não contratar" saindo daqui,
 * e isso é decisão de produto, não esquecimento: a regra do §4.4 (o fit nunca
 * aparece sozinho) existe porque número com carimbo de aprovação para de ser
 * lido como evidência e passa a ser lido como sentença. Quem decide é o
 * `ParecerDoAnalista`, com nome e data. O diagnóstico entrega o que sustenta a
 * decisão — em cima da mesa, para poder ser contestado.
 *
 * ─── Servidor ──────────────────────────────────────────────────────────────
 * Só importa TIPOS de `ficha.ts` e `qualidade.ts` (import type, apagado na
 * compilação), então não arrasta o banco de cenários com gabarito. O que sai
 * daqui é dado puro e pode atravessar para um componente de cliente.
 */

// ─── O que cada dimensão significa na hora de contratar ────────────────────

/**
 * A leitura de CONTRATAÇÃO dos cinco fatores — três polos por dimensão.
 *
 * Por que é um catálogo novo e não reaproveitado: o que existia era `VOZ_DO_*`
 * da devolutiva, que fala COM o candidato ("você tende a…", tom de cuidado), e
 * `INTERPRETACAO_BIG_FIVE`, que descreve o traço em abstrato. Nenhum dos dois
 * responde a pergunta que quem entrevista faz, que é sempre a mesma: e daí? o
 * que muda no meu time se eu contratar essa pessoa? Aqui cada linha termina em
 * consequência de trabalho, não em adjetivo.
 *
 * O polo `acima` não é elogio duplicado. A regra nº 4 do produto — ninguém é
 * forte demais de graça — vale aqui inteira: excesso acima do teto que a vaga
 * pediu tem custo, e esconder esse custo é o mesmo erro que esconder o déficit.
 */
const LEITURA_DE_CONTRATACAO: Record<
  Fator,
  { forca: string; abaixo: string; acima: string }
> = {
  C: {
    forca:
      "Entrega o combinado sem precisar de cobrança, e deixa rastro do que foi feito.",
    abaixo:
      "Prazo e retomada vão depender de acompanhamento explícito. Combine o ritual de checagem antes do primeiro mês, não depois do primeiro atraso.",
    acima:
      "Rigor alto trava diante de escopo que muda e de trabalho inacabado. Em time que decide rápido e corrige depois, vira gargalo.",
  },
  E: {
    forca:
      "Sustenta o julgamento quando o prazo aperta, e não leva atrito para o campo pessoal.",
    abaixo:
      "Sob pressão contínua o desempenho oscila, e feedback duro tende a custar alguns dias de recuperação. Importa quem vai ser o gestor.",
    acima:
      "Serenidade demais lê urgência com atraso. Pode não soar o alarme enquanto ainda dava tempo de apagar.",
  },
  X: {
    forca:
      "Abre conversa, ocupa espaço em reunião e faz a informação circular entre áreas.",
    abaixo:
      "Rende mais no trabalho concentrado do que na articulação. Não conte com esta pessoa para puxar sozinha a relação com outras áreas.",
    acima:
      "Presença demais consome o espaço dos outros. Em time silencioso, a reunião vira plateia.",
  },
  A: {
    forca:
      "Constrói acordo e sustenta relação de trabalho longa sem desgastar o time.",
    abaixo:
      "Negocia duro e diz não com facilidade. Bom para cobrança e para conversa difícil; caro para o clima, se o time já for tenso.",
    acima:
      "Evita o conflito que precisa acontecer. Tende a engolir discordância e a dizer sim para o que não cabe na agenda.",
  },
  O: {
    forca:
      "Aceita método novo e testa hipótese sem exigir garantia prévia de que vai dar certo.",
    abaixo:
      "Prefere o caminho já conhecido. Mudança de processo vai precisar de justificativa e de tempo — planeje a adoção, não anuncie.",
    acima:
      "Troca de interesse rápido e pode abandonar o que já estava funcionando por curiosidade. Peça histórico de coisa terminada.",
  },
};

// ─── Formato ───────────────────────────────────────────────────────────────

export type ItemDoDiagnostico = {
  /** O nome que aparece em negrito: "Organização e Entrega". */
  titulo: string;
  /**
   * Como citar o achado DENTRO de uma frase.
   *
   * Título e menção são coisas diferentes e confundi-las produz frase capenga:
   * `Pior escolha em "Conflito com colega"` é um bom título de lista e uma
   * péssima continuação de "o que precisa ser confirmado é…". Quando ausente,
   * o título serve — vale para as dimensões, cujo nome já é um substantivo.
   */
  mencao?: string;
  /** O número e a régua contra a qual ele foi lido. Nunca o número sozinho. */
  evidencia: string;
  /** O "e daí" — o que isso significa no trabalho. */
  consequencia: string;
  origem: "prumo" | "sjt" | "disc" | "bigfive";
  /**
   * Achado que o manual manda levar à entrevista de qualquer jeito (§4.6).
   * Não é cortado pelo teto da lista.
   */
  obrigatorio?: boolean;
};

export type Diagnostico = {
  /** Uma frase. É o que fica se a pessoa ler só a primeira linha da tela. */
  leitura: string;
  forcas: ItemDoDiagnostico[];
  riscos: ItemDoDiagnostico[];
  /** O que o gestor vai ter que fazer para esta pessoa render. */
  comoTrabalhar: string[];
  /**
   * Quantas perguntas o roteiro montou — e NÃO as perguntas.
   *
   * A tentação óbvia era fechar o diagnóstico com as três primeiras, para ele
   * "terminar em ação". É exatamente o que `roteiro.ts` proíbe, e com razão
   * escrita lá: duas listas de perguntas na mesma tela viram uma lida e outra
   * esquecida. O diagnóstico aponta para o roteiro; quem leva para a entrevista
   * continua sendo uma folha só.
   */
  perguntasNoRoteiro: number;
  confianca: SeloDeConfianca | null;
  /** A bateria não mediu os cinco fatores — não houve comparação com a vaga. */
  semAderencia: boolean;
};

/**
 * Tetos das listas.
 *
 * Três e três não é economia de espaço, é a tese do módulo: a página inteira já
 * está disponível logo abaixo para quem quiser tudo. O diagnóstico só serve
 * para alguma coisa se ele ESCOLHER — uma lista com nove forças tem exatamente
 * o mesmo problema que a tela tinha antes de existir, que é devolver a
 * priorização para quem lê.
 */
const TETO_DE_FORCAS = 3;
const TETO_DE_RISCOS = 4;

// ─── Montagem ──────────────────────────────────────────────────────────────

export function montarDiagnostico(entrada: {
  contribuicoes: ContribuicaoDeFit[];
  ficha: FichaDeModulos;
  arquetipoId: string | null;
  selo: SeloDeConfianca | null;
  roteiro: Roteiro;
  semAderencia?: boolean;
}): Diagnostico {
  const semAderencia = entrada.semAderencia ?? false;
  const arquetipo = entrada.arquetipoId
    ? (ARQUETIPO_POR_ID.get(entrada.arquetipoId) ?? null)
    : null;

  const forcas = montarForcas(entrada.contribuicoes, entrada.ficha);
  const riscos = montarRiscos(entrada.contribuicoes, entrada.ficha);

  return {
    leitura: frasedeLeitura({ arquetipo, forcas, riscos, semAderencia }),
    forcas,
    riscos,
    comoTrabalhar: montarComoTrabalhar(arquetipo, entrada.ficha),
    perguntasNoRoteiro: entrada.roteiro.perguntas.length,
    confianca: entrada.selo,
    semAderencia,
  };
}

/**
 * As forças que ESTA vaga usa.
 *
 * O filtro `peso > 0` é o que separa "é uma qualidade" de "serve para esta
 * vaga". Dimensão com peso zero foi descartada de propósito pelo recrutador ao
 * montar o perfil-alvo; listá-la como força seria elogiar o candidato por algo
 * que a vaga decidiu não medir — e é assim que relatório vira simpatia.
 *
 * A ordem é por peso, e não por escore: a dimensão que a vaga mais pesa vem
 * primeiro mesmo que o número dela seja menor que o de outra. É a vaga que
 * define o que é importante, não o candidato.
 */
function montarForcas(
  contribuicoes: ContribuicaoDeFit[],
  ficha: FichaDeModulos,
): ItemDoDiagnostico[] {
  const dentro = contribuicoes
    .filter((c) => c.dentro && c.peso > 0)
    .sort((a, b) => b.peso - a.peso || b.escore - a.escore)
    .slice(0, TETO_DE_FORCAS)
    .map((c): ItemDoDiagnostico => {
      const [lo, hi] = c.faixa;
      return {
        titulo: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
        evidencia: `${Math.round(c.escore)} — dentro da faixa ${lo}–${hi} que esta vaga pede${posicaoNaFaixa(c.escore, lo, hi)}.`,
        consequencia: LEITURA_DE_CONTRATACAO[c.fator].forca,
        origem: "prumo",
      };
    });

  // O DISC entra como UM item de estilo, e não como quatro dimensões soltas.
  // Ele não produz aderência (as quatro dimensões não se mapeiam nos cinco
  // fatores), então aqui ele não disputa espaço com o que foi medido contra a
  // vaga: entra como a cor do jeito de trabalhar, depois do que pesa.
  if (ficha.disc && ficha.disc.fortes.length > 0) {
    dentro.push({
      titulo: `Estilo ${ficha.disc.rotulo}`,
      mencao: `o estilo ${ficha.disc.rotulo}`,
      evidencia: ficha.disc.resumo,
      consequencia: `Onde costuma render: ${listar(ficha.disc.fortes)}.`,
      origem: "disc",
    });
  }

  return dentro;
}

/**
 * Os riscos, na ordem em que o manual os hierarquiza.
 *
 * A escolha [0] do SJT vem antes de tudo e não é cortada pelo teto (§4.6): é o
 * único achado da bateria em que a pessoa não se autoavaliou — ela disse o que
 * FARIA numa situação de trabalho e escolheu a pior das quatro ações. Um escore
 * alto no mesmo teste não compra o direito de esconder isso, e é por essa razão
 * exata que o manual grifa duas vezes.
 */
function montarRiscos(
  contribuicoes: ContribuicaoDeFit[],
  ficha: FichaDeModulos,
): ItemDoDiagnostico[] {
  const obrigatorios: ItemDoDiagnostico[] = [];
  const demais: ItemDoDiagnostico[] = [];

  for (const pior of ficha.sjt?.piores ?? []) {
    obrigatorios.push({
      titulo: `Alternativa mais fraca em "${pior.titulo}"`,
      mencao: `a alternativa mais fraca no cenário "${pior.titulo}"`,
      evidencia: `Escolheu a opção que vale zero ponto num caso de ${pior.competencia.toLowerCase()}.`,
      // "O manual manda levar à entrevista independentemente do score geral"
      // era o texto daqui. É a regra do produto dita para dentro: verdadeira,
      // e inútil para quem vai conversar com a pessoa em quinze minutos. O que
      // ele precisa saber é o que perguntar e o que este achado NÃO autoriza
      // concluir — porque uma escolha ruim num caso escrito, sem essa
      // ressalva, vira impressão de caráter antes da conversa começar.
      consequencia:
        "Vale perguntar sobre uma situação parecida — já está no roteiro, mesmo com score alto. Não é erro de caráter: o teste mede uma escolha no papel, sem contexto e sem as pessoas envolvidas. Peça um exemplo real antes de concluir.",
      origem: "sjt",
      obrigatorio: true,
    });
  }

  // Dimensões fora da faixa, pela PERDA de aderência — é onde a conversa
  // rende mais, e é a mesma ordenação que o roteiro usa. Duas telas que
  // ordenam o mesmo achado de formas diferentes fazem quem lê achar que
  // perdeu alguma coisa.
  const fora = contribuicoes
    .filter((c) => !c.dentro && c.peso > 0)
    .sort((a, b) => b.perda - a.perda);

  for (const c of fora) {
    const [lo, hi] = c.faixa;
    const abaixo = c.escore < lo;
    demais.push({
      titulo: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
      evidencia: abaixo
        ? `${Math.round(c.escore)} — abaixo do piso de ${lo} que esta vaga pede.`
        : `${Math.round(c.escore)} — acima do teto de ${hi} que esta vaga pede.`,
      consequencia: abaixo
        ? LEITURA_DE_CONTRATACAO[c.fator].abaixo
        : LEITURA_DE_CONTRATACAO[c.fator].acima,
      origem: "prumo",
    });
  }

  for (const competencia of ficha.sjt?.competencias ?? []) {
    if (!competencia.atencao) continue;
    demais.push({
      titulo: competencia.rotulo,
      mencao: `${competencia.rotulo} no julgamento situacional`,
      evidencia: `${competencia.score} no julgamento situacional, em ${competencia.cenarios} ${competencia.cenarios === 1 ? "caso" : "casos"}.`,
      consequencia:
        "Pontuação baixa nesta competência específica — o score geral do teste esconde buraco assim. É onde perguntar, não onde reprovar.",
      origem: "sjt",
    });
  }

  if (ficha.disc && ficha.disc.atencao.length > 0) {
    demais.push({
      titulo: `Custo do estilo ${ficha.disc.rotulo}`,
      mencao: `o custo do estilo ${ficha.disc.rotulo}`,
      evidencia: `Pontos de atenção do perfil: ${listar(ficha.disc.atencao)}.`,
      consequencia:
        "DISC descreve estilo, não competência: isto não reprova ninguém. Serve para o gestor saber o que vai precisar compensar.",
      origem: "disc",
    });
  }

  return [...obrigatorios, ...demais.slice(0, TETO_DE_RISCOS)];
}

/**
 * O que o gestor vai ter que fazer.
 *
 * Sai inteiro de prosa que já existe (arquétipo e DISC) porque escrever de novo
 * aqui criaria uma segunda descrição do mesmo perfil — e duas descrições do
 * mesmo perfil envelhecem em direções diferentes.
 *
 * Esta seção é a que responde a parte do pedido que nenhum número responde:
 * contratar não é só decidir sim ou não, é saber o que a pessoa vai precisar
 * para render depois que o sim acontecer.
 */
function montarComoTrabalhar(
  arquetipo: ReturnType<typeof ARQUETIPO_POR_ID.get> | null,
  ficha: FichaDeModulos,
): string[] {
  const linhas: string[] = [];

  if (arquetipo) {
    linhas.push(`Brilha em ${descapitalizar(arquetipo.brilhaEm)}`);
    linhas.push(`Trava em ${descapitalizar(arquetipo.travaEm)}`);
    linhas.push(arquetipo.cuidadoAoLer);
  }

  if (ficha.disc && ficha.disc.atencao.length > 0) {
    linhas.push(
      `No dia a dia, o estilo ${ficha.disc.rotulo} cobra atenção em ${listar(ficha.disc.atencao)}.`,
    );
  }

  return linhas;
}

// ─── A frase de leitura ────────────────────────────────────────────────────

/**
 * A síntese em uma frase.
 *
 * Ela é montada por composição e não escolhida de um banco de frases prontas
 * porque precisa citar os achados DESTE candidato nesta vaga — frase genérica
 * de arquétipo é exatamente o que a tela já tinha e não resolvia.
 *
 * Todos os caminhos têm saída: arquétipo pode não ter sido atribuído, a vaga
 * pode não ter dimensão nenhuma com peso, e a bateria pode não medir os cinco
 * fatores. Uma frase vazia no topo da tela seria pior que não ter a seção.
 */
function frasedeLeitura(entrada: {
  arquetipo: ReturnType<typeof ARQUETIPO_POR_ID.get> | null;
  forcas: ItemDoDiagnostico[];
  riscos: ItemDoDiagnostico[];
  semAderencia: boolean;
}): string {
  const { arquetipo, forcas, riscos, semAderencia } = entrada;

  const abertura = arquetipo
    ? `Perfil próximo ${contrair(arquetipo.nome)}: ${descapitalizar(arquetipo.essencia)}`
    : "";

  if (semAderencia) {
    return juntar(
      abertura,
      "Esta bateria não mede os cinco fatores, então não houve comparação com o perfil-alvo da vaga. O que segue vem só dos testes que foram aplicados.",
    );
  }

  const forcaDoPrumo = forcas.find((f) => f.origem === "prumo");
  const riscoTop = riscos[0];

  if (!riscoTop) {
    return juntar(
      abertura,
      forcaDoPrumo
        ? `Todas as dimensões que pesam nesta vaga ficaram dentro da faixa, com ${forcaDoPrumo.titulo} à frente. A entrevista serve para confirmar que a força se sustenta na prática.`
        : "Todas as dimensões que pesam nesta vaga ficaram dentro da faixa. A entrevista serve para confirmar que as forças se sustentam na prática.",
    );
  }

  // Os títulos entram como estão, sem `toLowerCase()`. A tentação de baixar a
  // caixa para a frase "fluir" custou caro no primeiro rascunho: título de
  // achado do SJT carrega o nome do cenário entre aspas, e a frase saía com
  // `pior escolha em "conflito com colega"` — o nome próprio do cenário
  // destruído no meio da única linha que a maior parte das pessoas lê.
  const meio = forcaDoPrumo
    ? `Para esta vaga, ${forcaDoPrumo.titulo} é o que sustenta`
    : "Para esta vaga";

  return juntar(
    abertura,
    `${meio}; o que precisa ser confirmado na entrevista é ${riscoTop.mencao ?? riscoTop.titulo}.`,
  );
}

/**
 * "O Executor" → "do Executor".
 *
 * Todos os arquétipos nascem com artigo no nome, e é assim que eles têm que
 * aparecer no cartão da lateral. No meio de uma frase o artigo tem que se
 * contrair com a preposição, senão sai "perfil próximo de O Executor" — que é
 * a primeira coisa que alguém lê na página do candidato.
 */
function contrair(nome: string): string {
  if (nome.startsWith("O ")) return `do ${nome.slice(2)}`;
  if (nome.startsWith("A ")) return `da ${nome.slice(2)}`;
  return `de ${nome}`;
}

// ─── Utilitários de texto ──────────────────────────────────────────────────

/**
 * Onde o escore caiu DENTRO da faixa.
 *
 * "78, dentro da faixa 65–85" e "84, dentro da faixa 65–85" são a mesma frase
 * para quem passa o olho, e não são a mesma notícia: uma força raspando o piso
 * da vaga é a primeira coisa que a entrevista devia checar. O intervalo é
 * cortado em terços — mais que isso seria fingir precisão que a régua não tem.
 */
function posicaoNaFaixa(escore: number, lo: number, hi: number): string {
  const largura = hi - lo;
  if (largura <= 0) return "";
  const posicao = (escore - lo) / largura;
  if (posicao <= 1 / 3) return ", raspando o piso";
  if (posicao >= 2 / 3) return ", no topo";
  return "";
}

function listar(itens: string[]): string {
  const limpos = itens.filter(Boolean).map((i) => i.toLowerCase());
  if (limpos.length === 0) return "";
  if (limpos.length === 1) return limpos[0];
  return `${limpos.slice(0, -1).join(", ")} e ${limpos[limpos.length - 1]}`;
}

/** Emenda frases sem deixar espaço duplo quando a primeira está vazia. */
function juntar(...partes: string[]): string {
  return partes.filter((p) => p.trim().length > 0).join(" ");
}

/**
 * Minúscula na primeira letra, para a prosa do catálogo caber no meio de uma
 * frase. Só a primeira: nome próprio no meio do texto continua de pé.
 */
function descapitalizar(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}
