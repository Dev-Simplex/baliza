import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { ITENS, VERSAO_DO_INSTRUMENTO } from "../src/lib/instrument/items";
import { CENARIOS } from "../src/lib/instrument/scenarios";
import { PRESETS, PRESET_POR_ID } from "../src/lib/instrument/presets";
import { criarAleatorio, montarForma } from "../src/lib/instrument/form";
import { escorar } from "../src/lib/instrument/scoring";
import { ITEM_POR_ID } from "../src/lib/instrument/items";
import type { Fator, Respostas } from "../src/lib/instrument/types";
import type { Factor } from "../src/generated/prisma/enums";

/**
 * Seed.
 *
 * Duas partes bem diferentes:
 *
 *   1. INSTRUMENTO — itens e cenários. É idempotente e roda em todo ambiente,
 *      inclusive produção: o banco de itens é gerenciável pelo painel admin, e
 *      a fonte da verdade continua sendo o arquivo TypeScript.
 *
 *   2. DEMONSTRAÇÃO — empresa, vagas e candidatos de exemplo, com resultados
 *      calculados pelo motor de verdade (nada de número inventado na tela).
 *      Só roda quando SEED_DEMO=1.
 */

const FATOR_PRISMA: Record<string, Factor> = {
  C: "C",
  E: "E",
  X: "X",
  A: "A",
  O: "O",
  D: "D",
};

async function semearInstrumento() {
  console.log("→ instrumento");

  for (const item of ITENS) {
    await prisma.item.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        factor: FATOR_PRISMA[item.fator],
        facet: item.faceta,
        reverse: item.reverso,
        text: item.texto,
        marketDimension: item.dimensaoDeMercado ?? null,
        consistencyPair: item.par ?? null,
        version: VERSAO_DO_INSTRUMENTO,
      },
      update: {
        factor: FATOR_PRISMA[item.fator],
        facet: item.faceta,
        reverse: item.reverso,
        text: item.texto,
        marketDimension: item.dimensaoDeMercado ?? null,
        consistencyPair: item.par ?? null,
        version: VERSAO_DO_INSTRUMENTO,
      },
    });
  }
  console.log(`  ${ITENS.length} itens`);

  for (const bloco of CENARIOS) {
    await prisma.scenarioBlock.upsert({
      where: { id: bloco.id },
      create: {
        id: bloco.id,
        situation: bloco.situacao,
        version: VERSAO_DO_INSTRUMENTO,
      },
      update: { situation: bloco.situacao, version: VERSAO_DO_INSTRUMENTO },
    });

    for (const opcao of bloco.opcoes) {
      await prisma.scenarioAction.upsert({
        where: { id: opcao.id },
        create: {
          id: opcao.id,
          blockId: bloco.id,
          factor: FATOR_PRISMA[opcao.fator],
          text: opcao.texto,
        },
        update: { factor: FATOR_PRISMA[opcao.fator], text: opcao.texto },
      });
    }
  }
  console.log(`  ${CENARIOS.length} blocos de cenário`);
}

// ─── Demonstração ──────────────────────────────────────────────────────────

const PESSOAS_DEMO: Array<{
  nome: string;
  email: string;
  perfil: Record<Fator, number>;
  respostasD?: number[];
  vaga: string;
  segundosPorItem?: number;
}> = [
  { nome: "Ana Ribeiro", email: "ana.ribeiro@exemplo.com", perfil: { C: 72, E: 82, X: 88, A: 42, O: 61 }, vaga: "vendas_cacador" },
  { nome: "Bruno Tavares", email: "bruno.tavares@exemplo.com", perfil: { C: 66, E: 61, X: 79, A: 91, O: 54 }, respostasD: [5, 5, 5, 4], vaga: "vendas_cacador" },
  { nome: "Carla Menezes", email: "carla.menezes@exemplo.com", perfil: { C: 91, E: 71, X: 32, A: 62, O: 66 }, vaga: "vendas_cacador" },
  { nome: "Diego Fontes", email: "diego.fontes@exemplo.com", perfil: { C: 58, E: 74, X: 71, A: 38, O: 77 }, vaga: "vendas_cacador" },
  { nome: "Elisa Prado", email: "elisa.prado@exemplo.com", perfil: { C: 84, E: 69, X: 55, A: 70, O: 48 }, vaga: "vendas_cacador" },
  { nome: "Fábio Lousada", email: "fabio.lousada@exemplo.com", perfil: { C: 45, E: 52, X: 62, A: 55, O: 58 }, vaga: "vendas_cacador", segundosPorItem: 1.2 },

  { nome: "Gabriela Souto", email: "gabriela.souto@exemplo.com", perfil: { C: 88, E: 76, X: 41, A: 72, O: 44 }, vaga: "administrativo_financeiro" },
  { nome: "Henrique Vidal", email: "henrique.vidal@exemplo.com", perfil: { C: 79, E: 63, X: 58, A: 66, O: 71 }, vaga: "administrativo_financeiro" },
  { nome: "Isabela Moraes", email: "isabela.moraes@exemplo.com", perfil: { C: 62, E: 58, X: 74, A: 60, O: 82 }, vaga: "administrativo_financeiro" },

  { nome: "João Bertoni", email: "joao.bertoni@exemplo.com", perfil: { C: 76, E: 81, X: 72, A: 63, O: 69 }, vaga: "lideranca" },
  { nome: "Karina Elias", email: "karina.elias@exemplo.com", perfil: { C: 81, E: 74, X: 66, A: 86, O: 58 }, vaga: "lideranca" },
  { nome: "Lucas Antunes", email: "lucas.antunes@exemplo.com", perfil: { C: 69, E: 88, X: 83, A: 47, O: 74 }, vaga: "lideranca" },
];

function simularRespostas(
  perfil: Record<Fator, number>,
  itensDaForma: string[],
  opcoes: { respostasD?: number[]; semente: string },
): Respostas {
  const aleatorio = criarAleatorio(opcoes.semente);
  const respostasD = [...(opcoes.respostasD ?? [2, 1, 2, 2])];
  const respostas: Respostas = {};

  for (const id of itensDaForma) {
    const item = ITEM_POR_ID.get(id)!;
    if (item.fator === "D") {
      respostas[id] = respostasD.shift() ?? 2;
      continue;
    }
    const desejado =
      1 + (perfil[item.fator as Fator] / 100) * 4 + (aleatorio() * 1.2 - 0.6);
    const bruto = Math.min(5, Math.max(1, Math.round(desejado)));
    respostas[id] = item.reverso ? 6 - bruto : bruto;
  }

  return respostas;
}

async function semearDemonstracao() {
  console.log("→ demonstração");

  const senha = await bcrypt.hash("prumo123", 10);

  // Operador da plataforma — vive fora de qualquer empresa.
  await prisma.user.upsert({
    where: { email: "admin@prumo.app" },
    create: {
      name: "Operação Prumo",
      email: "admin@prumo.app",
      passwordHash: senha,
      isPlatformAdmin: true,
      role: "OWNER",
    },
    update: { passwordHash: senha, isPlatformAdmin: true },
  });

  const empresa = await prisma.organization.upsert({
    where: { slug: "acme-industrias" },
    create: {
      name: "Acme Indústrias",
      slug: "acme-industrias",
      segment: "Indústria",
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "recrutador@acme.com" },
    create: {
      name: "Marina Coelho",
      email: "recrutador@acme.com",
      passwordHash: senha,
      role: "OWNER",
      organizationId: empresa.id,
    },
    update: { passwordHash: senha, organizationId: empresa.id },
  });

  await prisma.cultureProfile.deleteMany({ where: { organizationId: empresa.id } });
  await prisma.cultureProfile.create({
    data: {
      organizationId: empresa.id,
      name: "Cultura Acme",
      description:
        "Como o time que já está aqui se comporta. Serve de referência de encaixe cultural — nunca de critério de corte.",
      isDefault: true,
      dimensions: {
        C: { tipo: "maior_melhor", peso: 4, faixa: [65, 100] },
        E: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
        X: { tipo: "faixa_otima", peso: 2, faixa: [45, 80] },
        A: { tipo: "faixa_otima", peso: 4, faixa: [55, 85] },
        O: { tipo: "faixa_otima", peso: 3, faixa: [50, 85] },
      },
    },
  });

  // Vagas
  const vagasPorPreset = new Map<string, string>();
  const definicoes = [
    { presetId: "vendas_cacador", titulo: "Executivo de Vendas — Prospecção", departamento: "Comercial", senioridade: "MID" as const, modelo: "HYBRID" as const },
    { presetId: "administrativo_financeiro", titulo: "Analista Financeiro Pleno", departamento: "Financeiro", senioridade: "MID" as const, modelo: "ONSITE" as const },
    { presetId: "lideranca", titulo: "Coordenador de Operações", departamento: "Operações", senioridade: "MANAGER" as const, modelo: "ONSITE" as const },
  ];

  for (const def of definicoes) {
    const preset = PRESET_POR_ID.get(def.presetId)!;
    const existente = await prisma.job.findFirst({
      where: { organizationId: empresa.id, title: def.titulo },
    });

    const vaga =
      existente ??
      (await prisma.job.create({
        data: {
          organizationId: empresa.id,
          title: def.titulo,
          department: def.departamento,
          seniority: def.senioridade,
          workModel: def.modelo,
          status: "OPEN",
          description:
            "Vaga de demonstração criada pelo seed. O perfil-alvo veio do preset e pode ser ajustado livremente.",
          requirements: "Experiência prévia na função e disponibilidade imediata.",
          presetId: preset.id,
          targetProfile: preset.dimensoes as never,
        },
      }));

    vagasPorPreset.set(def.presetId, vaga.id);
  }

  // Candidatos e avaliações — com resultado calculado pelo motor de verdade.
  let criadas = 0;
  for (const [indice, pessoa] of PESSOAS_DEMO.entries()) {
    const vagaId = vagasPorPreset.get(pessoa.vaga)!;
    const vaga = await prisma.job.findUniqueOrThrow({ where: { id: vagaId } });

    const candidato = await prisma.candidate.upsert({
      where: {
        organizationId_email: { organizationId: empresa.id, email: pessoa.email },
      },
      create: {
        organizationId: empresa.id,
        name: pessoa.nome,
        email: pessoa.email,
      },
      update: { name: pessoa.nome },
    });

    const jaTem = await prisma.assessment.findFirst({
      where: { candidateId: candidato.id, jobId: vagaId },
    });
    if (jaTem) continue;

    const semente = `demo-${pessoa.email}`;
    const forma = montarForma({ semente, versao: VERSAO_DO_INSTRUMENTO });
    const respostas = simularRespostas(pessoa.perfil, forma.itens, {
      respostasD: pessoa.respostasD,
      semente,
    });

    const segundosPorItem = pessoa.segundosPorItem ?? 5 + (indice % 4);
    const duracaoMs = Math.round(segundosPorItem * forma.itens.length * 1000);

    // Respostas de cenário coerentes com o fator dominante da pessoa.
    const fatorDominante = (Object.entries(pessoa.perfil) as Array<[Fator, number]>)
      .sort((a, b) => b[1] - a[1])[0][0];
    const fatorMaisFraco = (Object.entries(pessoa.perfil) as Array<[Fator, number]>)
      .sort((a, b) => a[1] - b[1])[0][0];

    const respostasDeCenario = forma.cenarios.map((blocoId) => {
      const bloco = CENARIOS.find((c) => c.id === blocoId)!;
      const primeira =
        bloco.opcoes.find((o) => o.fator === fatorDominante) ?? bloco.opcoes[0];
      const ultima =
        bloco.opcoes.find(
          (o) => o.fator === fatorMaisFraco && o.id !== primeira.id,
        ) ?? bloco.opcoes.find((o) => o.id !== primeira.id)!;
      return { blocoId, primeiraId: primeira.id, ultimaId: ultima.id };
    });

    const resultado = escorar({
      respostas,
      itensDaForma: forma.itens,
      perfilAlvo: vaga.targetProfile as never,
      respostasDeCenario,
      duracaoMs,
    });

    const concluidoEm = new Date(Date.now() - (indice + 1) * 8 * 3600 * 1000);

    const avaliacao = await prisma.assessment.create({
      data: {
        organizationId: empresa.id,
        jobId: vagaId,
        candidateId: candidato.id,
        status: "COMPLETED",
        instrumentVersion: VERSAO_DO_INSTRUMENTO,
        seed: semente,
        itemOrder: forma.itens as never,
        scenarioOrder: forma.cenarios as never,
        scores: resultado.escores as never,
        facetNotes: resultado.facetas as never,
        fitScore: resultado.fit.score,
        fitDetail: {
          puxaramPraCima: resultado.fit.puxaramPraCima,
          puxaramPraBaixo: resultado.fit.puxaramPraBaixo,
          ignoradas: resultado.fit.ignoradas,
          contribuicoes: resultado.fit.contribuicoes,
        } as never,
        confidence: resultado.confianca as never,
        archetypeId: resultado.arquetipo.id,
        archetypeMixedWith: resultado.arquetipo.segundoId ?? null,
        startedAt: new Date(concluidoEm.getTime() - duracaoMs),
        completedAt: concluidoEm,
        durationMs: duracaoMs,
        consentAt: new Date(concluidoEm.getTime() - duracaoMs - 30000),
      },
    });

    await prisma.itemResponse.createMany({
      data: forma.itens.map((itemId) => ({
        assessmentId: avaliacao.id,
        itemId,
        value: respostas[itemId],
        elapsedMs: Math.round(segundosPorItem * 1000),
      })),
    });

    await prisma.scenarioResponse.createMany({
      data: respostasDeCenario.map((r) => ({
        assessmentId: avaliacao.id,
        blockId: r.blocoId,
        firstActionId: r.primeiraId,
        lastActionId: r.ultimaId,
        elapsedMs: 22000,
      })),
    });

    criadas++;
  }

  console.log(`  empresa Acme Indústrias, 3 vagas, ${criadas} avaliações novas`);
  console.log("  login empresa: recrutador@acme.com / prumo123");
  console.log("  login plataforma: admin@prumo.app / prumo123");
}

async function main() {
  console.log(`Seed — instrumento ${VERSAO_DO_INSTRUMENTO}`);
  await semearInstrumento();

  if (process.env.SEED_DEMO === "1") {
    await semearDemonstracao();
  } else {
    console.log("→ demonstração pulada (rode com SEED_DEMO=1 para popular)");
  }

  console.log(`\n${PRESETS.length} perfis-alvo disponíveis em código.`);
  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error(erro);
  await prisma.$disconnect();
  process.exit(1);
});
