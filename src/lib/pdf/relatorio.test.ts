import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { RelatorioPdf, type DadosDoRelatorio } from "./relatorio";
import { montarDiagnostico } from "@/lib/analise/diagnostico";
import type { FichaDeModulos } from "@/lib/analise/ficha";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { FATORES, type Fator } from "@/lib/instrument/types";

/**
 * Smoke test do relatório em PDF.
 *
 * Existe porque o `@react-pdf/renderer` valida estilo em tempo de EXECUÇÃO: uma
 * propriedade que ele não conhece, ou um valor no formato errado, atravessa o
 * TypeScript inteiro e só estoura na hora em que alguém clica em "Salvar PDF".
 * O caminho de descoberta desse erro, sem este teste, é um recrutador com o
 * candidato esperando do outro lado.
 *
 * Não afirma nada sobre o VISUAL — isso ninguém testa sem olho. Afirma que o
 * documento FECHA nos dois desenhos diferentes que a mesma função produz: com
 * os cinco fatores e sem eles.
 *
 * Sem JSX de propósito: o `include` do vitest é `src/**\/*.test.ts`, e trocar o
 * glob por causa de um arquivo seria mexer em config compartilhada para
 * resolver um problema que `createElement` resolve numa linha.
 */

/**
 * `renderToBuffer` pede um `ReactElement<DocumentProps>`, e `createElement`
 * infere as props do COMPONENTE — não as do `<Document>` que ele devolve. Em
 * JSX o casamento acontece por outro caminho e o problema nem aparece, o que é
 * o motivo de a rota não precisar disto. `RelatorioPdf` devolve um `<Document>`
 * de verdade, então a asserção é honesta: ela só diz isso ao compilador.
 */
function documento(d: DadosDoRelatorio) {
  return createElement(RelatorioPdf, { d }) as Parameters<
    typeof renderToBuffer
  >[0];
}

function contribuicao(
  fator: Fator,
  escore: number,
  faixa: [number, number],
  peso: number,
): ContribuicaoDeFit {
  const dentro = escore >= faixa[0] && escore <= faixa[1];
  return {
    fator,
    nome: fator,
    peso,
    tipo: "faixa_otima",
    faixa,
    ideal: (faixa[0] + faixa[1]) / 2,
    escore,
    dentro,
    desvio: 0,
    perda: dentro ? 0 : 0.5,
  };
}

const CONTRIBUICOES = [
  contribuicao("C", 78, [65, 85], 5),
  contribuicao("A", 32, [55, 80], 4),
  contribuicao("E", 90, [40, 70], 3),
];

const FICHA_VAZIA: FichaDeModulos = {
  bigFive: null,
  disc: null,
  sjt: null,
  temAlgum: false,
};

function dados(parcial: Partial<DadosDoRelatorio> = {}): DadosDoRelatorio {
  return {
    candidato: "Bruno Tavares",
    email: "bruno@exemplo.com",
    empresa: "Simplex",
    vaga: "Executivo de Vendas",
    respondidoEm: "10/08/2026",
    duracao: "9 min",
    aderencia: "72,4",
    resumoDoGap: "2 dimensões ficaram fora de prumo para esta vaga.",
    selo: {
      nivel: "media",
      rotulo: "Média",
      texto: "Algumas respostas puxaram para o socialmente desejável.",
    },
    escores: Object.fromEntries(FATORES.map((f) => [f, 60])) as Record<
      Fator,
      number
    >,
    faixas: CONTRIBUICOES.map((c) => ({
      fator: c.fator as string,
      nome: c.fator,
      escore: c.escore,
      faixa: c.faixa,
      peso: c.peso,
      tipo: c.tipo,
      dentro: c.dentro,
    })),
    puxaramPraCima: [{ nome: "Organização e Entrega", escore: 78 }],
    puxaramPraBaixo: [{ nome: "Cooperação", escore: 32 }],
    perguntas: [
      {
        pergunta: "Me conta de uma vez em que…",
        motivo: "Cooperação ficou abaixo do piso.",
      },
    ],
    arquetipo: {
      nome: "O Executor",
      frase: "Transforma combinado em entregue.",
      brilha: "Ambiente com meta clara.",
      trava: "Ambiguidade prolongada.",
    },
    facetas: [{ texto: "Tende a assumir a frente quando o grupo trava." }],
    faixasQualitativas: [{ nome: "Alto", rotulo: "68–100" }],
    diagnostico: montarDiagnostico({
      contribuicoes: CONTRIBUICOES,
      ficha: FICHA_VAZIA,
      arquetipoId: "executor",
      selo: null,
      roteiro: { perguntas: [], resumoDoGap: "" },
    }),
    ...parcial,
  };
}

describe("RelatorioPdf", () => {
  it(
    "fecha o documento com o diagnóstico dentro",
    async () => {
      const buffer = await renderToBuffer(documento(dados()));

      expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
      expect(buffer.byteLength).toBeGreaterThan(1000);
    },
    30_000,
  );

  it(
    "fecha o documento na bateria que não mede os cinco fatores",
    async () => {
      // O outro desenho: sem radar, sem faixas e sem aderência — e com o
      // diagnóstico dizendo na primeira linha que não houve comparação com o
      // perfil-alvo, em vez de deixar a ausência do número falar sozinha.
      const buffer = await renderToBuffer(
        documento(
          dados({
            aderencia: null,
            escores: null,
            faixas: [],
            puxaramPraCima: [],
            puxaramPraBaixo: [],
            bateria: ["DISC", "Julgamento situacional"],
            diagnostico: montarDiagnostico({
              contribuicoes: [],
              ficha: FICHA_VAZIA,
              arquetipoId: null,
              selo: null,
              roteiro: { perguntas: [], resumoDoGap: "" },
              semAderencia: true,
            }),
          }),
        ),
      );

      expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    },
    30_000,
  );
});
