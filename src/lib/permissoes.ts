import type { UserRole } from "@/generated/prisma/enums";

/**
 * O vocabulário de autorização, sem sessão dentro.
 *
 * ─── Por que separado de `tenant.ts` ───────────────────────────────────────
 * `tenant.ts` importa `auth()`, que arrasta o NextAuth e, com ele, `next/server`
 * — coisas que só existem dentro de uma requisição. A régua de permissões não
 * depende de nada disso. Enquanto as duas moravam juntas, ela não podia ser
 * testada sem levantar meio framework, e por isso nunca foi.
 *
 * Aqui ficam as decisões que dão para tomar sabendo só QUEM é a pessoa. Em
 * `tenant.ts` fica o que descobre quem ela é.
 *
 * ─── Permissão nomeada, e não degrau de escada ─────────────────────────────
 * Até aqui a autorização era uma hierarquia linear: `podeAoMenos(papel, minimo)`
 * sobre pesos 1..4. Escada assume que quem pode mais pode tudo que o de baixo
 * pode — e no Baliza isso é falso num ponto que importa.
 *
 * "Ver o ranking da vaga" e "ler o relatório comportamental de uma pessoa" não
 * são o mesmo nível do mesmo eixo: são dados de sensibilidade diferente. O
 * mesmo vale para "ler na tela" e "baixar em arquivo" — a primeira fica dentro
 * da ferramenta, com auditoria e expurgo por retenção; a segunda vira um .csv
 * na pasta de Downloads de alguém, fora do alcance das duas. Com uma escada, a
 * única forma de negar o relatório a alguém é negar também a lista, a vaga e o
 * painel inteiro.
 *
 * Então o papel deixa de ser um degrau e passa a ser um PRESET: um nome curto
 * para um conjunto de permissões. Quem pergunta, pergunta pela permissão
 * (`pode(papel, "dados:exportar")`), nunca pelo papel — assim mudar o preset é
 * mudar um lugar só, e não caçar comparações de papel espalhadas pelo código.
 *
 * ─── Papel descreve o time de RH, e mais ninguém ───────────────────────────
 * O Baliza tem três sujeitos, e só um deles usa isto:
 *
 *   · time de RH   → tem papel, e é disso que este arquivo trata
 *   · candidato    → NÃO tem papel. Entra por convite/código, os dados dele são
 *                    escopados por `candidateId` e não por `organizationId`, e o
 *                    direito dele (LGPD art. 18) é sobre a própria resposta.
 *                    Um valor `CANDIDATE` no enum entraria com peso 0, e a
 *                    primeira checagem escrita como "ao menos VIEWER" abriria o
 *                    painel da empresa para ele.
 *   · operador da  → `isPlatformAdmin`, booleano FORA do tenant. Ele não é o
 *     plataforma      topo da escada da empresa; ele está fora dela.
 */

// ─── As permissões ─────────────────────────────────────────────────────────

export const PERMISSOES = [
  "vaga:ler",
  "vaga:criar",
  "vaga:editar",
  "vaga:encerrar",

  /** A lista de candidatos, a aderência e o selo. O pipeline. */
  "candidato:ler",
  /**
   * O relatório comportamental inteiro: faixas, facetas, arquétipo, DISC,
   * roteiro de entrevista. É o dado mais sensível que o sistema guarda, e por
   * isso é uma permissão própria — dá para acompanhar um processo sem ler o
   * perfil psicométrico de ninguém.
   */
  "candidato:ler_perfil",
  "candidato:convidar",
  "parecer:escrever",

  /**
   * Tirar dado de candidato do sistema em arquivo (CSV da base, PDF da pessoa).
   *
   * Separada de `candidato:ler_perfil` de propósito: o que sai em arquivo
   * escapa da auditoria de leitura e do expurgo por retenção.
   */
  "dados:exportar",

  "equipe:gerenciar",
  "empresa:editar",
  "retencao:configurar",
  "chave_api:gerenciar",
] as const;

export type Permissao = (typeof PERMISSOES)[number];

/** O que cada permissão autoriza, em uma linha. Vai para a tela de equipe. */
export const DESCRICAO_DE_PERMISSAO: Record<Permissao, string> = {
  "vaga:ler": "Ver as vagas e o andamento de cada uma",
  "vaga:criar": "Abrir vagas novas",
  "vaga:editar": "Editar vaga, perfil-alvo e bateria de testes",
  "vaga:encerrar": "Encerrar e reabrir vagas",
  "candidato:ler": "Ver a lista de candidatos, a aderência e o selo",
  "candidato:ler_perfil": "Abrir o relatório comportamental completo",
  "candidato:convidar": "Convidar candidatos e revogar convites",
  "parecer:escrever": "Registrar a decisão e a anotação do parecer",
  "dados:exportar": "Baixar CSV da base e PDF de candidato",
  "equipe:gerenciar": "Definir quem tem acesso e com qual papel",
  "empresa:editar": "Editar os dados da empresa",
  "retencao:configurar": "Mudar o prazo de expurgo das respostas",
  "chave_api:gerenciar": "Criar e revogar chaves de API",
};

// ─── Os presets ────────────────────────────────────────────────────────────

/**
 * Papel → o que ele pode. A tabela inteira num lugar só, de propósito: é a
 * única página que alguém precisa ler para responder "quem consegue fazer o
 * quê aqui?".
 *
 * ─── Sobre o OWNER ter tudo ────────────────────────────────────────────────
 * A minimização de dados (LGPD art. 6º, III) argumenta que o dono da conta —
 * quem paga, quem administra — não precisa ler o perfil psicométrico de
 * ninguém. O argumento é bom, e o modelo agora consegue expressá-lo: basta
 * tirar `candidato:ler_perfil` da linha do OWNER.
 *
 * Não é o default porque na empresa pequena o OWNER É o recrutador — a mesma
 * pessoa que criou a conta e que vai ler os relatórios. Negar por padrão
 * trancaria o usuário solo para fora do próprio produto no primeiro minuto. O
 * ganho do modelo é que a linha existe e é editável; não que ela venha marcada.
 */
export const PERMISSOES_POR_PAPEL: Record<UserRole, readonly Permissao[]> = {
  /**
   * Acompanha o processo sem ler as pessoas.
   *
   * É o papel que só passou a fazer sentido agora: antes da separação entre
   * `candidato:ler` e `candidato:ler_perfil`, "só leitura" queria dizer leitura
   * de tudo — inclusive do relatório comportamental e do CSV da base inteira.
   */
  VIEWER: ["vaga:ler", "candidato:ler"],

  RECRUITER: [
    "vaga:ler",
    "vaga:criar",
    "vaga:editar",
    "vaga:encerrar",
    "candidato:ler",
    "candidato:ler_perfil",
    "candidato:convidar",
    "parecer:escrever",
    "dados:exportar",
  ],

  ADMIN: [
    "vaga:ler",
    "vaga:criar",
    "vaga:editar",
    "vaga:encerrar",
    "candidato:ler",
    "candidato:ler_perfil",
    "candidato:convidar",
    "parecer:escrever",
    "dados:exportar",
    "equipe:gerenciar",
    "empresa:editar",
  ],

  OWNER: [...PERMISSOES],
};

const CONJUNTO_POR_PAPEL = Object.fromEntries(
  Object.entries(PERMISSOES_POR_PAPEL).map(([papel, lista]) => [
    papel,
    new Set<Permissao>(lista),
  ]),
) as Record<UserRole, Set<Permissao>>;

/** A pergunta que o resto do código faz. Nunca compare papéis à mão. */
export function pode(papel: UserRole, permissao: Permissao): boolean {
  return CONJUNTO_POR_PAPEL[papel]?.has(permissao) ?? false;
}

export function permissoesDe(papel: UserRole): readonly Permissao[] {
  return PERMISSOES_POR_PAPEL[papel] ?? [];
}

// ─── Hierarquia: o que sobrou dela, e para quê ─────────────────────────────

/**
 * Peso do papel. NÃO use para autorizar — use `pode`.
 *
 * Continua existindo para uma pergunta só, que é genuinamente de hierarquia:
 * quem pode conceder qual papel. Ninguém entrega um papel mais forte do que o
 * seu, senão `equipe:gerenciar` vira escada para virar OWNER.
 */
const PESO: Record<UserRole, number> = {
  VIEWER: 1,
  RECRUITER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function podeAoMenos(papel: UserRole, minimo: UserRole) {
  return PESO[papel] >= PESO[minimo];
}

/** Papéis, do mais fraco ao mais forte. É a ordem da tela de equipe. */
export const PAPEIS: readonly UserRole[] = [
  "VIEWER",
  "RECRUITER",
  "ADMIN",
  "OWNER",
];

/**
 * Quais papéis esta pessoa pode atribuir a outra.
 *
 * Nunca acima do próprio: um ADMIN que promovesse alguém a OWNER teria acabado
 * de contornar a única permissão que não tem.
 */
export function papeisQuePodeConceder(papel: UserRole): readonly UserRole[] {
  return PAPEIS.filter((alvo) => podeAoMenos(papel, alvo));
}

// ─── Recusa ────────────────────────────────────────────────────────────────

/**
 * Erro de autorização para uso em rotas de API e Server Actions, onde
 * `redirect()` não é a resposta certa.
 */
export class ErroDeAutorizacao extends Error {
  constructor(
    message = "Não autorizado",
    readonly status = 403,
  ) {
    super(message);
    this.name = "ErroDeAutorizacao";
  }
}

/**
 * Recusa em rota que devolve arquivo.
 *
 * Redirecionar um `<a download>` não avisa ninguém: o navegador segue o 307,
 * recebe HTML no lugar do arquivo e o download morre em silêncio — ou, pior,
 * salva a página de erro com extensão .csv. Um 403 com corpo em texto é o que
 * a pessoa e o `fetch` conseguem distinguir de um arquivo vazio.
 */
export function respostaDeAutorizacao(erro: unknown): Response | null {
  if (!(erro instanceof ErroDeAutorizacao)) return null;
  return new Response(erro.message, {
    status: erro.status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
