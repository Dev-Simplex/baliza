import type { DimensaoDisc, ResultadoPerfilComportamental } from "./baterias";
import { criarAleatorio, embaralhar } from "./form";

/**
 * BATERIA 5 — Inventário de Perfil Comportamental.
 *
 * ─── O que este arquivo é ───────────────────────────────────────────────────
 * O banco das 51 linhas da planilha "INVENTÁRIO PERFIL COMPORTAMENTAL DISC",
 * a montagem da forma e a apuração. Sem tela, sem persistência — a mesma
 * divisão de `disc-planilha.ts`.
 *
 * ─── Por que ele existe ao lado do DISC de 25 telas ─────────────────────────
 * São dois instrumentos diferentes que leem a mesma teoria. O de 25 telas
 * pergunta por SITUAÇÃO ("Eu gosto de… ser piloto / conversar com os
 * passageiros"); este pergunta por CARACTERÍSTICA solta ("Enérgico / Caloroso e
 * amigável / Eficiente e organizado / Sério"), e cobre também o lado difícil do
 * temperamento — as últimas linhas da planilha são fraquezas, não forças.
 *
 * Um não substitui o outro e a vaga escolhe, então os dois vivem no catálogo
 * com ids próprios. Misturar os dois num só teste somaria contagens de
 * instrumentos com número de linhas diferente, e a soma não seria de nenhum
 * dos dois.
 *
 * ─── Por que a apuração é contagem simples ──────────────────────────────────
 * A planilha original escora exatamente assim: `COUNTA` de cada coluna, uma
 * escolha por linha, 51 escolhas no total. O instrumento é IPSATIVO — diz o que
 * a pessoa prefere DENTRO de si, não quanto ela tem comparada a outra pessoa.
 * É por isso que ele não alimenta o ranking (`produzFatores: false`) e entra na
 * ficha como contexto para a entrevista.
 *
 * ─── O mapeamento coluna → dimensão nunca vai à tela ────────────────────────
 * Na planilha as quatro colunas estão sempre em D · I · S · C, nessa ordem.
 * Entregar as opções nessa ordem fixa entregaria o gabarito do estilo junto com
 * a pergunta, então `opcoesPerfilComportamentalParaCandidato` embaralha por
 * semente — o mesmo cuidado do §3.3 do manual do DISC.
 */

export const INSTRUCAO_PERFIL_COMPORTAMENTAL =
  "Em cada tela você verá quatro características. Escolha a que de fato " +
  "representa você — e não a que pareceria melhor. Não há resposta certa ou errada.";

/** Repetido acima de cada tela: as quatro características vêm sem enunciado próprio. */
export const ENUNCIADO_PERFIL_COMPORTAMENTAL =
  "Qual destas características mais representa você?";

export type OpcaoPerfilComportamental = {
  id: string;
  /** USO INTERNO. Nunca exibir. */
  dimensao: DimensaoDisc;
  texto: string;
};

export type BlocoPerfilComportamental = {
  id: string;
  opcoes: readonly OpcaoPerfilComportamental[];
};

export const BLOCOS_PERFIL_COMPORTAMENTAL: readonly BlocoPerfilComportamental[] =
[
  {
    "id": "pc-b01",
    "opcoes": [
      {
        "id": "pc-b01-d",
        "dimensao": "D",
        "texto": "Precisa corrigir o que está desconfortável"
      },
      {
        "id": "pc-b01-i",
        "dimensao": "I",
        "texto": "Extrovertido e carismático"
      },
      {
        "id": "pc-b01-s",
        "dimensao": "S",
        "texto": "Simpático e diplomático"
      },
      {
        "id": "pc-b01-c",
        "dimensao": "C",
        "texto": "Auto sacrifício"
      }
    ]
  },
  {
    "id": "pc-b02",
    "opcoes": [
      {
        "id": "pc-b02-d",
        "dimensao": "D",
        "texto": "Enérgico"
      },
      {
        "id": "pc-b02-i",
        "dimensao": "I",
        "texto": "Caloroso e amigável"
      },
      {
        "id": "pc-b02-s",
        "dimensao": "S",
        "texto": "Eficiente e organizado"
      },
      {
        "id": "pc-b02-c",
        "dimensao": "C",
        "texto": "Sério"
      }
    ]
  },
  {
    "id": "pc-b03",
    "opcoes": [
      {
        "id": "pc-b03-d",
        "dimensao": "D",
        "texto": "Produtivo"
      },
      {
        "id": "pc-b03-i",
        "dimensao": "I",
        "texto": "Falante, alma de festa"
      },
      {
        "id": "pc-b03-s",
        "dimensao": "S",
        "texto": "Confiável"
      },
      {
        "id": "pc-b03-c",
        "dimensao": "C",
        "texto": "Talentoso e criativo"
      }
    ]
  },
  {
    "id": "pc-b04",
    "opcoes": [
      {
        "id": "pc-b04-d",
        "dimensao": "D",
        "texto": "Decisivo"
      },
      {
        "id": "pc-b04-i",
        "dimensao": "I",
        "texto": "Compassivo e demonstrativo"
      },
      {
        "id": "pc-b04-s",
        "dimensao": "S",
        "texto": "Conservador e prático"
      },
      {
        "id": "pc-b04-c",
        "dimensao": "C",
        "texto": "Dons artísticos e musicais"
      }
    ]
  },
  {
    "id": "pc-b05",
    "opcoes": [
      {
        "id": "pc-b05-d",
        "dimensao": "D",
        "texto": "Prático"
      },
      {
        "id": "pc-b05-i",
        "dimensao": "I",
        "texto": "Generoso e sincero de coração"
      },
      {
        "id": "pc-b05-s",
        "dimensao": "S",
        "texto": "Líder persistente"
      },
      {
        "id": "pc-b05-c",
        "dimensao": "C",
        "texto": "Filosófico e poético"
      }
    ]
  },
  {
    "id": "pc-b06",
    "opcoes": [
      {
        "id": "pc-b06-d",
        "dimensao": "D",
        "texto": "Visionário"
      },
      {
        "id": "pc-b06-i",
        "dimensao": "I",
        "texto": "Bom senso de humor"
      },
      {
        "id": "pc-b06-s",
        "dimensao": "S",
        "texto": "Personalidade moderada"
      },
      {
        "id": "pc-b06-c",
        "dimensao": "C",
        "texto": "Apreciador da beleza"
      }
    ]
  },
  {
    "id": "pc-b07",
    "opcoes": [
      {
        "id": "pc-b07-d",
        "dimensao": "D",
        "texto": "Otimista"
      },
      {
        "id": "pc-b07-i",
        "dimensao": "I",
        "texto": "Memória para estórias e piadas"
      },
      {
        "id": "pc-b07-s",
        "dimensao": "S",
        "texto": "Descontraído e relaxado"
      },
      {
        "id": "pc-b07-c",
        "dimensao": "C",
        "texto": "Estabelece padrões altos"
      }
    ]
  },
  {
    "id": "pc-b08",
    "opcoes": [
      {
        "id": "pc-b08-d",
        "dimensao": "D",
        "texto": "Corajoso"
      },
      {
        "id": "pc-b08-i",
        "dimensao": "I",
        "texto": "Entusiástico e expressivos"
      },
      {
        "id": "pc-b08-s",
        "dimensao": "S",
        "texto": "Paciente e bem equilibrado"
      },
      {
        "id": "pc-b08-c",
        "dimensao": "C",
        "texto": "Quer tudo feito corretamente"
      }
    ]
  },
  {
    "id": "pc-b09",
    "opcoes": [
      {
        "id": "pc-b09-d",
        "dimensao": "D",
        "texto": "Líder nato"
      },
      {
        "id": "pc-b09-i",
        "dimensao": "I",
        "texto": "Bom no palco"
      },
      {
        "id": "pc-b09-s",
        "dimensao": "S",
        "texto": "Quieto, mas espirituoso"
      },
      {
        "id": "pc-b09-c",
        "dimensao": "C",
        "texto": "Sacrifica a sua própria vontade"
      }
    ]
  },
  {
    "id": "pc-b10",
    "opcoes": [
      {
        "id": "pc-b10-d",
        "dimensao": "D",
        "texto": "Necessidade de mudança"
      },
      {
        "id": "pc-b10-i",
        "dimensao": "I",
        "texto": "Deslumbrado e inocente"
      },
      {
        "id": "pc-b10-s",
        "dimensao": "S",
        "texto": "Solidário e bondoso"
      },
      {
        "id": "pc-b10-c",
        "dimensao": "C",
        "texto": "Faz amigos com cautela"
      }
    ]
  },
  {
    "id": "pc-b11",
    "opcoes": [
      {
        "id": "pc-b11-d",
        "dimensao": "D",
        "texto": "Não se desestimula facilmente"
      },
      {
        "id": "pc-b11-i",
        "dimensao": "I",
        "texto": "Vive o presente (hedonista)"
      },
      {
        "id": "pc-b11-s",
        "dimensao": "S",
        "texto": "Mantém as emoções escondidas"
      },
      {
        "id": "pc-b11-c",
        "dimensao": "C",
        "texto": "Contente em ficar nos bastidores"
      }
    ]
  },
  {
    "id": "pc-b12",
    "opcoes": [
      {
        "id": "pc-b12-d",
        "dimensao": "D",
        "texto": "Independente e autossuficiente"
      },
      {
        "id": "pc-b12-i",
        "dimensao": "I",
        "texto": "Disposição variável"
      },
      {
        "id": "pc-b12-s",
        "dimensao": "S",
        "texto": "Feliz em harmonia com a vida"
      },
      {
        "id": "pc-b12-c",
        "dimensao": "C",
        "texto": "Evita chamar atenção"
      }
    ]
  },
  {
    "id": "pc-b13",
    "opcoes": [
      {
        "id": "pc-b13-d",
        "dimensao": "D",
        "texto": "Exerce sólida liderança"
      },
      {
        "id": "pc-b13-i",
        "dimensao": "I",
        "texto": "É apreciado pelos filhos dos amigos"
      },
      {
        "id": "pc-b13-s",
        "dimensao": "S",
        "texto": "É bom pai / mãe"
      },
      {
        "id": "pc-b13-c",
        "dimensao": "C",
        "texto": "Segue o planejado"
      }
    ]
  },
  {
    "id": "pc-b14",
    "opcoes": [
      {
        "id": "pc-b14-d",
        "dimensao": "D",
        "texto": "Estabelece metas"
      },
      {
        "id": "pc-b14-i",
        "dimensao": "I",
        "texto": "Transforma desastre em humor"
      },
      {
        "id": "pc-b14-s",
        "dimensao": "S",
        "texto": "Não tem pressa"
      },
      {
        "id": "pc-b14-c",
        "dimensao": "C",
        "texto": "Perfeccionista, padrões altos"
      }
    ]
  },
  {
    "id": "pc-b15",
    "opcoes": [
      {
        "id": "pc-b15-d",
        "dimensao": "D",
        "texto": "Motiva o grupo à ação"
      },
      {
        "id": "pc-b15-i",
        "dimensao": "I",
        "texto": "É o mestre do circo"
      },
      {
        "id": "pc-b15-s",
        "dimensao": "S",
        "texto": "Pode assumir o bom e o ruim"
      },
      {
        "id": "pc-b15-c",
        "dimensao": "C",
        "texto": "Orientado a detalhes"
      }
    ]
  },
  {
    "id": "pc-b16",
    "opcoes": [
      {
        "id": "pc-b16-d",
        "dimensao": "D",
        "texto": "Sabe a resposta certa"
      },
      {
        "id": "pc-b16-i",
        "dimensao": "I",
        "texto": "Faz amigos facilmente"
      },
      {
        "id": "pc-b16-s",
        "dimensao": "S",
        "texto": "Não se aborrece facilmente"
      },
      {
        "id": "pc-b16-c",
        "dimensao": "C",
        "texto": "Persistente e meticuloso"
      }
    ]
  },
  {
    "id": "pc-b17",
    "opcoes": [
      {
        "id": "pc-b17-d",
        "dimensao": "D",
        "texto": "Organiza a casa"
      },
      {
        "id": "pc-b17-i",
        "dimensao": "I",
        "texto": "Cresce com elogios"
      },
      {
        "id": "pc-b17-s",
        "dimensao": "S",
        "texto": "Agradável e divertido"
      },
      {
        "id": "pc-b17-c",
        "dimensao": "C",
        "texto": "Ordeiro e organizado"
      }
    ]
  },
  {
    "id": "pc-b18",
    "opcoes": [
      {
        "id": "pc-b18-d",
        "dimensao": "D",
        "texto": "Tem pouca necessidade de amigos"
      },
      {
        "id": "pc-b18-i",
        "dimensao": "I",
        "texto": "Invejado pelos outros"
      },
      {
        "id": "pc-b18-s",
        "dimensao": "S",
        "texto": "Bom ouvinte"
      },
      {
        "id": "pc-b18-c",
        "dimensao": "C",
        "texto": "Econômico"
      }
    ]
  },
  {
    "id": "pc-b19",
    "opcoes": [
      {
        "id": "pc-b19-d",
        "dimensao": "D",
        "texto": "Trabalhará para a atividade do grupo"
      },
      {
        "id": "pc-b19-i",
        "dimensao": "I",
        "texto": "Pede desculpas rapidamente"
      },
      {
        "id": "pc-b19-s",
        "dimensao": "S",
        "texto": "Senso de humor inteligente"
      },
      {
        "id": "pc-b19-c",
        "dimensao": "C",
        "texto": "Vê o problema"
      }
    ]
  },
  {
    "id": "pc-b20",
    "opcoes": [
      {
        "id": "pc-b20-d",
        "dimensao": "D",
        "texto": "Supera-se em emergências"
      },
      {
        "id": "pc-b20-i",
        "dimensao": "I",
        "texto": "Gosta de atividades espontâneas"
      },
      {
        "id": "pc-b20-s",
        "dimensao": "S",
        "texto": "Tem vários amigos íntimos"
      },
      {
        "id": "pc-b20-c",
        "dimensao": "C",
        "texto": "Encontra soluções criativas"
      }
    ]
  },
  {
    "id": "pc-b21",
    "opcoes": [
      {
        "id": "pc-b21-d",
        "dimensao": "D",
        "texto": "Orientado a metas"
      },
      {
        "id": "pc-b21-i",
        "dimensao": "I",
        "texto": "Voluntaria-se para trabalhos"
      },
      {
        "id": "pc-b21-s",
        "dimensao": "S",
        "texto": "Competente e constante"
      },
      {
        "id": "pc-b21-c",
        "dimensao": "C",
        "texto": "Precisa terminar o que começa"
      }
    ]
  },
  {
    "id": "pc-b22",
    "opcoes": [
      {
        "id": "pc-b22-d",
        "dimensao": "D",
        "texto": "Vê o todo"
      },
      {
        "id": "pc-b22-i",
        "dimensao": "I",
        "texto": "Pensa em atividades novas"
      },
      {
        "id": "pc-b22-s",
        "dimensao": "S",
        "texto": "Pacífico e agradável"
      },
      {
        "id": "pc-b22-c",
        "dimensao": "C",
        "texto": "Gosta de mapas, gráficos e figuras"
      }
    ]
  },
  {
    "id": "pc-b23",
    "opcoes": [
      {
        "id": "pc-b23-d",
        "dimensao": "D",
        "texto": "Organiza bem"
      },
      {
        "id": "pc-b23-i",
        "dimensao": "I",
        "texto": "Inquieto e ingênuo"
      },
      {
        "id": "pc-b23-s",
        "dimensao": "S",
        "texto": "Tem capacidade administrativa"
      },
      {
        "id": "pc-b23-c",
        "dimensao": "C",
        "texto": "Analítico e detalhista"
      }
    ]
  },
  {
    "id": "pc-b24",
    "opcoes": [
      {
        "id": "pc-b24-d",
        "dimensao": "D",
        "texto": "Busca soluções práticas"
      },
      {
        "id": "pc-b24-i",
        "dimensao": "I",
        "texto": "Indisciplinado"
      },
      {
        "id": "pc-b24-s",
        "dimensao": "S",
        "texto": "Faz mediação de problemas"
      },
      {
        "id": "pc-b24-c",
        "dimensao": "C",
        "texto": "Leal"
      }
    ]
  },
  {
    "id": "pc-b25",
    "opcoes": [
      {
        "id": "pc-b25-d",
        "dimensao": "D",
        "texto": "Passa rapidamente à ação"
      },
      {
        "id": "pc-b25-i",
        "dimensao": "I",
        "texto": "Improdutivo"
      },
      {
        "id": "pc-b25-s",
        "dimensao": "S",
        "texto": "Evita conflitos"
      },
      {
        "id": "pc-b25-c",
        "dimensao": "C",
        "texto": "Sensível"
      }
    ]
  },
  {
    "id": "pc-b26",
    "opcoes": [
      {
        "id": "pc-b26-d",
        "dimensao": "D",
        "texto": "Delega trabalho"
      },
      {
        "id": "pc-b26-i",
        "dimensao": "I",
        "texto": "Não confiável"
      },
      {
        "id": "pc-b26-s",
        "dimensao": "S",
        "texto": "Bom sob pressão"
      },
      {
        "id": "pc-b26-c",
        "dimensao": "C",
        "texto": "Autodisciplinado"
      }
    ]
  },
  {
    "id": "pc-b27",
    "opcoes": [
      {
        "id": "pc-b27-d",
        "dimensao": "D",
        "texto": "Cobra resultados"
      },
      {
        "id": "pc-b27-i",
        "dimensao": "I",
        "texto": "Egocêntrico"
      },
      {
        "id": "pc-b27-s",
        "dimensao": "S",
        "texto": "Encontra o caminho fácil"
      },
      {
        "id": "pc-b27-c",
        "dimensao": "C",
        "texto": "Crítico"
      }
    ]
  },
  {
    "id": "pc-b28",
    "opcoes": [
      {
        "id": "pc-b28-d",
        "dimensao": "D",
        "texto": "Estimula a atividade"
      },
      {
        "id": "pc-b28-i",
        "dimensao": "I",
        "texto": "Falante exagerado e compulsivo"
      },
      {
        "id": "pc-b28-s",
        "dimensao": "S",
        "texto": "Desmotivado e indiferente"
      },
      {
        "id": "pc-b28-c",
        "dimensao": "C",
        "texto": "Rígido e realista"
      }
    ]
  },
  {
    "id": "pc-b29",
    "opcoes": [
      {
        "id": "pc-b29-d",
        "dimensao": "D",
        "texto": "Supera a oposição"
      },
      {
        "id": "pc-b29-i",
        "dimensao": "I",
        "texto": "Medroso e inseguro"
      },
      {
        "id": "pc-b29-s",
        "dimensao": "S",
        "texto": "Espectador"
      },
      {
        "id": "pc-b29-c",
        "dimensao": "C",
        "texto": "Autocentrado e sensível"
      }
    ]
  },
  {
    "id": "pc-b30",
    "opcoes": [
      {
        "id": "pc-b30-d",
        "dimensao": "D",
        "texto": "Insensível e frio"
      },
      {
        "id": "pc-b30-i",
        "dimensao": "I",
        "texto": "Vive em trivialidades"
      },
      {
        "id": "pc-b30-s",
        "dimensao": "S",
        "texto": "Pão-duro"
      },
      {
        "id": "pc-b30-c",
        "dimensao": "C",
        "texto": "Vingativo"
      }
    ]
  },
  {
    "id": "pc-b31",
    "opcoes": [
      {
        "id": "pc-b31-d",
        "dimensao": "D",
        "texto": "Arrogante"
      },
      {
        "id": "pc-b31-i",
        "dimensao": "I",
        "texto": "Egoísta e odioso"
      },
      {
        "id": "pc-b31-s",
        "dimensao": "S",
        "texto": "Auto protetor"
      },
      {
        "id": "pc-b31-c",
        "dimensao": "C",
        "texto": "Propenso a perseguição"
      }
    ]
  },
  {
    "id": "pc-b32",
    "opcoes": [
      {
        "id": "pc-b32-d",
        "dimensao": "D",
        "texto": "Cruel e sarcástico"
      },
      {
        "id": "pc-b32-i",
        "dimensao": "I",
        "texto": "Controlado pelas circunstâncias"
      },
      {
        "id": "pc-b32-s",
        "dimensao": "S",
        "texto": "Indeciso e medroso"
      },
      {
        "id": "pc-b32-c",
        "dimensao": "C",
        "texto": "Insociável"
      }
    ]
  },
  {
    "id": "pc-b33",
    "opcoes": [
      {
        "id": "pc-b33-d",
        "dimensao": "D",
        "texto": "Impiedoso"
      },
      {
        "id": "pc-b33-i",
        "dimensao": "I",
        "texto": "Fica com raiva facilmente"
      },
      {
        "id": "pc-b33-s",
        "dimensao": "S",
        "texto": "Pouco entusiasmado"
      },
      {
        "id": "pc-b33-c",
        "dimensao": "C",
        "texto": "Teórico e pouco prático"
      }
    ]
  },
  {
    "id": "pc-b34",
    "opcoes": [
      {
        "id": "pc-b34-d",
        "dimensao": "D",
        "texto": "Autossuficiente e dominador"
      },
      {
        "id": "pc-b34-i",
        "dimensao": "I",
        "texto": "Pode parecer falso"
      },
      {
        "id": "pc-b34-s",
        "dimensao": "S",
        "texto": "Reticente"
      },
      {
        "id": "pc-b34-c",
        "dimensao": "C",
        "texto": "Tem falsa humildade"
      }
    ]
  },
  {
    "id": "pc-b35",
    "opcoes": [
      {
        "id": "pc-b35-d",
        "dimensao": "D",
        "texto": "Argumentativo e impaciente"
      },
      {
        "id": "pc-b35-i",
        "dimensao": "I",
        "texto": "Mantém a casa em frenesi"
      },
      {
        "id": "pc-b35-s",
        "dimensao": "S",
        "texto": "Evita responsabilidades"
      },
      {
        "id": "pc-b35-c",
        "dimensao": "C",
        "texto": "Tem audição seletiva"
      }
    ]
  },
  {
    "id": "pc-b36",
    "opcoes": [
      {
        "id": "pc-b36-d",
        "dimensao": "D",
        "texto": "Opiniático e preconceituoso"
      },
      {
        "id": "pc-b36-i",
        "dimensao": "I",
        "texto": "Desorganizado"
      },
      {
        "id": "pc-b36-s",
        "dimensao": "S",
        "texto": "Quieto"
      },
      {
        "id": "pc-b36-c",
        "dimensao": "C",
        "texto": "Profunda necessidade de aprovação"
      }
    ]
  },
  {
    "id": "pc-b37",
    "opcoes": [
      {
        "id": "pc-b37-d",
        "dimensao": "D",
        "texto": "Pouca tolerância a erros"
      },
      {
        "id": "pc-b37-i",
        "dimensao": "I",
        "texto": "Piedoso"
      },
      {
        "id": "pc-b37-s",
        "dimensao": "S",
        "texto": "Faz concessões demais"
      },
      {
        "id": "pc-b37-c",
        "dimensao": "C",
        "texto": "Tendência à hipocondria"
      }
    ]
  },
  {
    "id": "pc-b38",
    "opcoes": [
      {
        "id": "pc-b38-d",
        "dimensao": "D",
        "texto": "Não analisa detalhes"
      },
      {
        "id": "pc-b38-i",
        "dimensao": "I",
        "texto": "Não escuta a história inteira"
      },
      {
        "id": "pc-b38-s",
        "dimensao": "S",
        "texto": "Indisciplinado e imutável"
      },
      {
        "id": "pc-b38-c",
        "dimensao": "C",
        "texto": "Estabelece metas irrealistas"
      }
    ]
  },
  {
    "id": "pc-b39",
    "opcoes": [
      {
        "id": "pc-b39-d",
        "dimensao": "D",
        "texto": "Entedia-se com trivialidades"
      },
      {
        "id": "pc-b39-i",
        "dimensao": "I",
        "texto": "Precisa estar no centro do palco"
      },
      {
        "id": "pc-b39-s",
        "dimensao": "S",
        "texto": "Não organiza o lar"
      },
      {
        "id": "pc-b39-c",
        "dimensao": "C",
        "texto": "Meticuloso demais"
      }
    ]
  },
  {
    "id": "pc-b40",
    "opcoes": [
      {
        "id": "pc-b40-d",
        "dimensao": "D",
        "texto": "Tomador de decisão impetuoso"
      },
      {
        "id": "pc-b40-i",
        "dimensao": "I",
        "texto": "Domina as conversas"
      },
      {
        "id": "pc-b40-s",
        "dimensao": "S",
        "texto": "Leva a vida de modo muito relaxado"
      },
      {
        "id": "pc-b40-c",
        "dimensao": "C",
        "texto": "Sente-se injustiçado e se indispõe"
      }
    ]
  },
  {
    "id": "pc-b41",
    "opcoes": [
      {
        "id": "pc-b41-d",
        "dimensao": "D",
        "texto": "Rude e sem tato"
      },
      {
        "id": "pc-b41-i",
        "dimensao": "I",
        "texto": "Responde pelos outros"
      },
      {
        "id": "pc-b41-s",
        "dimensao": "S",
        "texto": "Sufoca o entusiasmo"
      },
      {
        "id": "pc-b41-c",
        "dimensao": "C",
        "texto": "Difícil de agradar"
      }
    ]
  },
  {
    "id": "pc-b42",
    "opcoes": [
      {
        "id": "pc-b42-d",
        "dimensao": "D",
        "texto": "Manipulador e exigente"
      },
      {
        "id": "pc-b42-i",
        "dimensao": "I",
        "texto": "Inconstante"
      },
      {
        "id": "pc-b42-s",
        "dimensao": "S",
        "texto": "Indiferente a planos"
      },
      {
        "id": "pc-b42-c",
        "dimensao": "C",
        "texto": "Socialmente inseguro"
      }
    ]
  },
  {
    "id": "pc-b43",
    "opcoes": [
      {
        "id": "pc-b43-d",
        "dimensao": "D",
        "texto": "Os fins justificam os meios"
      },
      {
        "id": "pc-b43-i",
        "dimensao": "I",
        "texto": "Inventa desculpas"
      },
      {
        "id": "pc-b43-s",
        "dimensao": "S",
        "texto": "Julga os outros"
      },
      {
        "id": "pc-b43-c",
        "dimensao": "C",
        "texto": "Impiedoso"
      }
    ]
  },
  {
    "id": "pc-b44",
    "opcoes": [
      {
        "id": "pc-b44-d",
        "dimensao": "D",
        "texto": "O trabalho é prioridade"
      },
      {
        "id": "pc-b44-i",
        "dimensao": "I",
        "texto": "Prefere falar em vez de trabalhar"
      },
      {
        "id": "pc-b44-s",
        "dimensao": "S",
        "texto": "Sarcástico e provocador"
      },
      {
        "id": "pc-b44-c",
        "dimensao": "C",
        "texto": "Contestador"
      }
    ]
  },
  {
    "id": "pc-b45",
    "opcoes": [
      {
        "id": "pc-b45-d",
        "dimensao": "D",
        "texto": "Exige lealdade"
      },
      {
        "id": "pc-b45-i",
        "dimensao": "I",
        "texto": "Esquece das obrigações"
      },
      {
        "id": "pc-b45-s",
        "dimensao": "S",
        "texto": "Não é orientado para metas"
      },
      {
        "id": "pc-b45-c",
        "dimensao": "C",
        "texto": "Não é orientado para pessoas"
      }
    ]
  },
  {
    "id": "pc-b46",
    "opcoes": [
      {
        "id": "pc-b46-d",
        "dimensao": "D",
        "texto": "Tende a ser excessivamente dominador"
      },
      {
        "id": "pc-b46-i",
        "dimensao": "I",
        "texto": "Não faz acompanhamento"
      },
      {
        "id": "pc-b46-s",
        "dimensao": "S",
        "texto": "Tem falta de automotivação"
      },
      {
        "id": "pc-b46-c",
        "dimensao": "C",
        "texto": "Se deprime com as imperfeições"
      }
    ]
  },
  {
    "id": "pc-b47",
    "opcoes": [
      {
        "id": "pc-b47-d",
        "dimensao": "D",
        "texto": "Pouco tempo para a família"
      },
      {
        "id": "pc-b47-i",
        "dimensao": "I",
        "texto": "Confiança se desfaz rapidamente"
      },
      {
        "id": "pc-b47-s",
        "dimensao": "S",
        "texto": "Difícil de se fazer mover"
      },
      {
        "id": "pc-b47-c",
        "dimensao": "C",
        "texto": "Escolhe o caminho mais difícil"
      }
    ]
  },
  {
    "id": "pc-b48",
    "opcoes": [
      {
        "id": "pc-b48-d",
        "dimensao": "D",
        "texto": "Impaciente com pessoas de desempenho fraco"
      },
      {
        "id": "pc-b48-i",
        "dimensao": "I",
        "texto": "Indisciplinado"
      },
      {
        "id": "pc-b48-s",
        "dimensao": "S",
        "texto": "Ressente-se ao ser empurrado"
      },
      {
        "id": "pc-b48-c",
        "dimensao": "C",
        "texto": "Hesitante para iniciar projetos"
      }
    ]
  },
  {
    "id": "pc-b49",
    "opcoes": [
      {
        "id": "pc-b49-d",
        "dimensao": "D",
        "texto": "Não permite que as pessoas relaxem"
      },
      {
        "id": "pc-b49-i",
        "dimensao": "I",
        "texto": "Não estabelece prioridades"
      },
      {
        "id": "pc-b49-s",
        "dimensao": "S",
        "texto": "Letárgico e descuidado"
      },
      {
        "id": "pc-b49-c",
        "dimensao": "C",
        "texto": "Dispende tempo demais planejando"
      }
    ]
  },
  {
    "id": "pc-b50",
    "opcoes": [
      {
        "id": "pc-b50-d",
        "dimensao": "D",
        "texto": "Não se intimida em ser impopular"
      },
      {
        "id": "pc-b50-i",
        "dimensao": "I",
        "texto": "Decide pelo sentimento"
      },
      {
        "id": "pc-b50-s",
        "dimensao": "S",
        "texto": "Desestimula os outros"
      },
      {
        "id": "pc-b50-c",
        "dimensao": "C",
        "texto": "Prefere a análise ao trabalho"
      }
    ]
  },
  {
    "id": "pc-b51",
    "opcoes": [
      {
        "id": "pc-b51-d",
        "dimensao": "D",
        "texto": "Orgulhoso"
      },
      {
        "id": "pc-b51-i",
        "dimensao": "I",
        "texto": "Se distrai facilmente"
      },
      {
        "id": "pc-b51-s",
        "dimensao": "S",
        "texto": "Dificuldade de estabelecer prioridades"
      },
      {
        "id": "pc-b51-c",
        "dimensao": "C",
        "texto": "Auto depreciação"
      }
    ]
  }
] as const;

export const BLOCO_PERFIL_COMPORTAMENTAL_POR_ID = new Map(
  BLOCOS_PERFIL_COMPORTAMENTAL.map((bloco) => [bloco.id, bloco]),
);

export const TOTAL_DE_BLOCOS_PERFIL_COMPORTAMENTAL =
  BLOCOS_PERFIL_COMPORTAMENTAL.length;

/** A ordem das 51 telas, sorteada da semente e portanto reconstruível. */
export function montarFormaPerfilComportamental(semente: string) {
  return {
    blocos: embaralhar(
      BLOCOS_PERFIL_COMPORTAMENTAL.map((bloco) => bloco.id),
      criarAleatorio(`${semente}:perfil:blocos`),
    ),
  };
}

/** A única porta de saída para o navegador: id e texto, nunca a dimensão. */
export function opcoesPerfilComportamentalParaCandidato(
  blocoId: string,
  semente: string,
) {
  const bloco = BLOCO_PERFIL_COMPORTAMENTAL_POR_ID.get(blocoId);
  if (!bloco) return [];
  return embaralhar(
    bloco.opcoes.map(({ id, texto }) => ({ id, texto })),
    criarAleatorio(`${semente}:perfil:${blocoId}`),
  );
}

/**
 * A conta da planilha: uma escolha por linha, contagem por coluna.
 *
 * O 0–100 é a fração das linhas RESPONDIDAS, não das 51 — prova incompleta não
 * chega aqui (o encerramento barra antes), mas se chegasse, dividir por 51
 * transformaria "faltou responder" em "esta dimensão é fraca".
 */
export function pontuarPerfilComportamental(
  respostas: Array<{ blocoId: string; alternativaId: string }>,
): ResultadoPerfilComportamental {
  const contagens: Record<DimensaoDisc, number> = { D: 0, I: 0, S: 0, C: 0 };

  for (const resposta of respostas) {
    const bloco = BLOCO_PERFIL_COMPORTAMENTAL_POR_ID.get(resposta.blocoId);
    const opcao = bloco?.opcoes.find((o) => o.id === resposta.alternativaId);
    if (opcao) contagens[opcao.dimensao] += 1;
  }

  const total = contagens.D + contagens.I + contagens.S + contagens.C;
  const dimensoes = { D: 0, I: 0, S: 0, C: 0 } as Record<DimensaoDisc, number>;
  for (const d of ["D", "I", "S", "C"] as DimensaoDisc[])
    dimensoes[d] = total > 0 ? Math.round((contagens[d] / total) * 100) : 0;

  // Desempate final na ordem canônica D · I · S · C, como o resto do produto.
  const ordem = (["D", "I", "S", "C"] as DimensaoDisc[])
    .slice()
    .sort((a, b) => dimensoes[b] - dimensoes[a]);
  const dominante = ordem[0];

  /*
   * Secundária só quando ela realmente tempera a dominante.
   *
   * A régua é a mesma do DISC de 25 telas em espírito: uma diferença pequena
   * entre a primeira e a segunda descreve um perfil de duas pontas; uma
   * diferença grande descreve um perfil puro. 8 pontos aqui são ~4 linhas das
   * 51 — abaixo disso a ordem entre as duas é ruído de uma escolha ou outra.
   */
  const secundaria =
    dimensoes[ordem[1]] >= dimensoes[dominante] - 8 && dimensoes[ordem[1]] > 0
      ? ordem[1]
      : null;

  return {
    teste: "PERFIL_COMPORTAMENTAL",
    dimensoes,
    liquidos: contagens,
    dominante,
    secundaria,
    rotulo: secundaria ? `${dominante}/${secundaria}` : dominante,
  };
}
