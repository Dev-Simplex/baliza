import { describe, expect, it } from "vitest";

import { montarDiagnostico } from "./diagnostico";
import type { FichaDeModulos } from "./ficha";
import type { Roteiro } from "./roteiro";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { FATORES, type Fator } from "@/lib/instrument/types";

/**
 * O diagnóstico é a primeira coisa que quem entrevista lê, e em muitos casos a
 * única — o resto da página é consulta. Isso muda o que precisa de teste: não é
 * a formatação, é a HIERARQUIA. Um achado que o manual manda levar à entrevista
 * e que some porque chegou em quinto lugar numa lista com teto de quatro é um
 * bug que ninguém percebe, porque a tela continua bonita e preenchida.
 */

function contribuicao(
  fator: Fator,
  parcial: Partial<ContribuicaoDeFit> = {},
): ContribuicaoDeFit {
  const escore = parcial.escore ?? 60;
  const faixa = parcial.faixa ?? ([50, 80] as [number, number]);
  return {
    fator,
    nome: fator,
    peso: 4,
    tipo: "faixa_otima",
    faixa,
    ideal: (faixa[0] + faixa[1]) / 2,
    escore,
    dentro: escore >= faixa[0] && escore <= faixa[1],
    desvio: 0,
    perda: 0,
    ...parcial,
  };
}

const FICHA_VAZIA: FichaDeModulos = {
  bigFive: null,
  disc: null,
  sjt: null,
  temAlgum: false,
};

const ROTEIRO_VAZIO: Roteiro = { perguntas: [], resumoDoGap: "" };

function montar(parcial: Partial<Parameters<typeof montarDiagnostico>[0]> = {}) {
  return montarDiagnostico({
    contribuicoes: FATORES.map((f) => contribuicao(f)),
    ficha: FICHA_VAZIA,
    arquetipoId: null,
    selo: null,
    roteiro: ROTEIRO_VAZIO,
    ...parcial,
  });
}

describe("montarDiagnostico — hierarquia dos achados", () => {
  it("põe a pior escolha do SJT na frente e NÃO a corta pelo teto da lista", () => {
    // Cinco dimensões fora da faixa já estouram o teto de riscos sozinhas. A
    // escolha [0] é a última a ser empurrada e tem que sobreviver mesmo assim:
    // é o único achado em que a pessoa não se autoavaliou.
    const diagnostico = montar({
      contribuicoes: FATORES.map((f, i) =>
        contribuicao(f, { escore: 10, perda: 0.9 - i * 0.1 }),
      ),
      ficha: {
        ...FICHA_VAZIA,
        temAlgum: true,
        sjt: {
          score: 82,
          pontosObtidos: 41,
          pontosMaximos: 50,
          faixa: { nome: "alto" } as never,
          competencias: [],
          piores: [
            { titulo: "Conflito com colega", competencia: "Cooperação" },
          ],
        },
      },
    });

    expect(diagnostico.riscos[0].origem).toBe("sjt");
    expect(diagnostico.riscos[0].obrigatorio).toBe(true);
    expect(diagnostico.riscos[0].titulo).toContain("Conflito com colega");
  });

  it("ordena as forças pelo peso da vaga, não pelo escore do candidato", () => {
    // Quem define o que importa é o perfil-alvo. Um 90 numa dimensão que a vaga
    // quase não pesa não pode aparecer na frente de um 62 na dimensão que ela
    // mais pesa — seria o relatório elogiando o candidato pelo que ele tem, e
    // não medindo o que a vaga pediu.
    const diagnostico = montar({
      contribuicoes: [
        contribuicao("X", { nome: "Energia Social", escore: 90, peso: 1 }),
        contribuicao("C", { nome: "Organização e Entrega", escore: 62, peso: 5 }),
      ],
    });

    expect(diagnostico.forcas[0].titulo).toBe("Organização e Entrega");
  });

  it("não lista como força a dimensão que a vaga descartou (peso 0)", () => {
    const diagnostico = montar({
      contribuicoes: [
        contribuicao("O", { nome: "Abertura ao Novo", escore: 75, peso: 0 }),
        contribuicao("C", { nome: "Organização e Entrega", escore: 70, peso: 3 }),
      ],
    });

    expect(diagnostico.forcas).toHaveLength(1);
    expect(diagnostico.forcas[0].titulo).toBe("Organização e Entrega");
  });

  it("separa excesso de déficit: acima do teto tem custo próprio, não é elogio", () => {
    const diagnostico = montar({
      contribuicoes: [
        contribuicao("A", {
          nome: "Cooperação",
          escore: 95,
          faixa: [40, 70],
          peso: 4,
          perda: 0.5,
        }),
      ],
    });

    const risco = diagnostico.riscos[0];
    expect(risco.evidencia).toContain("acima do teto");
    // A regra nº 4: ninguém é forte demais de graça.
    expect(risco.consequencia).toContain("conflito");
  });
});

describe("montarDiagnostico — o que ele se recusa a fazer", () => {
  it("nunca devolve veredito de contratação", () => {
    const diagnostico = montar({
      contribuicoes: FATORES.map((f) => contribuicao(f, { escore: 95 })),
    });

    const tudo = JSON.stringify(diagnostico).toLowerCase();
    // A regra do §4.4: o relatório entrega evidência, não sentença. Se um dia
    // alguém acrescentar um campo de recomendação, este teste cai aqui.
    expect(tudo).not.toMatch(/\b(recomendamos|aprovado|reprovado|deve contratar|não contratar)\b/);
  });

  it("não estraga o nome do cenário do SJT na frase de leitura", () => {
    // Regressão: a frase baixava a caixa do título para "fluir", e o nome
    // próprio do cenário — que vem entre aspas — saía destruído justamente na
    // única linha que muita gente lê inteira.
    const diagnostico = montar({
      contribuicoes: [],
      ficha: {
        ...FICHA_VAZIA,
        temAlgum: true,
        sjt: {
          score: 70,
          pontosObtidos: 35,
          pontosMaximos: 50,
          faixa: { nome: "medio" } as never,
          competencias: [],
          piores: [
            { titulo: "Conflito com colega", competencia: "Cooperação" },
          ],
        },
      },
    });

    expect(diagnostico.leitura).toContain('"Conflito com colega"');
  });

  it("a resposta errada do SJT nunca aparece sem dizer o que ela NÃO quer dizer", () => {
    // É o único achado do instrumento em que existe certo e errado, e por isso
    // o único que pode ser lido como falha de caráter. A ressalva é conteúdo,
    // não enfeite de copy: sem ela, uma escolha ruim num caso escrito decide a
    // conversa antes de a conversa acontecer.
    const diagnostico = montar({
      ficha: {
        ...FICHA_VAZIA,
        temAlgum: true,
        sjt: {
          score: 88,
          pontosObtidos: 44,
          pontosMaximos: 50,
          faixa: { nome: "alto" } as never,
          competencias: [],
          piores: [{ titulo: "Prazo em risco", competencia: "Organização" }],
        },
      },
    });

    const achado = diagnostico.riscos.find((r) => r.obrigatorio);
    expect(achado?.consequencia.toLowerCase()).toContain("não é erro de caráter");
    expect(achado?.consequencia.toLowerCase()).toContain("exemplo real");
  });

  it("marca sem aderência em vez de dar por aprovada uma conta que não foi feita", () => {
    const diagnostico = montar({ contribuicoes: [], semAderencia: true });

    expect(diagnostico.semAderencia).toBe(true);
    expect(diagnostico.leitura).toContain("não mede os cinco fatores");
    expect(diagnostico.leitura).not.toContain("dentro da faixa");
  });
});

describe("montarDiagnostico — nunca sai mudo", () => {
  it("devolve frase de leitura no caso degenerado: sem peso, sem arquétipo, sem módulo", () => {
    // Mesmo motivo do piso do roteiro: um título vazio no topo da tela é pior
    // do que a seção não existir.
    const diagnostico = montar({ contribuicoes: [] });

    expect(diagnostico.leitura.trim().length).toBeGreaterThan(0);
    expect(diagnostico.forcas).toHaveLength(0);
    expect(diagnostico.riscos).toHaveLength(0);
  });

  it("diz que está tudo dentro da faixa quando está — sem inventar risco", () => {
    const diagnostico = montar({
      contribuicoes: FATORES.map((f) => contribuicao(f, { escore: 65 })),
    });

    expect(diagnostico.riscos).toHaveLength(0);
    expect(diagnostico.leitura).toContain("dentro da faixa");
  });

  it("avisa quando a força está raspando o piso da faixa", () => {
    // 52 e 78 na faixa 50–80 são a mesma frase para quem passa o olho, e não
    // são a mesma notícia.
    const raspando = montar({
      contribuicoes: [contribuicao("C", { escore: 52, faixa: [50, 80] })],
    });
    const noTopo = montar({
      contribuicoes: [contribuicao("C", { escore: 78, faixa: [50, 80] })],
    });

    expect(raspando.forcas[0].evidencia).toContain("raspando o piso");
    expect(noTopo.forcas[0].evidencia).toContain("no topo");
  });
});
