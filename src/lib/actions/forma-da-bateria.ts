import type {
  EtapaDaProva,
  OpcaoDePergunta,
  Pergunta,
} from "@/components/teste/tipos-da-prova";
import {
  CATALOGO_DE_TESTES,
  TESTES,
  type Teste,
} from "@/lib/instrument/baterias";
import {
  ESCALA_BIG_FIVE,
  INSTRUCAO_BIG_FIVE,
  ITEM_BIG_FIVE_POR_ID,
  itensParaCandidatoBigFive,
  ordenarItensBigFive,
} from "@/lib/instrument/bigfive";
import {
  BLOCO_DISC_POR_ID,
  blocosParaCandidatoDisc,
  INSTRUCAO_DISC,
  montarFormaDisc,
} from "@/lib/instrument/disc";
import {
  BLOCO_DISC_PLANILHA_POR_ID,
  INSTRUCAO_DISC_PLANILHA,
  montarFormaDiscPlanilha,
  opcoesDiscPlanilhaParaCandidato,
} from "@/lib/instrument/disc-planilha";
import {
  INSTRUCAO_ESTILO_EMOCIONAL,
  ITEM_ESTILO_EMOCIONAL_POR_ID,
  ITENS_ESTILO_EMOCIONAL,
  OPCOES_ESTILO_EMOCIONAL,
} from "@/lib/instrument/estilo-emocional";
import { montarForma, ordenarOpcoesDeCenario } from "@/lib/instrument/form";
import { ITEM_POR_ID, VERSAO_DO_INSTRUMENTO } from "@/lib/instrument/items";
import { CENARIO_POR_ID } from "@/lib/instrument/scenarios";
import {
  CENARIO_SJT_POR_ID,
  cenariosParaCandidatoSjt,
  INSTRUCAO_SJT,
  montarFormaSjt,
} from "@/lib/instrument/sjt";
import { ESCALA_LIKERT } from "@/lib/instrument/types";

/**
 * A prova de UMA pessoa, com a bateria inteira dentro.
 *
 * ─── O problema que este arquivo resolve ───────────────────────────────────
 * A forma da prova (quais perguntas, em que ordem) é sorteada quando o convite
 * nasce e fica congelada: retomar tem que mostrar a mesma prova, e o escore de
 * duas sessões não pode misturar dois sorteios. Isso já valia para a Baliza.
 * Agora a prova pode ter até quatro testes, e a pergunta "esta pergunta é
 * mesmo desta pessoa?" precisa continuar tendo UMA resposta — a mesma para a
 * tela que desenha, para a ação que grava e para o encerramento que confere.
 *
 * É esse "uma resposta só" que mora aqui. Quem quiser saber o que a pessoa tem
 * para responder chama `lerProvaDaBateria`; ninguém remonta a prova por conta
 * própria, porque duas montagens que discordem produzem o pior desfecho
 * possível: a tela desenha uma pergunta que a gravação recusa.
 *
 * ─── Onde a forma fica guardada ────────────────────────────────────────────
 * Nas duas colunas que já existem, sem coluna nova: `itemOrder` guarda tudo que
 * é afirmação de 1 a 5 (Baliza e Big Five) e `scenarioOrder` guarda tudo que é
 * bloco (situações da Baliza, blocos de palavras do DISC, cenários do SJT). É a
 * mesma divisão que o schema já faz nas tabelas de resposta, e os ids são
 * globais e distinguíveis por banco — `c_org_1`, `bf07`, `disc-b03`,
 * `sjt-c05` —, então separar de volta é consulta a mapa, nunca palpite por
 * prefixo.
 *
 * ─── Por que existe fallback de derivação ──────────────────────────────────
 * A bateria virou selecionável ANTES da prova saber aplicá-la: uma vaga criada
 * nesse intervalo pode ter avaliação com bateria `[BIG_FIVE]` e `itemOrder`
 * vazio — prova de zero telas, candidato preso. Como a forma dos três testes
 * novos é função pura da semente (que está gravada), dá para reconstruí-la
 * exatamente. O fallback é sempre determinístico: reconstruir duas vezes dá a
 * mesma prova, então quem retomar continua vendo o que viu.
 */

// ─── De qual teste é este id ───────────────────────────────────────────────

/**
 * O dono de um id, perguntado ao banco e não ao formato do texto.
 *
 * Prefixo é convenção; pertencer ao mapa é fato. Um item renomeado no banco
 * continua sendo encontrado, e um id inventado por quem mexeu na requisição não
 * vira pergunta de teste nenhum.
 */
export function testeDoItem(id: string): Teste | null {
  if (ITEM_POR_ID.has(id)) return "PRUMO";
  if (ITEM_BIG_FIVE_POR_ID.has(id)) return "BIG_FIVE";
  return null;
}

export function testeDoBloco(id: string): Teste | null {
  if (CENARIO_POR_ID.has(id)) return "PRUMO";
  if (BLOCO_DISC_POR_ID.has(id)) return "DISC";
  if (BLOCO_DISC_PLANILHA_POR_ID.has(id)) return "DISC";
  if (ITEM_ESTILO_EMOCIONAL_POR_ID.has(id)) return "ESTILO_EMOCIONAL";
  if (CENARIO_SJT_POR_ID.has(id)) return "SJT";
  return null;
}

/**
 * As opções válidas de um bloco — a conferência que impede gravar um par de ids
 * inventados e fazer a escoragem ler uma escolha que não existe.
 *
 * Devolve conjunto vazio para bloco desconhecido, e vazio reprova tudo.
 */
export function opcoesDoBloco(id: string): Set<string> {
  const cenario = CENARIO_POR_ID.get(id);
  if (cenario) return new Set(cenario.opcoes.map((o) => o.id));

  const bloco = BLOCO_DISC_POR_ID.get(id);
  if (bloco) return new Set(bloco.adjetivos.map((a) => a.id));

  const blocoPlanilha = BLOCO_DISC_PLANILHA_POR_ID.get(id);
  if (blocoPlanilha) return new Set(blocoPlanilha.opcoes.map((o) => o.id));

  if (ITEM_ESTILO_EMOCIONAL_POR_ID.has(id))
    return new Set(OPCOES_ESTILO_EMOCIONAL.map((o) => o.id));

  const sjt = CENARIO_SJT_POR_ID.get(id);
  if (sjt) return new Set(sjt.alternativas.map((a) => a.id));

  return new Set();
}

// ─── Montagem (quando o convite nasce) ─────────────────────────────────────

/** As duas listas que vão para `itemOrder` e `scenarioOrder`. */
export type ProvaGuardada = { itens: string[]; blocos: string[] };

/**
 * Sorteia a prova inteira da bateria, uma vez, no nascimento do convite.
 *
 * `excluir` é o histórico de itens que esta pessoa já viu em provas anteriores,
 * e só a Baliza o usa: ele tem banco grande o bastante para repetir pouco. Big
 * Five, DISC e SJT aplicam o banco inteiro (20, 12 e 8), então "não repetir"
 * ali significaria aplicar menos que o instrumento pede — e aí o escore deixa
 * de ser o do manual.
 */
export function montarProvaDaBateria(opcoes: {
  semente: string;
  bateria: readonly Teste[];
  excluir?: string[];
}): ProvaGuardada {
  const itens: string[] = [];
  const blocos: string[] = [];

  for (const teste of TESTES) {
    if (!opcoes.bateria.includes(teste)) continue;

    if (teste === "PRUMO") {
      const forma = montarForma({
        semente: opcoes.semente,
        versao: VERSAO_DO_INSTRUMENTO,
        excluir: opcoes.excluir,
      });
      itens.push(...forma.itens);
      blocos.push(...forma.cenarios);
    }

    if (teste === "BIG_FIVE") itens.push(...ordenarItensBigFive(opcoes.semente));
    if (teste === "DISC")
      blocos.push(...montarFormaDiscPlanilha(opcoes.semente).blocos);
    if (teste === "ESTILO_EMOCIONAL")
      blocos.push(...ITENS_ESTILO_EMOCIONAL.map((item) => item.id));
    if (teste === "SJT") blocos.push(...montarFormaSjt(opcoes.semente).cenarios);
  }

  return { itens, blocos };
}

// ─── Leitura (toda vez que a prova é aberta ou uma resposta chega) ─────────

export type ProvaDaBateria = {
  bateria: Teste[];
  /** Ids por teste, na ordem em que a pessoa os vê. */
  porTeste: Record<Teste, { itens: string[]; blocos: string[] }>;
  /** Tudo que grava em `ItemResponse`. */
  itens: string[];
  /** Tudo que grava em `ScenarioResponse` (Baliza e DISC). */
  cenarios: string[];
  /** Tudo que grava em `ChoiceResponse` (SJT). */
  escolhas: string[];
};

const VAZIO = { itens: [] as string[], blocos: [] as string[] };

/**
 * Reconstrói a prova desta pessoa a partir do que está no banco.
 *
 * Só entra id que (a) pertence a um teste da bateria congelada e (b) existe no
 * banco de hoje. A segunda condição é a mesma regra que `pendenciasDaProva` já
 * aplica: item aposentado do instrumento não pode virar pergunta que a tela não
 * desenha nem pendência que tranca a conclusão para sempre.
 */
export function lerProvaDaBateria(entrada: {
  semente: string;
  bateria: readonly Teste[];
  itensGuardados: readonly string[];
  blocosGuardados: readonly string[];
}): ProvaDaBateria {
  const bateria = TESTES.filter((t) => entrada.bateria.includes(t));
  const porTeste = Object.fromEntries(
    TESTES.map((t) => [t, { itens: [] as string[], blocos: [] as string[] }]),
  ) as ProvaDaBateria["porTeste"];

  const vistos = new Set<string>();
  for (const id of entrada.itensGuardados) {
    const teste = testeDoItem(id);
    if (!teste || !bateria.includes(teste) || vistos.has(id)) continue;
    vistos.add(id);
    porTeste[teste].itens.push(id);
  }
  for (const id of entrada.blocosGuardados) {
    const teste = testeDoBloco(id);
    if (!teste || !bateria.includes(teste) || vistos.has(id)) continue;
    vistos.add(id);
    porTeste[teste].blocos.push(id);
  }

  // Teste da bateria que não deixou nada guardado: prova nascida antes de a
  // aplicação saber montá-la. Reconstrói da semente — ver o cabeçalho.
  for (const teste of bateria) {
    const guardado = porTeste[teste];
    if (guardado.itens.length > 0 || guardado.blocos.length > 0) continue;

    const derivada = montarProvaDaBateria({
      semente: entrada.semente,
      bateria: [teste],
    });
    guardado.itens = derivada.itens.filter((id) => testeDoItem(id) === teste);
    guardado.blocos = derivada.blocos.filter((id) => testeDoBloco(id) === teste);
  }

  const blocosDe = (t: Teste) => porTeste[t].blocos;

  return {
    bateria,
    porTeste,
    itens: bateria.flatMap((t) => porTeste[t].itens),
    cenarios: [
      ...blocosDe("PRUMO"),
      ...blocosDe("DISC").filter((id) => BLOCO_DISC_POR_ID.has(id)),
    ],
    escolhas: [
      ...blocosDe("DISC").filter((id) => BLOCO_DISC_PLANILHA_POR_ID.has(id)),
      ...blocosDe("ESTILO_EMOCIONAL"),
      ...blocosDe("SJT"),
    ],
  };
}

// ─── As etapas que o candidato atravessa ───────────────────────────────────

const CURTO: Record<Teste, string> = {
  PRUMO: "Baliza",
  BIG_FIVE: "Big Five",
  DISC: "DISC",
  ESTILO_EMOCIONAL: "Emocional",
  SJT: "Situações",
};

/**
 * A Baliza é o único sem instrução no manual — ele é da casa. O texto abaixo
 * ocupa o mesmo lugar dos outros três e diz a mesma coisa que eles: não existe
 * resposta certa, e a única resposta útil é a sincera.
 */
const INSTRUCAO_PRUMO =
  "Você verá afirmações sobre o dia a dia de trabalho e algumas situações " +
  "reais. Não existe resposta certa: responda pelo que você faz, não pelo que " +
  "seria melhor responder.";

/**
 * Monta o que vai para a tela — e só o que pode ir.
 *
 * Tudo que é de uso interno fica para trás aqui: fator e inversão das
 * afirmações (§2.3), a letra D/I/S/C de cada adjetivo (§3.3), a pontuação, a
 * competência e até o título dos cenários do SJT (§4.2). Os três testes do
 * manual saem pelas funções `*ParaCandidato` dos próprios módulos, que existem
 * exatamente para serem a única porta de saída.
 */
export function montarEtapas(entrada: {
  semente: string;
  prova: ProvaDaBateria;
}): EtapaDaProva[] {
  const { prova, semente } = entrada;
  const etapas: EtapaDaProva[] = [];

  for (const teste of prova.bateria) {
    const ficha = CATALOGO_DE_TESTES[teste];
    const perguntas = perguntasDoTeste(teste, prova.porTeste[teste] ?? VAZIO, semente);

    // Etapa sem pergunta nenhuma não vira aba vazia: seria uma tela em branco
    // com um "Próxima" que a pessoa não entende.
    if (perguntas.length === 0) continue;

    etapas.push({
      teste,
      nome: ficha.nome,
      curto: CURTO[teste],
      instrucao:
        teste === "PRUMO"
          ? INSTRUCAO_PRUMO
          : teste === "BIG_FIVE"
            ? INSTRUCAO_BIG_FIVE
            : teste === "DISC"
              ? prova.porTeste.DISC.blocos.some((id) =>
                  BLOCO_DISC_PLANILHA_POR_ID.has(id),
                )
                ? INSTRUCAO_DISC_PLANILHA
                : INSTRUCAO_DISC
              : teste === "ESTILO_EMOCIONAL"
                ? INSTRUCAO_ESTILO_EMOCIONAL
                : INSTRUCAO_SJT,
      enunciado:
        teste === "PRUMO"
          ? "O quanto isso combina com você no trabalho?"
          : teste === "BIG_FIVE"
            ? "O quanto esta frase descreve você?"
            : undefined,
      escala:
        teste === "PRUMO"
          ? ESCALA_LIKERT.map((o) => ({ valor: o.valor, rotulo: o.rotulo }))
          : teste === "BIG_FIVE"
            ? ESCALA_BIG_FIVE.map((o) => ({ valor: o.valor, rotulo: o.rotulo }))
            : undefined,
      perguntas,
    });
  }

  return etapas;
}

function perguntasDoTeste(
  teste: Teste,
  forma: { itens: string[]; blocos: string[] },
  semente: string,
): Pergunta[] {
  if (teste === "PRUMO") return perguntasDoPrumo(forma, semente);

  if (teste === "BIG_FIVE") {
    return itensParaCandidatoBigFive({ semente, itens: forma.itens }).map(
      (i): Pergunta => ({ tipo: "likert", id: i.id, texto: i.texto }),
    );
  }

  if (teste === "DISC") {
    const novos = forma.blocos
      .map((id) => BLOCO_DISC_PLANILHA_POR_ID.get(id))
      .filter((bloco) => Boolean(bloco));
    if (novos.length > 0)
      return novos.map(
        (bloco): Pergunta => ({
          tipo: "escolha-curta",
          id: bloco!.id,
          situacao: bloco!.pergunta,
          opcoes: opcoesDiscPlanilhaParaCandidato(bloco!.id, semente),
        }),
      );

    // A ordem dos 4 adjetivos vem da semente, não do banco: no banco eles estão
    // sempre em D · I · S · C, e coluna fixa entregaria o mapeamento (§3.3).
    const adjetivos = montarFormaDisc(semente).adjetivos;
    return blocosParaCandidatoDisc({
      semente,
      blocos: forma.blocos,
      adjetivos,
    }).map((b): Pergunta => ({ tipo: "mais-menos", id: b.id, opcoes: b.adjetivos }));
  }

  if (teste === "ESTILO_EMOCIONAL") {
    return forma.blocos
      .map((id) => ITEM_ESTILO_EMOCIONAL_POR_ID.get(id))
      .filter((item) => Boolean(item))
      .map(
        (item): Pergunta => ({
          tipo: "binaria",
          id: item!.id,
          situacao: item!.texto,
          opcoes: OPCOES_ESTILO_EMOCIONAL.map(({ id, texto }) => ({ id, texto })),
        }),
      );
  }

  // SJT. Mesma história das alternativas: no banco estão em ordem didática (a
  // de 2 pontos primeiro), então ordem fixa faria "marcar a primeira" valer 100.
  const alternativas = montarFormaSjt(semente).alternativas;
  return cenariosParaCandidatoSjt({
    semente,
    cenarios: forma.blocos,
    alternativas,
  }).map(
    (c): Pergunta => ({
      tipo: "escolha",
      id: c.id,
      situacao: c.situacao,
      opcoes: c.alternativas,
    }),
  );
}

function perguntasDoPrumo(
  forma: { itens: string[]; blocos: string[] },
  semente: string,
): Pergunta[] {
  const afirmacoes = forma.itens
    .map((id) => ITEM_POR_ID.get(id))
    .filter((i) => Boolean(i))
    .map((i): Pergunta => ({ tipo: "likert", id: i!.id, texto: i!.texto }));

  const situacoes = forma.blocos
    .map((id) => CENARIO_POR_ID.get(id))
    .filter((c) => Boolean(c))
    .map((c): Pergunta => {
      const ordem = ordenarOpcoesDeCenario(
        semente,
        c!.id,
        c!.opcoes.map((o) => o.id),
      );
      const opcoes: OpcaoDePergunta[] = ordem.map((oid) => {
        const o = c!.opcoes.find((x) => x.id === oid)!;
        return { id: o.id, texto: o.texto };
      });
      return {
        tipo: "ordenar",
        id: c!.id,
        titulo: c!.titulo,
        situacao: c!.situacao,
        opcoes,
      };
    });

  // Afirmações antes das situações: é a ordem que o instrumento sempre teve, e
  // as situações custam bem mais atenção por tela.
  return [...afirmacoes, ...situacoes];
}
