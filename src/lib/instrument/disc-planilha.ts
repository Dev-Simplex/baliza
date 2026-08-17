import type { DimensaoDisc, ResultadoDisc } from "./baterias";
import { criarAleatorio, embaralhar } from "./form";

export const INSTRUCAO_DISC_PLANILHA = "Em cada tela, escolha a alternativa que mais combina com você. Não há resposta certa ou errada; responda com sinceridade.";

export type BlocoDiscPlanilha = { id: string; pergunta: string; opcoes: Array<{ id: string; dimensao: DimensaoDisc; texto: string }> };

export const BLOCOS_DISC_PLANILHA: readonly BlocoDiscPlanilha[] = [
  {
    "id": "disc25-b01",
    "pergunta": "Eu sou...",
    "opcoes": [
      {
        "id": "disc25-b01-a",
        "dimensao": "S",
        "texto": "Idealista, criativo e visionário"
      },
      {
        "id": "disc25-b01-b",
        "dimensao": "I",
        "texto": "Divertido, espiritual e benéfico"
      },
      {
        "id": "disc25-b01-c",
        "dimensao": "C",
        "texto": "Confiável, meticuloso e previsível"
      },
      {
        "id": "disc25-b01-d",
        "dimensao": "D",
        "texto": "Focado, determinado e persistente"
      }
    ]
  },
  {
    "id": "disc25-b02",
    "pergunta": "Eu gosto de...",
    "opcoes": [
      {
        "id": "disc25-b02-a",
        "dimensao": "D",
        "texto": "Ser piloto"
      },
      {
        "id": "disc25-b02-b",
        "dimensao": "I",
        "texto": "Conversar com os passageiros"
      },
      {
        "id": "disc25-b02-c",
        "dimensao": "C",
        "texto": "Planejar a viagem"
      },
      {
        "id": "disc25-b02-d",
        "dimensao": "S",
        "texto": "Explorar novas rotas"
      }
    ]
  },
  {
    "id": "disc25-b03",
    "pergunta": "Se você quiser se dar bem comigo...",
    "opcoes": [
      {
        "id": "disc25-b03-a",
        "dimensao": "S",
        "texto": "Me dê liberdade"
      },
      {
        "id": "disc25-b03-b",
        "dimensao": "C",
        "texto": "Me deixe saber sua expectativa"
      },
      {
        "id": "disc25-b03-c",
        "dimensao": "D",
        "texto": "Lidere, ou saia do caminho"
      },
      {
        "id": "disc25-b03-d",
        "dimensao": "I",
        "texto": "Seja amigável, carinhoso e compreensivo"
      }
    ]
  },
  {
    "id": "disc25-b04",
    "pergunta": "Para conseguir obter bons resultados é preciso...",
    "opcoes": [
      {
        "id": "disc25-b04-a",
        "dimensao": "S",
        "texto": "Ter incertezas"
      },
      {
        "id": "disc25-b04-b",
        "dimensao": "C",
        "texto": "Controlar o essencial"
      },
      {
        "id": "disc25-b04-c",
        "dimensao": "I",
        "texto": "Diversão e celebração"
      },
      {
        "id": "disc25-b04-d",
        "dimensao": "D",
        "texto": "Planejar e obter recursos"
      }
    ]
  },
  {
    "id": "disc25-b05",
    "pergunta": "Eu me divirto quando...",
    "opcoes": [
      {
        "id": "disc25-b05-a",
        "dimensao": "D",
        "texto": "Estou me exercitando"
      },
      {
        "id": "disc25-b05-b",
        "dimensao": "S",
        "texto": "Tenho novidades"
      },
      {
        "id": "disc25-b05-c",
        "dimensao": "I",
        "texto": "Estou com os outros"
      },
      {
        "id": "disc25-b05-d",
        "dimensao": "C",
        "texto": "Determino as regras"
      }
    ]
  },
  {
    "id": "disc25-b06",
    "pergunta": "Eu penso que...",
    "opcoes": [
      {
        "id": "disc25-b06-a",
        "dimensao": "I",
        "texto": "Unidos venceremos, divididos perderemos"
      },
      {
        "id": "disc25-b06-b",
        "dimensao": "D",
        "texto": "O ataque é a melhor que a defesa"
      },
      {
        "id": "disc25-b06-c",
        "dimensao": "S",
        "texto": "É bom ser manso, mas andar com um porrete"
      },
      {
        "id": "disc25-b06-d",
        "dimensao": "C",
        "texto": "Um homem prevenido vale por dois"
      }
    ]
  },
  {
    "id": "disc25-b07",
    "pergunta": "Minha preocupação é...",
    "opcoes": [
      {
        "id": "disc25-b07-a",
        "dimensao": "S",
        "texto": "Gerar a ideia global"
      },
      {
        "id": "disc25-b07-b",
        "dimensao": "I",
        "texto": "Fazer com que as pessoas gostem"
      },
      {
        "id": "disc25-b07-c",
        "dimensao": "C",
        "texto": "Fazer com que funcione"
      },
      {
        "id": "disc25-b07-d",
        "dimensao": "D",
        "texto": "Fazer com que aconteça"
      }
    ]
  },
  {
    "id": "disc25-b08",
    "pergunta": "Eu prefiro...",
    "opcoes": [
      {
        "id": "disc25-b08-a",
        "dimensao": "S",
        "texto": "Perguntas a respostas"
      },
      {
        "id": "disc25-b08-b",
        "dimensao": "C",
        "texto": "Ter todos os detalhes"
      },
      {
        "id": "disc25-b08-c",
        "dimensao": "D",
        "texto": "Vantagens a seu favor"
      },
      {
        "id": "disc25-b08-d",
        "dimensao": "I",
        "texto": "Que todos tenham a chance de serem ouvidos"
      }
    ]
  },
  {
    "id": "disc25-b09",
    "pergunta": "Eu gosto de...",
    "opcoes": [
      {
        "id": "disc25-b09-a",
        "dimensao": "D",
        "texto": "Fazer progresso"
      },
      {
        "id": "disc25-b09-b",
        "dimensao": "S",
        "texto": "Construir memórias"
      },
      {
        "id": "disc25-b09-c",
        "dimensao": "C",
        "texto": "Fazer sentido"
      },
      {
        "id": "disc25-b09-d",
        "dimensao": "I",
        "texto": "Tornar as pessoas confortáveis"
      }
    ]
  },
  {
    "id": "disc25-b10",
    "pergunta": "Eu gosto de chegar...",
    "opcoes": [
      {
        "id": "disc25-b10-a",
        "dimensao": "D",
        "texto": "Na frente"
      },
      {
        "id": "disc25-b10-b",
        "dimensao": "I",
        "texto": "Junto"
      },
      {
        "id": "disc25-b10-c",
        "dimensao": "C",
        "texto": "Na hora"
      },
      {
        "id": "disc25-b10-d",
        "dimensao": "S",
        "texto": "Em outro lugar"
      }
    ]
  },
  {
    "id": "disc25-b11",
    "pergunta": "Um ótimo dia para mim é quando...",
    "opcoes": [
      {
        "id": "disc25-b11-a",
        "dimensao": "D",
        "texto": "Consigo fazer muitas coisas"
      },
      {
        "id": "disc25-b11-b",
        "dimensao": "I",
        "texto": "Me divirto com meus amigos"
      },
      {
        "id": "disc25-b11-c",
        "dimensao": "S",
        "texto": "Tudo segue conforme planejado"
      },
      {
        "id": "disc25-b11-d",
        "dimensao": "C",
        "texto": "Desfruto de coisas novas e estimulantes"
      }
    ]
  },
  {
    "id": "disc25-b12",
    "pergunta": "Eu vejo a morte como...",
    "opcoes": [
      {
        "id": "disc25-b12-a",
        "dimensao": "S",
        "texto": "Uma grande aventura misteriosa"
      },
      {
        "id": "disc25-b12-b",
        "dimensao": "I",
        "texto": "Oportunidade para rever os falecidos"
      },
      {
        "id": "disc25-b12-c",
        "dimensao": "C",
        "texto": "Um modo de receber recompensas"
      },
      {
        "id": "disc25-b12-d",
        "dimensao": "D",
        "texto": "Algo que sempre chega muito cedo"
      }
    ]
  },
  {
    "id": "disc25-b13",
    "pergunta": "Minha filosofia de vida é...",
    "opcoes": [
      {
        "id": "disc25-b13-a",
        "dimensao": "D",
        "texto": "Há ganhadores e perdedores, e eu acredito ser um ganhador"
      },
      {
        "id": "disc25-b13-b",
        "dimensao": "I",
        "texto": "Para eu ganhar, ninguém precisa perder"
      },
      {
        "id": "disc25-b13-c",
        "dimensao": "C",
        "texto": "Para ganhar é preciso seguir as regras"
      },
      {
        "id": "disc25-b13-d",
        "dimensao": "S",
        "texto": "Para ganhar, é necessário inventar novas regras"
      }
    ]
  },
  {
    "id": "disc25-b14",
    "pergunta": "Eu sempre gostei de...",
    "opcoes": [
      {
        "id": "disc25-b14-a",
        "dimensao": "S",
        "texto": "Explorar"
      },
      {
        "id": "disc25-b14-b",
        "dimensao": "C",
        "texto": "Evitar surpresas"
      },
      {
        "id": "disc25-b14-c",
        "dimensao": "D",
        "texto": "Focalizar a meta"
      },
      {
        "id": "disc25-b14-d",
        "dimensao": "I",
        "texto": "Realizar uma abordagem natural"
      }
    ]
  },
  {
    "id": "disc25-b15",
    "pergunta": "Eu gosto de mudanças se...",
    "opcoes": [
      {
        "id": "disc25-b15-a",
        "dimensao": "D",
        "texto": "Me der uma vantagem competitiva"
      },
      {
        "id": "disc25-b15-b",
        "dimensao": "I",
        "texto": "For divertido e puder ser compartilhado"
      },
      {
        "id": "disc25-b15-c",
        "dimensao": "S",
        "texto": "Me der mais liberdade e variedade"
      },
      {
        "id": "disc25-b15-d",
        "dimensao": "C",
        "texto": "Melhorar ou me der mais controle"
      }
    ]
  },
  {
    "id": "disc25-b16",
    "pergunta": "Não existe nada de errado em...",
    "opcoes": [
      {
        "id": "disc25-b16-a",
        "dimensao": "D",
        "texto": "Se colocar na frente"
      },
      {
        "id": "disc25-b16-b",
        "dimensao": "I",
        "texto": "Colocar os outros na frente"
      },
      {
        "id": "disc25-b16-c",
        "dimensao": "S",
        "texto": "Mudar de ideia"
      },
      {
        "id": "disc25-b16-d",
        "dimensao": "C",
        "texto": "Ser consistente"
      }
    ]
  },
  {
    "id": "disc25-b17",
    "pergunta": "Eu gosto de buscar conselhos de...",
    "opcoes": [
      {
        "id": "disc25-b17-a",
        "dimensao": "D",
        "texto": "Pessoas bem-sucedidas"
      },
      {
        "id": "disc25-b17-b",
        "dimensao": "I",
        "texto": "Anciões e conselheiros"
      },
      {
        "id": "disc25-b17-c",
        "dimensao": "C",
        "texto": "Autoridades no assunto"
      },
      {
        "id": "disc25-b17-d",
        "dimensao": "S",
        "texto": "Lugares, os mais estranhos"
      }
    ]
  },
  {
    "id": "disc25-b18",
    "pergunta": "Meu lema é...",
    "opcoes": [
      {
        "id": "disc25-b18-a",
        "dimensao": "S",
        "texto": "Fazer o que precisa ser feito"
      },
      {
        "id": "disc25-b18-b",
        "dimensao": "C",
        "texto": "Fazer bem feito"
      },
      {
        "id": "disc25-b18-c",
        "dimensao": "I",
        "texto": "Fazer junto com o grupo"
      },
      {
        "id": "disc25-b18-d",
        "dimensao": "D",
        "texto": "Simplesmente fazer"
      }
    ]
  },
  {
    "id": "disc25-b19",
    "pergunta": "Eu gosto de...",
    "opcoes": [
      {
        "id": "disc25-b19-a",
        "dimensao": "S",
        "texto": "Complexidade, mesmo se confuso"
      },
      {
        "id": "disc25-b19-b",
        "dimensao": "C",
        "texto": "Ordem e sistematização"
      },
      {
        "id": "disc25-b19-c",
        "dimensao": "I",
        "texto": "Calor humano e animação"
      },
      {
        "id": "disc25-b19-d",
        "dimensao": "D",
        "texto": "Coisas claras e simples"
      }
    ]
  },
  {
    "id": "disc25-b20",
    "pergunta": "Tempo para mim é...",
    "opcoes": [
      {
        "id": "disc25-b20-a",
        "dimensao": "D",
        "texto": "Algo que detesto desperdiçar"
      },
      {
        "id": "disc25-b20-b",
        "dimensao": "I",
        "texto": "Um grande ciclo"
      },
      {
        "id": "disc25-b20-c",
        "dimensao": "C",
        "texto": "Uma flecha que leva ao inevitável"
      },
      {
        "id": "disc25-b20-d",
        "dimensao": "S",
        "texto": "Irrelevante"
      }
    ]
  },
  {
    "id": "disc25-b21",
    "pergunta": "Se eu fosse bilionário...",
    "opcoes": [
      {
        "id": "disc25-b21-a",
        "dimensao": "I",
        "texto": "Faria doações para muitas entidades"
      },
      {
        "id": "disc25-b21-b",
        "dimensao": "C",
        "texto": "Criaria uma poupança avantajada"
      },
      {
        "id": "disc25-b21-c",
        "dimensao": "S",
        "texto": "Faria o que desse na cabeça"
      },
      {
        "id": "disc25-b21-d",
        "dimensao": "D",
        "texto": "Exibiria bastante com algumas pessoas"
      }
    ]
  },
  {
    "id": "disc25-b22",
    "pergunta": "Eu acredito que...",
    "opcoes": [
      {
        "id": "disc25-b22-a",
        "dimensao": "D",
        "texto": "O destino é mais importante que a jornada"
      },
      {
        "id": "disc25-b22-b",
        "dimensao": "I",
        "texto": "A jornada é mais importante que o destino"
      },
      {
        "id": "disc25-b22-c",
        "dimensao": "C",
        "texto": "Um centavo economizado é um centavo ganho"
      },
      {
        "id": "disc25-b22-d",
        "dimensao": "S",
        "texto": "Bastam um navio e uma estrela para navegar"
      }
    ]
  },
  {
    "id": "disc25-b23",
    "pergunta": "Eu acredito também...",
    "opcoes": [
      {
        "id": "disc25-b23-a",
        "dimensao": "D",
        "texto": "Aquele que hesita está perdido"
      },
      {
        "id": "disc25-b23-b",
        "dimensao": "C",
        "texto": "De grão em grão a galinha enche o papo"
      },
      {
        "id": "disc25-b23-c",
        "dimensao": "I",
        "texto": "O que vai, volta"
      },
      {
        "id": "disc25-b23-d",
        "dimensao": "S",
        "texto": "Um sorriso ou uma careta é o mesmo para quem é cego"
      }
    ]
  },
  {
    "id": "disc25-b24",
    "pergunta": "Eu acredito ainda...",
    "opcoes": [
      {
        "id": "disc25-b24-a",
        "dimensao": "C",
        "texto": "É melhor prudência do que arrependimento"
      },
      {
        "id": "disc25-b24-b",
        "dimensao": "S",
        "texto": "A Autoridade deve ser desafiada"
      },
      {
        "id": "disc25-b24-c",
        "dimensao": "D",
        "texto": "Ganhar é fundamental"
      },
      {
        "id": "disc25-b24-d",
        "dimensao": "I",
        "texto": "O coletivo é mais importante do que o individual"
      }
    ]
  },
  {
    "id": "disc25-b25",
    "pergunta": "Eu penso que...",
    "opcoes": [
      {
        "id": "disc25-b25-a",
        "dimensao": "S",
        "texto": "Não é fácil ficar encurralado"
      },
      {
        "id": "disc25-b25-b",
        "dimensao": "C",
        "texto": "É preferível olhar, antes de pular"
      },
      {
        "id": "disc25-b25-c",
        "dimensao": "I",
        "texto": "Duas cabeças pensam melhor que uma"
      },
      {
        "id": "disc25-b25-d",
        "dimensao": "D",
        "texto": "Se você não tem condições de competir, não compita"
      }
    ]
  }
] as const;
export const BLOCO_DISC_PLANILHA_POR_ID = new Map(BLOCOS_DISC_PLANILHA.map((b) => [b.id, b]));
export const TOTAL_DE_BLOCOS_DISC_PLANILHA = BLOCOS_DISC_PLANILHA.length;

export function montarFormaDiscPlanilha(semente: string) {
  return {
    blocos: embaralhar(
      BLOCOS_DISC_PLANILHA.map((bloco) => bloco.id),
      criarAleatorio(`${semente}:disc25:blocos`),
    ),
  };
}

export function opcoesDiscPlanilhaParaCandidato(
  blocoId: string,
  semente: string,
) {
  const bloco = BLOCO_DISC_PLANILHA_POR_ID.get(blocoId);
  if (!bloco) return [];
  return embaralhar(
    bloco.opcoes.map(({ id, texto }) => ({ id, texto })),
    criarAleatorio(`${semente}:disc25:${blocoId}`),
  );
}

export function pontuarDiscPlanilha(respostas: Array<{ blocoId: string; alternativaId: string }>): ResultadoDisc {
  const contagens: Record<DimensaoDisc, number> = { D: 0, I: 0, S: 0, C: 0 };
  for (const resposta of respostas) {
    const bloco = BLOCO_DISC_PLANILHA_POR_ID.get(resposta.blocoId);
    const opcao = bloco?.opcoes.find((item) => item.id === resposta.alternativaId);
    if (opcao) contagens[opcao.dimensao] += 1;
  }
  const dimensoes = Object.fromEntries(Object.entries(contagens).map(([dimensao, total]) => [dimensao, total * 4])) as Record<DimensaoDisc, number>;
  const ordem = (["D", "I", "S", "C"] as DimensaoDisc[]).sort((a, b) => dimensoes[b] - dimensoes[a]);
  const dominante = ordem[0];
  const secundaria = dimensoes[ordem[1]] >= dimensoes[dominante] - 8 ? ordem[1] : null;
  return { teste: "DISC", dimensoes, liquidos: { D: contagens.D, I: contagens.I, S: contagens.S, C: contagens.C }, dominante, secundaria, rotulo: secundaria ? `${dominante}/${secundaria}` : dominante };
}
