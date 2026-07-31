import type { Item } from "./types";

/**
 * Banco de itens — Parte A (normativa).
 *
 * 120 itens de conteúdo (5 fatores × 3 facetas × 8 itens) + 8 de desejabilidade
 * social = 128 no total.
 *
 * ─── Por que um banco maior que a prova ────────────────────────────────────
 * Cada aplicação sorteia 44 itens (8 por fator + 4 de desejabilidade). O banco
 * grande não serve pra alongar o questionário — serve pra três coisas:
 *
 *   1. Sorteio real por pessoa, sem repetir item dentro da mesma aplicação.
 *   2. Candidato recorrente recebe itens que ainda não viu — que é o que torna
 *      o histórico de evolução honesto (reaplicar os MESMOS itens mede memória,
 *      não mudança).
 *   3. Item que se mostrar ruim na análise sai do banco sem encurtar a prova.
 *
 * O fator continua sendo medido por 8 itens, que é o que sustenta o alfa de
 * 0,78–0,85 — a regra do §4.2 não foi afrouxada.
 *
 * ─── Regras de redação (§3.3) ──────────────────────────────────────────────
 *   1. comportamento observável, nunca adjetivo    5. sem dupla negativa
 *   2. contexto de trabalho, nunca vida pessoal    6. ~45% invertidos
 *   3. uma ideia por item                          7. sem carga moral óbvia
 *   4. leitura de 6º ano                              (exceto os itens D)
 *
 * Cada faceta tem 4 itens diretos e 4 invertidos, o que dá liberdade ao sorteio
 * pra fechar a proporção de inversão exigida sem repetir sempre os mesmos.
 *
 * `dimensaoDeMercado` é camada de VOCABULÁRIO: é o nome que o recrutador
 * reconhece (Comunicação, Liderança, ...). Não é dimensão de escoragem e nunca
 * entra no cálculo.
 */

export const VERSAO_DO_INSTRUMENTO = "2.0.0";

export const ITENS: Item[] = [
  // ══════════════════════════════════════════════════════════════════════
  // C — CONSCIENCIOSIDADE · Organização e Entrega
  // ══════════════════════════════════════════════════════════════════════

  // ─── faceta: organização ─────────────────────────────────────────────
  {
    id: "c_org_1",
    fator: "C",
    faceta: "organizacao",
    reverso: false,
    dimensaoDeMercado: "Organização",
    texto:
      "Antes de começar a semana, eu já sei o que preciso entregar em cada dia.",
  },
  {
    id: "c_org_2",
    fator: "C",
    faceta: "organizacao",
    reverso: true,
    par: "par_a",
    dimensaoDeMercado: "Organização",
    texto:
      "Minha mesa — física ou digital — vira uma bagunça quando fico ocupado.",
  },
  {
    id: "c_org_3",
    fator: "C",
    faceta: "organizacao",
    reverso: true,
    par: "par_a",
    dimensaoDeMercado: "Organização",
    texto: "Quando o trabalho aperta, eu perco o controle das minhas coisas.",
  },
  {
    id: "c_org_4",
    fator: "C",
    faceta: "organizacao",
    reverso: false,
    dimensaoDeMercado: "Organização",
    texto:
      "Eu anoto o que tenho pra fazer em algum lugar que consulto todo dia.",
  },
  {
    id: "c_org_5",
    fator: "C",
    faceta: "organizacao",
    reverso: false,
    dimensaoDeMercado: "Planejamento",
    texto:
      "Antes de encerrar o dia, eu já deixo separado o que vou pegar primeiro amanhã.",
  },
  {
    id: "c_org_6",
    fator: "C",
    faceta: "organizacao",
    reverso: false,
    dimensaoDeMercado: "Organização",
    texto:
      "Eu encontro um arquivo de meses atrás sem precisar procurar muito tempo.",
  },
  {
    id: "c_org_7",
    fator: "C",
    faceta: "organizacao",
    reverso: true,
    dimensaoDeMercado: "Organização",
    texto: "Eu descubro que esqueci de uma tarefa quando alguém pergunta dela.",
  },
  {
    id: "c_org_8",
    fator: "C",
    faceta: "organizacao",
    reverso: true,
    dimensaoDeMercado: "Planejamento",
    texto: "Meus prazos ficam mais na minha cabeça do que anotados.",
  },

  // ─── faceta: realização ──────────────────────────────────────────────
  {
    id: "c_rea_1",
    fator: "C",
    faceta: "realizacao",
    reverso: false,
    dimensaoDeMercado: "Foco em resultados",
    texto:
      "Eu refaço um trabalho que já está aceitável só pra deixar do jeito que considero certo.",
  },
  {
    id: "c_rea_2",
    fator: "C",
    faceta: "realizacao",
    reverso: true,
    dimensaoDeMercado: "Foco em resultados",
    texto: "Quando uma tarefa fica longa e chata, eu vou empurrando pra depois.",
  },
  {
    id: "c_rea_3",
    fator: "C",
    faceta: "realizacao",
    reverso: false,
    dimensaoDeMercado: "Foco em resultados",
    texto:
      "Eu me incomodo quando entrego algo abaixo do que sei que consigo fazer.",
  },
  {
    id: "c_rea_4",
    fator: "C",
    faceta: "realizacao",
    reverso: false,
    dimensaoDeMercado: "Foco em resultados",
    texto:
      "Eu sigo atrás do resultado mesmo quando o caminho fica mais difícil do que eu esperava.",
  },
  {
    id: "c_rea_5",
    fator: "C",
    faceta: "realizacao",
    reverso: false,
    dimensaoDeMercado: "Foco em resultados",
    texto:
      "Quando eu assumo uma meta, eu acompanho o número de perto até o fim do período.",
  },
  {
    id: "c_rea_6",
    fator: "C",
    faceta: "realizacao",
    reverso: true,
    dimensaoDeMercado: "Foco em resultados",
    texto: "Eu paro numa tarefa assim que ela fica boa o suficiente pra passar.",
  },
  {
    id: "c_rea_7",
    fator: "C",
    faceta: "realizacao",
    reverso: true,
    dimensaoDeMercado: "Foco em resultados",
    texto:
      "Quando o resultado exige esforço além do combinado, eu entrego o combinado e paro por aí.",
  },
  {
    id: "c_rea_8",
    fator: "C",
    faceta: "realizacao",
    reverso: true,
    dimensaoDeMercado: "Foco em resultados",
    texto: "Eu perco o interesse por um trabalho quando ele deixa de ser novidade.",
  },

  // ─── faceta: confiabilidade ──────────────────────────────────────────
  {
    id: "c_con_1",
    fator: "C",
    faceta: "confiabilidade",
    reverso: false,
    dimensaoDeMercado: "Planejamento",
    texto: "Quando eu combino um prazo, as pessoas podem contar que vou cumprir.",
  },
  {
    id: "c_con_2",
    fator: "C",
    faceta: "confiabilidade",
    reverso: true,
    dimensaoDeMercado: "Planejamento",
    texto:
      "Já aconteceu de eu esquecer de responder alguém e a pessoa precisar cobrar de novo.",
  },
  {
    id: "c_con_3",
    fator: "C",
    faceta: "confiabilidade",
    reverso: false,
    dimensaoDeMercado: "Planejamento",
    texto: "Se eu vejo que vou atrasar, eu aviso antes de o prazo chegar.",
  },
  {
    id: "c_con_4",
    fator: "C",
    faceta: "confiabilidade",
    reverso: false,
    dimensaoDeMercado: "Organização",
    texto: "Eu confiro o meu trabalho antes de entregar.",
  },
  {
    id: "c_con_5",
    fator: "C",
    faceta: "confiabilidade",
    reverso: false,
    dimensaoDeMercado: "Planejamento",
    texto: "As pessoas me pedem pra tocar o que não pode falhar.",
  },
  {
    id: "c_con_6",
    fator: "C",
    faceta: "confiabilidade",
    reverso: true,
    dimensaoDeMercado: "Organização",
    texto: "Eu confiro os detalhes só depois que alguém aponta um erro.",
  },
  {
    id: "c_con_7",
    fator: "C",
    faceta: "confiabilidade",
    reverso: true,
    par: "par_f",
    dimensaoDeMercado: "Planejamento",
    texto: "Eu prometo prazos que depois descubro que não cabem.",
  },
  {
    id: "c_con_8",
    fator: "C",
    faceta: "confiabilidade",
    reverso: true,
    par: "par_f",
    dimensaoDeMercado: "Planejamento",
    texto: "Eu aceito um prazo sem fazer a conta se ele cabe na minha semana.",
  },

  // ══════════════════════════════════════════════════════════════════════
  // E — ESTABILIDADE EMOCIONAL · Estabilidade sob Pressão
  // Medida no polo POSITIVO, nunca como neuroticismo (§2).
  // ══════════════════════════════════════════════════════════════════════

  // ─── faceta: serenidade ──────────────────────────────────────────────
  {
    id: "e_ser_1",
    fator: "E",
    faceta: "serenidade",
    reverso: true,
    par: "par_g",
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Um imprevisto no meio do dia me tira do sério.",
  },
  {
    id: "e_ser_2",
    fator: "E",
    faceta: "serenidade",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Em situação de correria, eu continuo pensando com clareza.",
  },
  {
    id: "e_ser_3",
    fator: "E",
    faceta: "serenidade",
    reverso: true,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Eu fico tenso antes de uma reunião importante.",
  },
  {
    id: "e_ser_4",
    fator: "E",
    faceta: "serenidade",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Quando alguém levanta a voz comigo no trabalho, eu mantenho o meu tom.",
  },
  {
    id: "e_ser_5",
    fator: "E",
    faceta: "serenidade",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Eu consigo deixar um problema do trabalho parado até a hora de tratar dele.",
  },
  {
    id: "e_ser_6",
    fator: "E",
    faceta: "serenidade",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Prazo apertado não muda o jeito como eu falo com as pessoas.",
  },
  {
    id: "e_ser_7",
    fator: "E",
    faceta: "serenidade",
    reverso: true,
    par: "par_g",
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Um dia cheio me deixa irritado com quem está por perto.",
  },
  {
    id: "e_ser_8",
    fator: "E",
    faceta: "serenidade",
    reverso: true,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Quando algo dá errado no trabalho, eu levo pro lado pessoal.",
  },

  // ─── faceta: resiliência ─────────────────────────────────────────────
  {
    id: "e_res_1",
    fator: "E",
    faceta: "resiliencia",
    reverso: true,
    par: "par_b",
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Quando recebo uma crítica, fico remoendo por horas.",
  },
  {
    id: "e_res_2",
    fator: "E",
    faceta: "resiliencia",
    reverso: false,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Depois de errar, eu volto rápido ao normal.",
  },
  {
    id: "e_res_3",
    fator: "E",
    faceta: "resiliencia",
    reverso: true,
    par: "par_b",
    dimensaoDeMercado: "Inteligência emocional",
    texto:
      "Uma crítica fica martelando na minha cabeça muito depois da conversa acabar.",
  },
  {
    id: "e_res_4",
    fator: "E",
    faceta: "resiliencia",
    reverso: false,
    dimensaoDeMercado: "Foco em resultados",
    texto: "Depois de ouvir um não, eu parto pra próxima tentativa no mesmo dia.",
  },
  {
    id: "e_res_5",
    fator: "E",
    faceta: "resiliencia",
    reverso: false,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Um projeto que não deu certo me ensina mais do que me abala.",
  },
  {
    id: "e_res_6",
    fator: "E",
    faceta: "resiliencia",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto:
      "Eu peço retorno sobre o meu trabalho mesmo sabendo que pode vir crítica.",
  },
  {
    id: "e_res_7",
    fator: "E",
    faceta: "resiliencia",
    reverso: true,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Quando um trabalho meu é recusado, eu demoro pra encostar nele de novo.",
  },
  {
    id: "e_res_8",
    fator: "E",
    faceta: "resiliencia",
    reverso: true,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Eu evito tarefas parecidas com aquelas em que já errei.",
  },

  // ─── faceta: autoconfiança ───────────────────────────────────────────
  {
    id: "e_aut_1",
    fator: "E",
    faceta: "autoconfianca",
    reverso: true,
    dimensaoDeMercado: "Liderança",
    texto: "Eu costumo achar que os outros dão conta melhor do que eu.",
  },
  {
    id: "e_aut_2",
    fator: "E",
    faceta: "autoconfianca",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu confio nas decisões que tomo, mesmo sem ter certeza total.",
  },
  {
    id: "e_aut_3",
    fator: "E",
    faceta: "autoconfianca",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu defendo minha posição quando alguém mais experiente discorda.",
  },
  {
    id: "e_aut_4",
    fator: "E",
    faceta: "autoconfianca",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu me candidato a trabalhos maiores do que os que já fiz.",
  },
  {
    id: "e_aut_5",
    fator: "E",
    faceta: "autoconfianca",
    reverso: false,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu apresento meu trabalho pra um grupo sem ficar remoendo antes.",
  },
  {
    id: "e_aut_6",
    fator: "E",
    faceta: "autoconfianca",
    reverso: true,
    dimensaoDeMercado: "Liderança",
    texto:
      "Antes de mandar algo importante, eu peço alguém revisar porque não confio no meu julgamento.",
  },
  {
    id: "e_aut_7",
    fator: "E",
    faceta: "autoconfianca",
    reverso: true,
    dimensaoDeMercado: "Liderança",
    texto: "Eu fico pensando se dou conta do cargo que ocupo.",
  },
  {
    id: "e_aut_8",
    fator: "E",
    faceta: "autoconfianca",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu deixo de dar minha opinião quando tem gente mais graduada na sala.",
  },

  // ══════════════════════════════════════════════════════════════════════
  // X — EXTROVERSÃO · Energia Social
  // ══════════════════════════════════════════════════════════════════════

  // ─── faceta: assertividade ───────────────────────────────────────────
  {
    id: "x_ass_1",
    fator: "X",
    faceta: "assertividade",
    reverso: false,
    dimensaoDeMercado: "Comunicação",
    texto: "Em reunião, eu sou uma das primeiras pessoas a falar.",
  },
  {
    id: "x_ass_2",
    fator: "X",
    faceta: "assertividade",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Quando discordo do grupo, prefiro deixar quieto.",
  },
  {
    id: "x_ass_3",
    fator: "X",
    faceta: "assertividade",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu assumo a frente quando percebo que ninguém está puxando.",
  },
  {
    id: "x_ass_4",
    fator: "X",
    faceta: "assertividade",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu peço o que preciso de outras áreas sem ficar esperando.",
  },
  {
    id: "x_ass_5",
    fator: "X",
    faceta: "assertividade",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu digo não quando o pedido não cabe na minha semana.",
  },
  {
    id: "x_ass_6",
    fator: "X",
    faceta: "assertividade",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu espero me chamarem pra dar minha opinião.",
  },
  {
    id: "x_ass_7",
    fator: "X",
    faceta: "assertividade",
    reverso: true,
    dimensaoDeMercado: "Liderança",
    texto: "Eu aceito um prazo apertado pra não abrir discussão.",
  },
  {
    id: "x_ass_8",
    fator: "X",
    faceta: "assertividade",
    reverso: true,
    dimensaoDeMercado: "Liderança",
    texto: "Quando preciso cobrar alguém, eu adio a conversa.",
  },

  // ─── faceta: sociabilidade ───────────────────────────────────────────
  {
    id: "x_soc_1",
    fator: "X",
    faceta: "sociabilidade",
    reverso: false,
    par: "par_c",
    dimensaoDeMercado: "Comunicação",
    texto: "Eu puxo conversa com pessoas que não conheço.",
  },
  {
    id: "x_soc_2",
    fator: "X",
    faceta: "sociabilidade",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu prefiro trabalhar sozinho a trabalhar em grupo.",
  },
  {
    id: "x_soc_3",
    fator: "X",
    faceta: "sociabilidade",
    reverso: false,
    par: "par_c",
    dimensaoDeMercado: "Comunicação",
    texto: "Numa sala cheia de desconhecidos, eu sou quem começa a conversa.",
  },
  {
    id: "x_soc_4",
    fator: "X",
    faceta: "sociabilidade",
    reverso: false,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu conheço gente de várias áreas da empresa pelo nome.",
  },
  {
    id: "x_soc_5",
    fator: "X",
    faceta: "sociabilidade",
    reverso: false,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu resolvo mais rápido indo falar com a pessoa do que por mensagem.",
  },
  {
    id: "x_soc_6",
    fator: "X",
    faceta: "sociabilidade",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Almoço com um grupo grande do trabalho me cansa.",
  },
  {
    id: "x_soc_7",
    fator: "X",
    faceta: "sociabilidade",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu evito confraternização de trabalho.",
  },
  {
    id: "x_soc_8",
    fator: "X",
    faceta: "sociabilidade",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Entre escrever e ligar, eu escolho escrever.",
  },

  // ─── faceta: entusiasmo ──────────────────────────────────────────────
  {
    id: "x_ent_1",
    fator: "X",
    faceta: "entusiasmo",
    reverso: false,
    dimensaoDeMercado: "Comunicação",
    texto: "As pessoas costumam dizer que eu tenho muita energia.",
  },
  {
    id: "x_ent_2",
    fator: "X",
    faceta: "entusiasmo",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "No trabalho, eu sou uma pessoa quieta.",
  },
  {
    id: "x_ent_3",
    fator: "X",
    faceta: "entusiasmo",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu chego animado numa reunião mesmo quando o assunto é difícil.",
  },
  {
    id: "x_ent_4",
    fator: "X",
    faceta: "entusiasmo",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu comemoro em voz alta quando o time entrega alguma coisa.",
  },
  {
    id: "x_ent_5",
    fator: "X",
    faceta: "entusiasmo",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Meu jeito costuma levantar o astral de quem está por perto.",
  },
  {
    id: "x_ent_6",
    fator: "X",
    faceta: "entusiasmo",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu falo pouco nas reuniões do time.",
  },
  {
    id: "x_ent_7",
    fator: "X",
    faceta: "entusiasmo",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu prefiro um dia de trabalho com pouca gente por perto.",
  },
  {
    id: "x_ent_8",
    fator: "X",
    faceta: "entusiasmo",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu demoro pra me soltar num grupo novo.",
  },

  // ══════════════════════════════════════════════════════════════════════
  // A — AMABILIDADE · Cooperação
  // Atenção de leitura: alta demais atrapalha negociação e cobrança. É o
  // exemplo canônico de dimensão de FAIXA ÓTIMA (§2.1).
  // ══════════════════════════════════════════════════════════════════════

  // ─── faceta: cooperação ──────────────────────────────────────────────
  {
    id: "a_coo_1",
    fator: "A",
    faceta: "cooperacao",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu abro mão do meu jeito de fazer pra não criar atrito.",
  },
  {
    id: "a_coo_2",
    fator: "A",
    faceta: "cooperacao",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu bato de frente quando tenho certeza de que estou certo.",
  },
  {
    id: "a_coo_3",
    fator: "A",
    faceta: "cooperacao",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu prefiro um acordo que sirva pros dois lados a ganhar a discussão.",
  },
  {
    id: "a_coo_4",
    fator: "A",
    faceta: "cooperacao",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu paro o que estou fazendo pra ajudar quem me pediu.",
  },
  {
    id: "a_coo_5",
    fator: "A",
    faceta: "cooperacao",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu divido o crédito de um resultado com quem participou.",
  },
  {
    id: "a_coo_6",
    fator: "A",
    faceta: "cooperacao",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Numa negociação, eu seguro minha posição até o outro lado ceder.",
  },
  {
    id: "a_coo_7",
    fator: "A",
    faceta: "cooperacao",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu digo o que penso mesmo sabendo que vai desagradar.",
  },
  {
    id: "a_coo_8",
    fator: "A",
    faceta: "cooperacao",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu prefiro decidir sozinho a ter que convencer o grupo.",
  },

  // ─── faceta: empatia ─────────────────────────────────────────────────
  {
    id: "a_emp_1",
    fator: "A",
    faceta: "empatia",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto:
      "Eu percebo quando um colega não está bem, mesmo que ele não fale nada.",
  },
  {
    id: "a_emp_2",
    fator: "A",
    faceta: "empatia",
    reverso: true,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Problema pessoal de colega não é assunto meu.",
  },
  {
    id: "a_emp_3",
    fator: "A",
    faceta: "empatia",
    reverso: false,
    dimensaoDeMercado: "Comunicação",
    texto:
      "Antes de responder, eu penso em como a pessoa vai receber o que eu disser.",
  },
  {
    id: "a_emp_4",
    fator: "A",
    faceta: "empatia",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Eu pergunto como a pessoa está antes de entrar no assunto.",
  },
  {
    id: "a_emp_5",
    fator: "A",
    faceta: "empatia",
    reverso: false,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Quando alguém erra, eu penso primeiro no que estava acontecendo com ela.",
  },
  {
    id: "a_emp_6",
    fator: "A",
    faceta: "empatia",
    reverso: true,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Eu acho que emoção atrapalha decisão de trabalho.",
  },
  {
    id: "a_emp_7",
    fator: "A",
    faceta: "empatia",
    reverso: true,
    dimensaoDeMercado: "Comunicação",
    texto: "Eu falo o que precisa ser dito sem me preocupar com a forma.",
  },
  {
    id: "a_emp_8",
    fator: "A",
    faceta: "empatia",
    reverso: true,
    dimensaoDeMercado: "Inteligência emocional",
    texto: "Eu me incomodo quando um colega traz assunto pessoal pro trabalho.",
  },

  // ─── faceta: confiança ───────────────────────────────────────────────
  {
    id: "a_con_1",
    fator: "A",
    faceta: "confianca",
    reverso: false,
    par: "par_d",
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu presumo que as pessoas estão agindo de boa-fé.",
  },
  {
    id: "a_con_2",
    fator: "A",
    faceta: "confianca",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu desconfio quando alguém é prestativo demais comigo.",
  },
  {
    id: "a_con_3",
    fator: "A",
    faceta: "confianca",
    reverso: false,
    dimensaoDeMercado: "Liderança",
    texto: "Eu passo uma tarefa adiante sem ficar conferindo o tempo todo.",
  },
  {
    id: "a_con_4",
    fator: "A",
    faceta: "confianca",
    reverso: false,
    par: "par_d",
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Quando alguém me explica um atraso, eu acredito no que a pessoa diz.",
  },
  {
    id: "a_con_5",
    fator: "A",
    faceta: "confianca",
    reverso: false,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu conto pros colegas o que está difícil no meu trabalho.",
  },
  {
    id: "a_con_6",
    fator: "A",
    faceta: "confianca",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu guardo registro das conversas caso precise me proteger depois.",
  },
  {
    id: "a_con_7",
    fator: "A",
    faceta: "confianca",
    reverso: true,
    dimensaoDeMercado: "Trabalho em equipe",
    texto: "Eu acho que a maioria das pessoas puxa a sardinha pro próprio lado.",
  },
  {
    id: "a_con_8",
    fator: "A",
    faceta: "confianca",
    reverso: true,
    dimensaoDeMercado: "Liderança",
    texto: "Eu refaço a conferência do trabalho dos outros antes de seguir com ele.",
  },

  // ══════════════════════════════════════════════════════════════════════
  // O — ABERTURA · Abertura ao Novo
  // ══════════════════════════════════════════════════════════════════════

  // ─── faceta: curiosidade ─────────────────────────────────────────────
  {
    id: "o_cur_1",
    fator: "O",
    faceta: "curiosidade",
    reverso: false,
    dimensaoDeMercado: "Resolução de problemas",
    texto: "Eu vou atrás de entender como as coisas funcionam por trás.",
  },
  {
    id: "o_cur_2",
    fator: "O",
    faceta: "curiosidade",
    reverso: true,
    dimensaoDeMercado: "Resolução de problemas",
    texto: "Eu prefiro aprender só o que preciso pro meu trabalho.",
  },
  {
    id: "o_cur_3",
    fator: "O",
    faceta: "curiosidade",
    reverso: false,
    dimensaoDeMercado: "Resolução de problemas",
    texto:
      "Eu leio ou assisto sobre assuntos que não têm nada a ver com minha função.",
  },
  {
    id: "o_cur_4",
    fator: "O",
    faceta: "curiosidade",
    reverso: false,
    dimensaoDeMercado: "Resolução de problemas",
    texto:
      "Diante de um problema novo, eu procuro a causa antes de aplicar a solução conhecida.",
  },
  {
    id: "o_cur_5",
    fator: "O",
    faceta: "curiosidade",
    reverso: false,
    dimensaoDeMercado: "Resolução de problemas",
    texto: "Eu faço perguntas até entender o porquê, não só o como.",
  },
  {
    id: "o_cur_6",
    fator: "O",
    faceta: "curiosidade",
    reverso: true,
    dimensaoDeMercado: "Resolução de problemas",
    texto: "Eu aplico a solução que já funcionou antes sem checar se ainda serve.",
  },
  {
    id: "o_cur_7",
    fator: "O",
    faceta: "curiosidade",
    reverso: true,
    dimensaoDeMercado: "Resolução de problemas",
    texto: "Estudar assunto que não cai no meu dia a dia é tempo perdido.",
  },
  {
    id: "o_cur_8",
    fator: "O",
    faceta: "curiosidade",
    reverso: true,
    dimensaoDeMercado: "Resolução de problemas",
    texto: "Quando alguém explica o contexto, eu prefiro pular pro que tenho que fazer.",
  },

  // ─── faceta: criatividade ────────────────────────────────────────────
  {
    id: "o_cri_1",
    fator: "O",
    faceta: "criatividade",
    reverso: false,
    dimensaoDeMercado: "Criatividade",
    texto: "Eu costumo sugerir formas diferentes de fazer o que já é feito.",
  },
  {
    id: "o_cri_2",
    fator: "O",
    faceta: "criatividade",
    reverso: true,
    par: "par_e",
    dimensaoDeMercado: "Criatividade",
    texto: "Se o jeito atual funciona, não vejo motivo pra mudar.",
  },
  {
    id: "o_cri_3",
    fator: "O",
    faceta: "criatividade",
    reverso: false,
    dimensaoDeMercado: "Criatividade",
    texto: "Eu tenho ideias que as pessoas acham fora do óbvio.",
  },
  {
    id: "o_cri_4",
    fator: "O",
    faceta: "criatividade",
    reverso: false,
    dimensaoDeMercado: "Criatividade",
    texto: "Eu misturo coisas de contextos diferentes pra resolver um problema.",
  },
  {
    id: "o_cri_5",
    fator: "O",
    faceta: "criatividade",
    reverso: false,
    dimensaoDeMercado: "Criatividade",
    texto: "Eu proponho testar uma ideia antes de ter certeza de que ela funciona.",
  },
  {
    id: "o_cri_6",
    fator: "O",
    faceta: "criatividade",
    reverso: true,
    par: "par_e",
    dimensaoDeMercado: "Criatividade",
    texto: "Eu prefiro seguir o modelo que já existe a inventar um novo.",
  },
  {
    id: "o_cri_7",
    fator: "O",
    faceta: "criatividade",
    reverso: true,
    dimensaoDeMercado: "Criatividade",
    texto: "Ideia sem exemplo de que já deu certo em outro lugar não me convence.",
  },
  {
    id: "o_cri_8",
    fator: "O",
    faceta: "criatividade",
    reverso: true,
    dimensaoDeMercado: "Criatividade",
    texto: "Com o processo já definido, procurar jeito novo só atrapalha.",
  },

  // ─── faceta: flexibilidade ───────────────────────────────────────────
  {
    id: "o_fle_1",
    fator: "O",
    faceta: "flexibilidade",
    reverso: false,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Mudança de planos no meio do caminho não me incomoda.",
  },
  {
    id: "o_fle_2",
    fator: "O",
    faceta: "flexibilidade",
    reverso: true,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Eu trabalho melhor quando sei exatamente o que esperar.",
  },
  {
    id: "o_fle_3",
    fator: "O",
    faceta: "flexibilidade",
    reverso: false,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Eu pego o jeito de uma ferramenta nova rápido.",
  },
  {
    id: "o_fle_4",
    fator: "O",
    faceta: "flexibilidade",
    reverso: false,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Eu mudo de opinião quando aparece informação nova.",
  },
  {
    id: "o_fle_5",
    fator: "O",
    faceta: "flexibilidade",
    reverso: false,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Trabalhar com regras que ainda estão sendo definidas não me trava.",
  },
  {
    id: "o_fle_6",
    fator: "O",
    faceta: "flexibilidade",
    reverso: true,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Eu fico incomodado quando mudam minha rotina de trabalho.",
  },
  {
    id: "o_fle_7",
    fator: "O",
    faceta: "flexibilidade",
    reverso: true,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Eu preciso do procedimento escrito pra me sentir seguro.",
  },
  {
    id: "o_fle_8",
    fator: "O",
    faceta: "flexibilidade",
    reverso: true,
    dimensaoDeMercado: "Adaptabilidade",
    texto: "Troca de prioridade no meio da semana me desmonta.",
  },

  // ══════════════════════════════════════════════════════════════════════
  // D — DESEJABILIDADE SOCIAL
  //
  // Não entram em NENHUM escore de fator. Alimentam só o Índice de Confiança
  // (§5.1). São afirmações positivas mas improvavelmente verdadeiras para
  // qualquer pessoa: concordar com todas é o sinal, não a virtude.
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "d_1",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu nunca me irritei com um colega de trabalho.",
  },
  {
    id: "d_2",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu nunca cheguei atrasado a um compromisso de trabalho.",
  },
  {
    id: "d_3",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu admito todos os meus erros na hora, sem exceção.",
  },
  {
    id: "d_4",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu nunca comentei nada sobre alguém pelas costas.",
  },
  {
    id: "d_5",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu nunca reclamei do trabalho com ninguém.",
  },
  {
    id: "d_6",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu escuto todas as opiniões com a mesma atenção, sem exceção.",
  },
  {
    id: "d_7",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu nunca fiquei incomodado com uma decisão da empresa.",
  },
  {
    id: "d_8",
    fator: "D",
    faceta: "desejabilidade",
    reverso: false,
    texto: "Eu trato todo mundo exatamente da mesma forma, em qualquer dia.",
  },
];

/** Índice por id, para leitura O(1) na escoragem. */
export const ITEM_POR_ID = new Map(ITENS.map((i) => [i.id, i]));

export const itensDoFator = (fator: string) =>
  ITENS.filter((i) => i.fator === fator);

/** Pares de consistência declarados no banco (§5.2). */
export const PARES_DE_CONSISTENCIA = (() => {
  const mapa = new Map<string, string[]>();
  for (const item of ITENS) {
    if (!item.par) continue;
    mapa.set(item.par, [...(mapa.get(item.par) ?? []), item.id]);
  }
  return [...mapa.entries()].map(([id, itens]) => ({ id, itens }));
})();
