import { NOMES_DE_DISC, type DimensaoDisc } from "@/lib/instrument/disc";
import type { FatorExibidoBigFive } from "@/lib/instrument/bigfive";

import type { BlocoBigFive, BlocoDisc, FichaDeModulos } from "@/lib/analise/ficha";

/**
 * A ficha do CANDIDATO — a devolutiva do §5.1 do manual.
 *
 * ═══ LEIA ANTES DE LIGAR ISTO EM QUALQUER ROTA ═════════════════════════════
 * Neste produto o candidato NÃO vê o próprio resultado. Foi decisão do dono,
 * tomada no commit 9944ae9 ("resultado deixa de ser do candidato"), e ela
 * derrubou a rota `/r/<resultToken>` inteira e toda a cópia que prometia
 * retorno — site, tela de abertura, página da vaga, e-mail de convite e
 * política de privacidade. Quem lê o resultado é quem aplicou o teste.
 *
 * O manual descreve uma devolutiva ao candidato, e é ela que está implementada
 * aqui: função pura + componente (`components/app/devolutiva-do-candidato.tsx`),
 * prontos e testados, SEM nenhuma rota pública apontando para eles. Reintroduzir
 * a devolutiva é reabrir uma decisão de produto, não ligar um import — e teria
 * que vir acompanhada de todas as promessas de retorno que foram removidas, sob
 * pena de a pessoa terminar a prova esperando uma tela que não existe.
 *
 * Se um dia for reaberta, o direito de acesso do titular (LGPD art. 18) é o
 * argumento a favor — e hoje ele é atendido por outro caminho: pedido à empresa,
 * que responde como controladora.
 *
 * ─── O que a devolutiva NUNCA pode conter (§5.1 e §6.4) ────────────────────
 *   · o score do SJT, ou qualquer traço dele — é gabaritado, e expor devolve ao
 *     candidato a régua do gabarito;
 *   · comparação com a vaga (aderência, fit, perfil-alvo) ou com outros
 *     candidatos;
 *   · alertas de qualidade das respostas (§6.3);
 *   · a palavra "Neuroticismo", em nenhuma forma (§2.4).
 *
 * O tipo de saída abaixo não tem campo para nenhuma dessas coisas, e o teste
 * `devolutiva.test.ts` varre o objeto inteiro atrás delas. É a garantia de que
 * um acréscimo distraído não vaze o que o manual proíbe.
 */

// ─── Vocabulário da devolutiva ─────────────────────────────────────────────

/**
 * Como cada fator alto se descreve em segunda pessoa.
 *
 * `frase` entra na descrição corrida; `forte` é a etiqueta de "seus pontos
 * fortes". Tudo em construção verbal, sem adjetivo de gênero: o sistema conhece
 * o nome da pessoa, e nome não diz gênero de ninguém. "Você se comunica com
 * facilidade" serve para qualquer candidato; "comunicativa" não.
 */
const VOZ_DO_BIG_FIVE: Record<
  FatorExibidoBigFive,
  { frase: string; forte: string }
> = {
  O: {
    frase: "se interessa por ideias novas e formas diferentes de fazer as coisas",
    forte: "Abertura ao novo",
  },
  C: {
    frase: "se organiza e leva o que começa até o fim",
    forte: "Organização",
  },
  E: {
    frase: "se comunica com facilidade e busca as pessoas",
    forte: "Energia social",
  },
  A: {
    frase: "coopera e se importa com quem trabalha ao seu lado",
    forte: "Cooperação",
  },
  EE: {
    frase: "mantém a calma quando a pressão aumenta",
    forte: "Calma sob pressão",
  },
};

const VOZ_DO_DISC: Record<DimensaoDisc, string> = {
  D: "Foco em resultado",
  I: "Comunicação",
  S: "Constância",
  C: "Cuidado com detalhe",
};

/** Faixa Alta do §2.6 — o que a devolutiva chama de ponto forte. */
const PISO_DA_FAIXA_ALTA = 65;

/** Quantas etiquetas de ponto forte a ficha mostra (§5.1: três no exemplo). */
const MAXIMO_DE_FORTES = 3;

// ─── Saída ─────────────────────────────────────────────────────────────────

export type Devolutiva = {
  /** "Obrigado, Maria! Aqui está o seu perfil" (§5.1). */
  saudacao: string;
  bigFive: {
    notas: Array<{ rotulo: string; score: number; faixa: string }>;
    /** Descrição corrida em segunda pessoa, tom de autoconhecimento. */
    texto: string;
  } | null;
  disc: {
    dimensoes: Array<{ dimensao: DimensaoDisc; nome: string; score: number }>;
    rotulo: string;
    frase: string;
  } | null;
  fortes: string[];
  /** A linha final do §5.1, que é o enquadramento inteiro da devolutiva. */
  encerramento: string;
};

export const ENCERRAMENTO_DA_DEVOLUTIVA =
  "Este resultado é um retrato do momento e não define você.";

// ─── Montagem ──────────────────────────────────────────────────────────────

function textoDoBigFive(bloco: BlocoBigFive): string {
  const altos = bloco.notas.filter((n) => n.score >= PISO_DA_FAIXA_ALTA);

  // Ninguém sai da devolutiva sem uma frase sobre si. Perfil todo moderado é
  // perfil comum, não perfil vazio — e o manual descreve a faixa Moderada como
  // flexibilidade situacional, que é exatamente o que se diz aqui.
  if (altos.length === 0)
    return "Os seus cinco fatores ficaram em faixa intermediária, sem um traço que se destaque muito dos outros. Na prática isso costuma aparecer como flexibilidade: você tende a se adaptar ao que a situação pede em vez de puxar sempre para o mesmo lado.";

  const frases = altos.map((n) => VOZ_DO_BIG_FIVE[n.chave].frase);
  const lista =
    frases.length === 1
      ? frases[0]
      : `${frases.slice(0, -1).join(", ")} e ${frases[frases.length - 1]}`;

  return `Você tende a ser alguém que ${lista}.`;
}

function pontosFortes(
  bigFive: BlocoBigFive | null,
  disc: BlocoDisc | null,
): string[] {
  const fortes: string[] = [];

  if (bigFive)
    for (const nota of [...bigFive.notas].sort((a, b) => b.score - a.score))
      if (nota.score >= PISO_DA_FAIXA_ALTA)
        fortes.push(VOZ_DO_BIG_FIVE[nota.chave].forte);

  if (disc) {
    const maior = [...disc.dimensoes].sort((a, b) => b.score - a.score)[0];
    if (maior) fortes.push(VOZ_DO_DISC[maior.dimensao]);
  }

  // Piso: perfil sem nenhum fator alto ainda tem um ponto mais forte que os
  // outros. Devolver a seção vazia diria "você não tem qualidade nenhuma", que
  // é o oposto do que uma devolutiva faz.
  if (fortes.length === 0 && bigFive) {
    const maior = [...bigFive.notas].sort((a, b) => b.score - a.score)[0];
    if (maior) fortes.push(VOZ_DO_BIG_FIVE[maior.chave].forte);
  }

  return [...new Set(fortes)].slice(0, MAXIMO_DE_FORTES);
}

/**
 * Monta a devolutiva a partir da MESMA ficha que o analista lê.
 *
 * Uma fonte só, dois recortes: o que o candidato vê é um subconjunto estrito do
 * que o analista vê, e nunca um segundo cálculo. Duas contas para o mesmo
 * número acabariam divergindo, e a divergência apareceria como a empresa e o
 * candidato lendo perfis diferentes da mesma prova.
 */
export function montarDevolutiva(nome: string, ficha: FichaDeModulos): Devolutiva {
  const primeiroNome = nome.trim().split(/\s+/)[0] || nome.trim();

  return {
    saudacao: `Obrigado, ${primeiroNome}! Aqui está o seu perfil`,
    bigFive: ficha.bigFive
      ? {
          notas: ficha.bigFive.notas.map((n) => ({
            rotulo: n.rotulo,
            score: n.score,
            faixa: n.faixa.rotulo,
          })),
          texto: textoDoBigFive(ficha.bigFive),
        }
      : null,
    disc: ficha.disc
      ? {
          dimensoes: ficha.disc.dimensoes.map((d) => ({
            dimensao: d.dimensao,
            nome: NOMES_DE_DISC[d.dimensao].nome,
            score: d.score,
          })),
          rotulo: ficha.disc.rotulo,
          // A leitura vem pronta da ficha do analista, que já resolve o par
          // dominante/secundária pela regra do §3.6 — mas sem os "pontos de
          // atenção" que acompanham ela lá: a devolutiva é de autoconhecimento,
          // e listar defeitos para quem está num processo seletivo não ajuda a
          // pessoa nem a empresa.
          frase: ficha.disc.resumo,
        }
      : null,
    fortes: pontosFortes(ficha.bigFive, ficha.disc),
    encerramento: ENCERRAMENTO_DA_DEVOLUTIVA,
  };
}
