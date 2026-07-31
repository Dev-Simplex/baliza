import type { Arquetipo } from "./types";

/**
 * Arquétipos — camada de COMUNICAÇÃO, não de dado (§6).
 *
 *   ✅ usar em: título do relatório, e-mail, conversa, material de venda
 *   ❌ NUNCA em: ranking, fit score, filtro, exportação, qualquer comparação
 *
 * Um arquétipo é uma discretização com perda: dois "Executor" podem ter perfis
 * bem diferentes. Ranquear por arquétipo joga fora exatamente a informação pela
 * qual o cliente está pagando.
 *
 * Atribuição por menor distância euclidiana ao protótipo. Se os dois mais
 * próximos ficarem a menos de `LIMIAR_MISTO`, o relatório exibe "perfil misto",
 * que é mais honesto e, na prática, mais útil pro recrutador.
 */

export const LIMIAR_MISTO = 8;

export const ARQUETIPOS: Arquetipo[] = [
  {
    id: "executor",
    nome: "O Executor",
    prototipo: { C: 85, E: 68, X: 68, A: 50, O: 50 },
    essencia: "Transforma combinado em entregue.",
    perguntaChave:
      "Me conta de uma entrega que você tirou no prazo mas que, olhando pra trás, atropelou alguém no caminho.",
    brilhaEm:
      "Ambientes com meta, prazo e responsabilidade clara. É quem fecha o que os outros começaram. Costuma ser a pessoa que o time procura quando algo precisa sair hoje.",
    travaEm:
      "Situações ambíguas, sem dono definido ou com o objetivo mudando toda semana. Pode atropelar gente no caminho da entrega e confundir velocidade com direção.",
    oGestorPrecisaDar:
      "Objetivo claro e autonomia pra executar. Cobrança de resultado funciona; microgerenciamento desmonta.",
    cuidadoAoLer:
      "Alto em Organização e Entrega não significa que a pessoa faz bem-feito — significa que ela faz. Confirme o padrão de qualidade na entrevista.",
  },
  {
    id: "articulador",
    nome: "O Articulador",
    prototipo: { C: 55, E: 65, X: 85, A: 80, O: 62 },
    essencia: "Resolve pelas pessoas.",
    perguntaChave:
      "Me conta de algo que você combinou numa conversa e que depois não saiu. O que aconteceu entre uma coisa e outra?",
    brilhaEm:
      "Venda, atendimento, parcerias, qualquer coisa que dependa de destravar relação. Circula bem, é procurado, sabe pedir ajuda e sabe dar.",
    travaEm:
      'Trabalho solitário, longo e detalhista. Tende a evitar a conversa difícil e a deixar rastro solto — o combinado fica no "a gente se fala".',
    oGestorPrecisaDar:
      "Contato humano e reconhecimento visível. E um processo que registre por ele o que ele resolveu na conversa.",
    cuidadoAoLer:
      'Facilidade social encanta em entrevista e infla a avaliação. Separe "é agradável de conversar" de "entrega o que combinou".',
  },
  {
    id: "analista",
    nome: "O Analista",
    prototipo: { C: 80, E: 55, X: 32, A: 55, O: 78 },
    essencia: "Não aceita a resposta fácil.",
    perguntaChave:
      "Me conta de uma decisão que você teve que tomar sem ter a informação que queria ter. Como você decidiu que já dava?",
    brilhaEm:
      "Problema que precisa ser entendido antes de resolvido. Dado, diagnóstico, qualidade, investigação. Enxerga o que os outros passaram batido.",
    travaEm:
      "Pressão por decisão rápida com informação incompleta. Pode travar buscando certeza que não existe, e a exposição social lhe custa energia.",
    oGestorPrecisaDar:
      'Tempo de mergulho e um critério explícito de "bom o suficiente". Sem esse critério, ele não sabe quando parar.',
    cuidadoAoLer:
      "Energia Social baixa não é falta de habilidade social nem de liderança. Não confunda quieto com desengajado — o erro mais comum em entrevista.",
  },
  {
    id: "explorador",
    nome: "O Explorador",
    prototipo: { C: 42, E: 75, X: 65, A: 52, O: 85 },
    essencia: "Prefere o problema novo ao problema resolvido.",
    perguntaChave:
      "Me conta de um projeto que você levou do começo ao fechamento. Quanto tempo durou e o que te segurou até o fim?",
    brilhaEm:
      "Começo de coisa. Território sem mapa, produto novo, cliente novo, crise que ninguém sabe como atacar. Aguenta bem a ambiguidade que paralisa os outros.",
    travaEm:
      "Rotina, repetição e processo fechado. O interesse cai quando o desafio acaba — e costuma acabar antes da entrega.",
    oGestorPrecisaDar:
      "Problema novo com frequência, e alguém do lado que feche o que ele abriu.",
    cuidadoAoLer:
      "Empolga em entrevista porque tem histórias boas. Pergunte pelo que ele terminou, não pelo que ele começou.",
  },
  {
    id: "guardiao",
    nome: "O Guardião",
    prototipo: { C: 82, E: 65, X: 42, A: 78, O: 32 },
    essencia: "Segura a operação de pé.",
    perguntaChave:
      "Me conta da última vez em que uma regra do trabalho mudou de um dia pro outro. Como foi pra você?",
    brilhaEm:
      "Onde consistência vale mais que criatividade: financeiro, operação, compliance, back-office, turno. É quem faz igual todo dia — e isso é raro.",
    travaEm:
      "Mudança frequente de regra e ferramenta. Absorve peso demais sem reclamar, até que quebra sem aviso.",
    oGestorPrecisaDar:
      "Regra estável e aviso antecipado quando algo vai mudar. Perguntar explicitamente como ele está — porque ele não vai levantar a mão sozinho.",
    cuidadoAoLer:
      "Abertura baixa não é falta de inteligência nem resistência a aprender. É preferência por estabilidade — e em muitas vagas isso é exatamente o ativo.",
  },
  {
    id: "catalisador",
    nome: "O Catalisador",
    prototipo: { C: 55, E: 75, X: 82, A: 38, O: 75 },
    essencia: "Provoca movimento, inclusive o desconfortável.",
    perguntaChave:
      "Me conta de uma vez em que você empurrou uma mudança e alguém saiu magoado. Você percebeu na hora ou depois?",
    brilhaEm:
      "Time parado, processo viciado, decisão sendo empurrada há meses. Fala o que os outros estão evitando falar e não recua na negociação.",
    travaEm:
      "Ambiente que precisa de harmonia e paciência. Deixa gente magoada sem perceber, e o custo aparece depois — em quem pede pra sair.",
    oGestorPrecisaDar:
      "Espaço real de influência e retorno franco sobre o rastro que ele deixa. Sem esse retorno, ele não enxerga o dano.",
    cuidadoAoLer:
      "Cooperação baixa não é má-fé — é priorizar a tarefa sobre a relação. Em vaga de negociação e cobrança isso é vantagem; em time frágil, é risco.",
  },
];

export const ARQUETIPO_POR_ID = new Map(ARQUETIPOS.map((a) => [a.id, a]));
