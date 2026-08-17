import type { ResultadoEstiloEmocional } from "./baterias";

export const INSTRUCAO_ESTILO_EMOCIONAL = "Responda Verdadeiro ou Falso conforme cada frase descreve você na maior parte do tempo. Não há resposta certa ou errada.";
export type DimensaoEstiloEmocional = "RESILIENCIA" | "ATITUDE" | "INTUICAO_SOCIAL" | "AUTOPERCEPCAO" | "SENSIBILIDADE_CONTEXTO" | "ATENCAO";
export type ItemEstiloEmocional = { id: string; texto: string; esperado: boolean; dimensao: DimensaoEstiloEmocional };
export const DIMENSOES_ESTILO_EMOCIONAL = [
  {
    "id": "RESILIENCIA",
    "nome": "Resiliência"
  },
  {
    "id": "ATITUDE",
    "nome": "Atitude"
  },
  {
    "id": "INTUICAO_SOCIAL",
    "nome": "Intuição social"
  },
  {
    "id": "AUTOPERCEPCAO",
    "nome": "Autopercepção"
  },
  {
    "id": "SENSIBILIDADE_CONTEXTO",
    "nome": "Sensibilidade ao contexto"
  },
  {
    "id": "ATENCAO",
    "nome": "Atenção"
  }
] as const;
const ITENS_POR_DIMENSAO = [
  {
    "id": "RESILIENCIA",
    "nome": "Resiliência",
    "itens": [
      {
        "id": "emocao-resiliencia-01",
        "texto": "Se tenho uma discussão boba com um amigo próximo ou com meu parceiro, isso me deixa mal-humorado durante horas, ou por mais tempo até.",
        "esperado": true
      },
      {
        "id": "emocao-resiliencia-02",
        "texto": "Se outro motorista usa o acostamento para furar uma longa fila no engarrafamento, costumo superar a raiva com facilidade, em vez de ficar enfezado por muito tempo.",
        "esperado": false
      },
      {
        "id": "emocao-resiliencia-03",
        "texto": "Nas vezes em que vivenciei um sofrimento profundo, como a morte de uma pessoa querida, isso interferiu na minha capacidade de agir normalmente durante muitos meses.",
        "esperado": true
      },
      {
        "id": "emocao-resiliencia-04",
        "texto": "Se cometo um erro no trabalho e sou repreendido, consigo deixar o acontecimento para trás e enxergá-lo como uma experiência de aprendizado.",
        "esperado": false
      },
      {
        "id": "emocao-resiliencia-05",
        "texto": "Se vou a um restaurante que ainda não conheço e descubro que a comida é horrível e o serviço, ruim, isso estraga toda a minha noite.",
        "esperado": true
      },
      {
        "id": "emocao-resiliencia-06",
        "texto": "Se, por causa de um acidente, fico preso no trânsito, quando deixo o engarrafamento para trás costumo pisar fundo no acelerador a fim de descarregar minha frustração, mas continuo fervilhando por dentro.",
        "esperado": true
      },
      {
        "id": "emocao-resiliencia-07",
        "texto": "Se o aquecedor de água da minha casa pifa, isso não afeta muito meu humor, pois sei  que para consertá-lo basta chamar um encanador.",
        "esperado": false
      },
      {
        "id": "emocao-resiliencia-08",
        "texto": "Se recebo um “não” depois de perguntar a um homem/mulher que conheço se ele/ela gostaria de me encontrar outra vez, fico de mau humor durante horas ou mesmo dias.",
        "esperado": true
      },
      {
        "id": "emocao-resiliencia-09",
        "texto": "Se sou candidato a um prêmio importante ou uma promoção no trabalho e outra pessoa, que considero menos qualificada, é quem o/a recebe, geralmente supero depressa a frustração.",
        "esperado": false
      },
      {
        "id": "emocao-resiliencia-10",
        "texto": "Em uma festa, se estou conversando com uma pessoa interessante e me vejo completamente sem palavras quando ela faz uma pergunta sobre mim, depois fico repassando mentalmente a conversa – porém pensando no que eu deveria ter dito – durante horas ou mesmo dias.",
        "esperado": true
      }
    ]
  },
  {
    "id": "ATITUDE",
    "nome": "Atitude",
    "itens": [
      {
        "id": "emocao-atitude-01",
        "texto": "Quando sou convidado a conhecer novas pessoas, fico animado, pensando na possibilidade de fazer novos amigos, em vez de encarar a situação como uma obrigação, imaginando que não valerá a pena.",
        "esperado": true
      },
      {
        "id": "emocao-atitude-02",
        "texto": "Ao avaliar um colega de trabalho, eu me concentro nos detalhes que ele precisa  melhorar, em vez de pensar em seu desempenho geral positivo.",
        "esperado": true
      },
      {
        "id": "emocao-atitude-03",
        "texto": "Acredito que os próximos 10 anos serão melhores que os últimos 10.",
        "esperado": true
      },
      {
        "id": "emocao-atitude-04",
        "texto": "Diante da possibilidade de me mudar para uma nova cidade, encaro a situação como um passo assustador rumo ao desconhecido.",
        "esperado": false
      },
      {
        "id": "emocao-atitude-05",
        "texto": "Mesmo que eu tenha uma pequena alegria inesperada pela manhã – por exemplo, uma ótima conversa com um estranho –, o bom humor provocado pela surpresa desaparece em poucos minutos.",
        "esperado": false
      },
      {
        "id": "emocao-atitude-06",
        "texto": "Quando vou a uma festa e me sinto bem no início, a sensação positiva tende a se manter ao longo de toda a noite.",
        "esperado": true
      },
      {
        "id": "emocao-atitude-07",
        "texto": "Cenas visualmente bonitas, como um pôr do sol maravilhoso, tendem a perder a graça com rapidez, de modo que logo fico entediado.",
        "esperado": false
      },
      {
        "id": "emocao-atitude-08",
        "texto": "Pela manhã, consigo pensar numa atividade agradável que planejei, e o bom humor que isso me causa se prolonga pelo dia inteiro.",
        "esperado": true
      },
      {
        "id": "emocao-atitude-09",
        "texto": "Quando vou a um museu ou assisto a um concerto, os primeiro minutos são muito agradáveis, mas essa sensação não dura muito.",
        "esperado": false
      },
      {
        "id": "emocao-atitude-10",
        "texto": "Mesmo nos dias agitados, passo de um evento ao seguinte sem me sentir cansado.",
        "esperado": true
      }
    ]
  },
  {
    "id": "INTUICAO_SOCIAL",
    "nome": "Intuição social",
    "itens": [
      {
        "id": "emocao-intuicao_social-01",
        "texto": "Quando converso com alguém, costumo notar sinais sutis das emoções de meu interlocutor – desconforto ou raiva, por exemplo – antes que ele me diga o que está sentindo.",
        "esperado": true
      },
      {
        "id": "emocao-intuicao_social-02",
        "texto": "Muitas vezes me pego reparando nas expressões faciais e na linguagem corporal das pessoas.",
        "esperado": true
      },
      {
        "id": "emocao-intuicao_social-03",
        "texto": "Para mim não faz muita diferença se converso com alguém ao telefone ou pessoalmente, pois não costumo captar informações adicionais ao ver a pessoa com quem estou falando.",
        "esperado": false
      },
      {
        "id": "emocao-intuicao_social-04",
        "texto": "Com frequência sinto que sei mais sobre os verdadeiros sentimentos das pessoas do que elas próprias.",
        "esperado": true
      },
      {
        "id": "emocao-intuicao_social-05",
        "texto": "Muitas vezes sou pego de surpresa quando alguém com quem estou conversando fica bravo ou magoado, sem razão aparente, com algo que eu disse.",
        "esperado": false
      },
      {
        "id": "emocao-intuicao_social-06",
        "texto": "Em um restaurante, prefiro me sentar ao lado da pessoa com quem estou, assim não preciso ver seu rosto de frente.",
        "esperado": false
      },
      {
        "id": "emocao-intuicao_social-07",
        "texto": "Muitas vezes me pego reagindo ao desconforto ou ao sofrimento de outra pessoa com base numa sensação intuitiva, e não numa conversa explícita.",
        "esperado": true
      },
      {
        "id": "emocao-intuicao_social-08",
        "texto": "Quando estou em lugares públicos e não tenho nada que fazer, gosto de observar as pessoas ao meu redor.",
        "esperado": true
      },
      {
        "id": "emocao-intuicao_social-09",
        "texto": "Sinto-me desconfortável quando uma pessoa que mal conheço me encara durante uma conversa.",
        "esperado": false
      },
      {
        "id": "emocao-intuicao_social-10",
        "texto": "Muitas vezes, basta-me olhar para outra pessoa para saber que algo a está incomodando.",
        "esperado": true
      }
    ]
  },
  {
    "id": "AUTOPERCEPCAO",
    "nome": "Autopercepção",
    "itens": [
      {
        "id": "emocao-autopercepcao-01",
        "texto": "Muitas vezes, quando alguém me pergunta por que estou tão irritado ou triste, respondo (ou penso comigo mesmo): “Mas não estou!”",
        "esperado": false
      },
      {
        "id": "emocao-autopercepcao-02",
        "texto": "Quando as pessoas mais próximas a mim perguntam por que tratei alguém de forma tão rude ou grosseira, muitas vezes discordo delas, acreditando que sua avaliação de meu comportamento está equivocada.",
        "esperado": false
      },
      {
        "id": "emocao-autopercepcao-03",
        "texto": "Com frequência percebo que meu coração está batendo acelerado, mas não sei por que isso está acontecendo.",
        "esperado": false
      },
      {
        "id": "emocao-autopercepcao-04",
        "texto": "Quando vejo uma pessoa sofrendo, também sinto essa dor, tanto emocional como fisicamente.",
        "esperado": true
      },
      {
        "id": "emocao-autopercepcao-05",
        "texto": "Geralmente percebo como estou me sentindo de forma tão precisa que consigo descrever minhas emoções.",
        "esperado": true
      },
      {
        "id": "emocao-autopercepcao-06",
        "texto": "Às vezes noto dores e incômodos e não sei de onde vieram.",
        "esperado": false
      },
      {
        "id": "emocao-autopercepcao-07",
        "texto": "Gosto de passar algum tempo tranquilo e relaxado, apenas sentindo o que está acontecendo dentro de mim.",
        "esperado": true
      },
      {
        "id": "emocao-autopercepcao-08",
        "texto": "Sinto-me em harmonia com meu corpo e me relaciono com ele de forma confortável e espontânea.",
        "esperado": true
      },
      {
        "id": "emocao-autopercepcao-09",
        "texto": "Sinto-me fortemente orientado para o mundo exterior e poucas vezes percebo o que está acontecendo em meu corpo.",
        "esperado": false
      },
      {
        "id": "emocao-autopercepcao-10",
        "texto": "Quando faço um exercício, sou muito sensível às mudanças que a atividade provoca em meu corpo.",
        "esperado": true
      }
    ]
  },
  {
    "id": "SENSIBILIDADE_CONTEXTO",
    "nome": "Sensibilidade ao contexto",
    "itens": [
      {
        "id": "emocao-sensibilidade_contexto-01",
        "texto": "Uma pessoa próxima disse que costumo ser insensível aos sentimentos dos outros.",
        "esperado": true
      },
      {
        "id": "emocao-sensibilidade_contexto-02",
        "texto": "Algumas vezes já me disseram que me comportei de maneira socialmente inadequada e fiquei surpreso com isso.",
        "esperado": false
      },
      {
        "id": "emocao-sensibilidade_contexto-03",
        "texto": "Já tive problemas no trabalho ou desentendimentos com amigos por me comportar de modo íntimo demais com um superior ou alegre demais com um bom amigo que estava magoado.",
        "esperado": false
      },
      {
        "id": "emocao-sensibilidade_contexto-04",
        "texto": "Quando converso com as pessoas, elas às vezes se afastam um pouco, aumentando a distância ente nós.",
        "esperado": false
      },
      {
        "id": "emocao-sensibilidade_contexto-05",
        "texto": "Frequentemente me pego censurando o que eu estava prestes a dizer, por sentir que algo naquela situação tornaria minhas palavras inadequadas (por exemplo, antes de responder à pergunta: “Querido, esta calça me deixa gorda?”).",
        "esperado": true
      },
      {
        "id": "emocao-sensibilidade_contexto-06",
        "texto": "Quando estou num ambiente público, como em um restaurante, sei regular muito bem o volume da minha voz.",
        "esperado": true
      },
      {
        "id": "emocao-sensibilidade_contexto-07",
        "texto": "Já me disseram muitas vezes, quando eu estava em local público, que deveria evitar citar os nomes de pessoas que estivessem por perto.",
        "esperado": false
      },
      {
        "id": "emocao-sensibilidade_contexto-08",
        "texto": "Quase sempre reconheço lugares em que já estive, mesmo que muitos anos atrás.",
        "esperado": true
      },
      {
        "id": "emocao-sensibilidade_contexto-09",
        "texto": "Percebo quando uma pessoa está se comportando de maneira inapropriada, como quando alguém está descontraído demais no trabalho.",
        "esperado": true
      },
      {
        "id": "emocao-sensibilidade_contexto-10",
        "texto": "Uma pessoa próxima já me disse que tenho boas maneiras ao lidar com estranhos em situações novas.",
        "esperado": true
      }
    ]
  },
  {
    "id": "ATENCAO",
    "nome": "Atenção",
    "itens": [
      {
        "id": "emocao-atencao-01",
        "texto": "Consigo me concentrar em um ambiente barulhento.",
        "esperado": true
      },
      {
        "id": "emocao-atencao-02",
        "texto": "Quando há muitas coisas acontecendo à minha volta e uma grande quantidade de estímulos sensoriais, como numa festa ou num aeroporto tumultuado, consigo não me perder em pensamentos sobre o que quer que eu esteja vendo.",
        "esperado": true
      },
      {
        "id": "emocao-atencao-03",
        "texto": "Se eu decidir concentrar minha atenção numa tarefa específica, quase sempre consigo.",
        "esperado": true
      },
      {
        "id": "emocao-atencao-04",
        "texto": "Quando tento trabalhar em casa, o som da televisão ou de outras pessoas me distrai muito.",
        "esperado": false
      },
      {
        "id": "emocao-atencao-05",
        "texto": "Se eu ficar sentado tranquilamente por uns poucos momentos, uma torrente de pensamentos invade minha mente e logo estou seguindo vários raciocínios, sem nem sequer saber onde cada um deles começou.",
        "esperado": false
      },
      {
        "id": "emocao-atencao-06",
        "texto": "Se eu me distrair com algum evento inesperado, consigo voltar a me concentrar no que estava fazendo.",
        "esperado": true
      },
      {
        "id": "emocao-atencao-07",
        "texto": "Durante períodos de relativa tranquilidade, como quando estou sentado em um trem ou\nônibus, ou esperando em uma fila, noto muito do que acontece ao meu redor.",
        "esperado": true
      },
      {
        "id": "emocao-atencao-08",
        "texto": "Quando me dedico a um projeto importante que requer toda a minha atenção, tento trabalhar no lugar mais calmo que eu consiga encontrar.",
        "esperado": false
      },
      {
        "id": "emocao-atencao-09",
        "texto": "Minha atenção tende a ser atraída por estímulos e eventos do ambiente e, uma vez que isso acontece, tenho dificuldade em me desligar deles.",
        "esperado": false
      },
      {
        "id": "emocao-atencao-10",
        "texto": "Tenho facilidade em conversar com uma pessoa numa situação em que haja muita gente ao redor, como numa festa ou no escritório; consigo me desligar dos outros em ambientes assim, mesmo quando, concentrando-me, consigo distinguir o que estão dizendo.",
        "esperado": true
      }
    ]
  }
] as const;
export const ITENS_ESTILO_EMOCIONAL: readonly ItemEstiloEmocional[] = ITENS_POR_DIMENSAO.flatMap((dimensao) => dimensao.itens.map((item) => ({ ...item, dimensao: dimensao.id })));
export const ITEM_ESTILO_EMOCIONAL_POR_ID = new Map(ITENS_ESTILO_EMOCIONAL.map((item) => [item.id, item]));
export const TOTAL_DE_ITENS_ESTILO_EMOCIONAL = ITENS_ESTILO_EMOCIONAL.length;
export const OPCOES_ESTILO_EMOCIONAL = [{ id: "verdadeiro", texto: "Verdadeiro" }, { id: "falso", texto: "Falso" }] as const;
export function pontuarEstiloEmocional(respostas: Array<{ itemId: string; alternativaId: string }>): ResultadoEstiloEmocional {
  const pontos = Object.fromEntries(DIMENSOES_ESTILO_EMOCIONAL.map((d) => [d.id, 0])) as ResultadoEstiloEmocional["pontos"];
  for (const resposta of respostas) { const item = ITEM_ESTILO_EMOCIONAL_POR_ID.get(resposta.itemId); if (!item) continue; const valor = resposta.alternativaId === "verdadeiro"; if (valor === item.esperado) pontos[item.dimensao] += 1; }
  const percentuais = Object.fromEntries(Object.entries(pontos).map(([dimensao, total]) => [dimensao, total * 10])) as ResultadoEstiloEmocional["percentuais"];
  return { teste: "ESTILO_EMOCIONAL", pontos, percentuais };
}
