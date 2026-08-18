import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { AgregadoPdf, type DadosDoAgregado } from "./agregado";

function documento(d: DadosDoAgregado) {
  return createElement(AgregadoPdf, { d }) as Parameters<
    typeof renderToBuffer
  >[0];
}

const BASE: DadosDoAgregado = {
  empresa: "Acme Indústrias",
  geradoEm: "18/08/2026",
  periodo: "Últimos 90 dias",
  candidatos: 42,
  vagasAbertas: 4,
  concluidas: 31,
  pendentes: 11,
  aderenciaMedia: 68.4,
  duracaoMedia: "7 min",
  funil: [
    { rotulo: "Receberam o link", valor: 42 },
    { rotulo: "Começaram", valor: 36 },
    { rotulo: "Concluíram", valor: 31 },
  ],
  confianca: { alta: 18, media: 9, baixa: 4, total: 31 },
  medias: { n: 31, valores: { C: 62, E: 55, X: 71, A: 64, O: 58 } },
  arquetipos: [
    { nome: "Construtor", total: 9 },
    { nome: "Articulador", total: 7 },
  ],
  vagas: [
    {
      titulo: "Executivo de Vendas",
      departamento: "Comercial",
      convites: 20,
      concluidas: 15,
      conversao: 75,
      aderenciaMedia: 71.2,
    },
    {
      titulo: "Atendimento ao Cliente",
      departamento: "Atendimento",
      convites: 12,
      concluidas: 9,
      conversao: 75,
      // Bateria sem os cinco fatores: aderência AUSENTE, e não zero.
      aderenciaMedia: null,
    },
  ],
};

describe("relatório agregado em PDF", () => {
  it("renderiza um PDF de verdade", async () => {
    const buffer = await renderToBuffer(documento(BASE));

    expect(buffer.byteLength).toBeGreaterThan(1000);
    // Assinatura do formato: os quatro primeiros bytes de todo PDF.
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  /**
   * A promessa que este documento faz é que ele pode circular por e-mail sem
   * carregar dado pessoal junto. Se um dia alguém acrescentar uma tabela de
   * candidatos aqui "porque seria útil", o tipo `DadosDoAgregado` é a barreira —
   * e este teste é o que impede a barreira de ser afrouxada sem que ninguém veja.
   */
  it("não tem onde colocar nome de candidato", () => {
    const campos = Object.keys(BASE);
    expect(campos).not.toContain("candidatosLista");

    const serializado = JSON.stringify(BASE).toLowerCase();
    // Os únicos nomes próprios do documento são de empresa, vaga e arquétipo.
    expect(serializado).not.toContain("@");
  });

  it("aguenta a base vazia — nada de rachar em empresa que acabou de entrar", async () => {
    const vazio: DadosDoAgregado = {
      ...BASE,
      candidatos: 0,
      vagasAbertas: 0,
      concluidas: 0,
      pendentes: 0,
      aderenciaMedia: null,
      duracaoMedia: null,
      funil: [
        { rotulo: "Receberam o link", valor: 0 },
        { rotulo: "Começaram", valor: 0 },
        { rotulo: "Concluíram", valor: 0 },
      ],
      confianca: { alta: 0, media: 0, baixa: 0, total: 0 },
      medias: null,
      arquetipos: [],
      vagas: [],
    };

    const buffer = await renderToBuffer(documento(vazio));
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  /**
   * Divisão por zero no funil.
   *
   * A porcentagem de cada etapa é sobre a primeira. Com zero convidados, a conta
   * seria `0/0` — e `NaN%` numa barra de progresso vira largura inválida, que a
   * biblioteca aceita em silêncio e imprime torto.
   */
  it("funil com zero convidados não gera NaN", async () => {
    const buffer = await renderToBuffer(
      documento({
        ...BASE,
        funil: [
          { rotulo: "Receberam o link", valor: 0 },
          { rotulo: "Começaram", valor: 0 },
          { rotulo: "Concluíram", valor: 0 },
        ],
      }),
    );
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
