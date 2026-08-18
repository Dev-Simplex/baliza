import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import type { InstrumentoDeTeste, UserRole } from "../src/generated/prisma/enums";
import { montarProvaDaBateria } from "../src/lib/actions/forma-da-bateria";
import type { ResultadosPorModulo } from "../src/lib/instrument/baterias";
import {
  paraResultadoDeModuloBigFive,
  pontuarBigFive,
  ITENS_BIG_FIVE,
  type RespostasBigFive,
} from "../src/lib/instrument/bigfive";
import {
  BLOCO_DISC_PLANILHA_POR_ID,
  pontuarDiscPlanilha,
} from "../src/lib/instrument/disc-planilha";
import {
  ITEM_ESTILO_EMOCIONAL_POR_ID,
  pontuarEstiloEmocional,
} from "../src/lib/instrument/estilo-emocional";
import { criarAleatorio } from "../src/lib/instrument/form";
import {
  BLOCO_PERFIL_COMPORTAMENTAL_POR_ID,
  pontuarPerfilComportamental,
} from "../src/lib/instrument/perfil-comportamental";
import { PRESET_POR_ID } from "../src/lib/instrument/presets";
import {
  CENARIO_SJT_POR_ID,
  paraResultadoDeModuloSjt,
  pontuarSjt,
  type RespostaSjt,
} from "../src/lib/instrument/sjt";
import { VERSAO_DO_INSTRUMENTO } from "../src/lib/instrument/items";
import { calcularFit } from "../src/lib/instrument/scoring";
import { escoresParaFit } from "../src/lib/instrument/baterias";
import type { PerfilAlvo } from "../src/lib/instrument/types";

/**
 * Dados de teste para conferir o produto inteiro numa passada só.
 *
 * ─── Diferente do `seed.ts` ────────────────────────────────────────────────
 * O seed de demonstração cria três vagas, todas com a bateria da casa e todas
 * com aderência. Isso cobre o caminho feliz e só ele. O que precisa ser
 * conferido depois das mudanças de hoje é justamente o que ele NÃO cria:
 *
 *   · uma vaga por combinação de bateria, incluindo os testes novos;
 *   · uma vaga SEM aderência — a que aplica só DISC e SJT. É a mais importante
 *     de olhar: o fit tem que aparecer como ausente, jamais como zero, porque
 *     zero na tela se lê como "candidato péssimo";
 *   · candidatos em cada estado, e não só concluídos: convidado sem responder,
 *     respondendo agora, concluído sem parecer, concluído com cada decisão;
 *   · uma pessoa por papel, para conferir a matriz de permissões na prática.
 *
 * ─── Escoragem de verdade ──────────────────────────────────────────────────
 * Nada de número inventado: cada módulo é escorado pela mesma função que a
 * conclusão da prova usa. Se um escorador quebrar, este script quebra junto —
 * que é o comportamento desejado para dado de conferência.
 *
 * ─── Uso ───────────────────────────────────────────────────────────────────
 *   pnpm exec tsx prisma/dados-de-teste.ts
 *   pnpm exec tsx prisma/dados-de-teste.ts --limpar   # apaga e recria
 *
 * Idempotente: rodar de novo não duplica. Mexe SÓ na empresa de teste, achada
 * pelo slug — nenhuma outra conta é tocada.
 */

const SLUG = "acme-teste";
const SENHA = "baliza123";

const EQUIPE: Array<{ email: string; nome: string; papel: UserRole }> = [
  { email: "dono@acme-teste.com", nome: "Marina Coelho", papel: "OWNER" },
  { email: "admin@acme-teste.com", nome: "Ana Administradora", papel: "ADMIN" },
  { email: "recrutador@acme-teste.com", nome: "Rui Recrutador", papel: "RECRUITER" },
  { email: "observador@acme-teste.com", nome: "Vera Observadora", papel: "VIEWER" },
];

/** Uma vaga por situação que precisa ser olhada. */
const VAGAS: Array<{
  titulo: string;
  presetId: string;
  bateria: InstrumentoDeTeste[];
  departamento: string;
  /** O que esta vaga existe para provar na tela. */
  confere: string;
}> = [
  {
    titulo: "Executivo de Vendas",
    presetId: "vendas_hunter",
    bateria: ["PRUMO"],
    departamento: "Comercial",
    confere: "o caminho de sempre: aderência, arquétipo, selo e roteiro",
  },
  {
    titulo: "Analista de Dados",
    presetId: "administrativo_financeiro",
    bateria: ["BIG_FIVE", "PERFIL_COMPORTAMENTAL"],
    departamento: "Dados",
    confere: "aderência vinda do Big Five + o inventário novo de 51 telas",
  },
  {
    titulo: "Atendimento ao Cliente",
    presetId: "atendimento",
    bateria: ["DISC", "SJT"],
    departamento: "Atendimento",
    confere: "SEM aderência — o fit tem que estar ausente, nunca zero",
  },
  {
    titulo: "Coordenador de Operações",
    presetId: "lideranca",
    bateria: ["PRUMO", "ESTILO_EMOCIONAL", "PERFIL_COMPORTAMENTAL"],
    departamento: "Operações",
    confere: "bateria longa: os três cartões de módulo lado a lado",
  },
];

type Estado = "convidado" | "respondendo" | "concluido";

const PESSOAS: Array<{
  nome: string;
  email: string;
  vaga: string;
  estado: Estado;
  decisao?: "ADVANCE" | "DOUBT" | "REJECT";
  nota?: string;
}> = [
  { nome: "Beatriz Andrade", email: "beatriz@exemplo.com", vaga: "Executivo de Vendas", estado: "concluido", decisao: "ADVANCE", nota: "Melhor leitura de objeção do grupo. Avança para a final." },
  { nome: "Caio Ferreira", email: "caio@exemplo.com", vaga: "Executivo de Vendas", estado: "concluido", decisao: "DOUBT", nota: "Bom fit, mas o roteiro apontou pressa em fechar. Perguntar na entrevista." },
  { nome: "Daniela Rocha", email: "daniela@exemplo.com", vaga: "Executivo de Vendas", estado: "concluido" },
  { nome: "Eduardo Lima", email: "eduardo@exemplo.com", vaga: "Executivo de Vendas", estado: "respondendo" },
  { nome: "Fernanda Souza", email: "fernanda@exemplo.com", vaga: "Executivo de Vendas", estado: "convidado" },

  { nome: "Gabriel Nunes", email: "gabriel@exemplo.com", vaga: "Analista de Dados", estado: "concluido", decisao: "ADVANCE" },
  { nome: "Helena Martins", email: "helena@exemplo.com", vaga: "Analista de Dados", estado: "concluido" },
  { nome: "Igor Barbosa", email: "igor@exemplo.com", vaga: "Analista de Dados", estado: "convidado" },

  { nome: "Julia Ribeiro", email: "julia@exemplo.com", vaga: "Atendimento ao Cliente", estado: "concluido", decisao: "ADVANCE", nota: "Sem aderência calculada nesta bateria — decisão pelo DISC e pelo SJT." },
  { nome: "Lucas Pereira", email: "lucas@exemplo.com", vaga: "Atendimento ao Cliente", estado: "concluido", decisao: "REJECT", nota: "Duas escolhas de zero ponto no SJT, ambas em conflito com cliente." },
  { nome: "Mariana Alves", email: "mariana@exemplo.com", vaga: "Atendimento ao Cliente", estado: "respondendo" },

  { nome: "Nicolas Teixeira", email: "nicolas@exemplo.com", vaga: "Coordenador de Operações", estado: "concluido", decisao: "DOUBT" },
  { nome: "Olivia Cardoso", email: "olivia@exemplo.com", vaga: "Coordenador de Operações", estado: "concluido" },
  { nome: "Pedro Henrique", email: "pedro@exemplo.com", vaga: "Coordenador de Operações", estado: "convidado" },
];

// ─── Respostas simuladas, deterministicas ──────────────────────────────────

/**
 * Um sorteio por pessoa, com semente. Rodar duas vezes dá o mesmo candidato —
 * senão conferir "o que mudou desde ontem" seria impossível.
 */
function sorteio(semente: string) {
  const r = criarAleatorio(semente);
  return {
    entre: (min: number, max: number) => min + Math.floor(r() * (max - min + 1)),
    de: <T>(lista: readonly T[]) => lista[Math.floor(r() * lista.length)],
  };
}

async function main() {
  const limpar = process.argv.includes("--limpar");

  const empresa = await prisma.organization.upsert({
    where: { slug: SLUG },
    update: {},
    create: {
      slug: SLUG,
      name: "Acme Indústrias (teste)",
      segment: "Indústria",
      website: "https://acme.exemplo.com",
      retentionMonths: 12,
    },
  });

  if (limpar) {
    // Ordem importa: resposta → avaliação → convite → candidato → vaga.
    await prisma.assessment.deleteMany({ where: { organizationId: empresa.id } });
    await prisma.invitation.deleteMany({ where: { organizationId: empresa.id } });
    await prisma.candidate.deleteMany({ where: { organizationId: empresa.id } });
    await prisma.job.deleteMany({ where: { organizationId: empresa.id } });
    console.log("→ dados anteriores apagados");
  }

  // ─── Equipe ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash(SENHA, 10);
  for (const pessoa of EQUIPE) {
    await prisma.user.upsert({
      where: { email: pessoa.email },
      update: { role: pessoa.papel, organizationId: empresa.id, isActive: true },
      create: {
        email: pessoa.email,
        name: pessoa.nome,
        passwordHash: hash,
        role: pessoa.papel,
        organizationId: empresa.id,
        isActive: true,
        onboardingDoneAt: new Date(),
      },
    });
  }

  // ─── Vagas ───────────────────────────────────────────────────────────────
  const vagaPorTitulo = new Map<string, { id: string; perfil: PerfilAlvo; bateria: InstrumentoDeTeste[] }>();

  for (const def of VAGAS) {
    const preset = PRESET_POR_ID.get(def.presetId);
    if (!preset) throw new Error(`preset desconhecido: ${def.presetId}`);

    const existente = await prisma.job.findFirst({
      where: { organizationId: empresa.id, title: def.titulo },
    });

    const vaga = existente
      ? await prisma.job.update({
          where: { id: existente.id },
          data: { testBattery: def.bateria, status: "OPEN", publicEnabled: true },
        })
      : await prisma.job.create({
          data: {
            organizationId: empresa.id,
            title: def.titulo,
            department: def.departamento,
            seniority: "MID",
            workModel: "HYBRID",
            status: "OPEN",
            description: `Vaga de teste. Serve para conferir: ${def.confere}.`,
            requirements: "Experiência prévia na função.",
            presetId: preset.id,
            targetProfile: preset.dimensoes as never,
            testBattery: def.bateria,
          },
        });

    vagaPorTitulo.set(def.titulo, {
      id: vaga.id,
      perfil: vaga.targetProfile as unknown as PerfilAlvo,
      bateria: def.bateria,
    });
  }

  // ─── Candidatos ──────────────────────────────────────────────────────────
  let criados = 0;

  for (const [indice, pessoa] of PESSOAS.entries()) {
    const vaga = vagaPorTitulo.get(pessoa.vaga);
    if (!vaga) throw new Error(`vaga desconhecida: ${pessoa.vaga}`);

    const candidato = await prisma.candidate.upsert({
      where: {
        organizationId_email: { organizationId: empresa.id, email: pessoa.email },
      },
      update: { name: pessoa.nome },
      create: {
        organizationId: empresa.id,
        name: pessoa.nome,
        email: pessoa.email,
      },
    });

    const jaTem = await prisma.assessment.findFirst({
      where: { candidateId: candidato.id, jobId: vaga.id },
    });
    if (jaTem) continue;

    const semente = `teste-${pessoa.email}`;
    const prova = montarProvaDaBateria({ semente, bateria: vaga.bateria });

    const expiraEm = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    const convite = await prisma.invitation.create({
      data: {
        organizationId: empresa.id,
        jobId: vaga.id,
        candidateId: candidato.id,
        email: pessoa.email,
        channel: "LINK",
        status:
          pessoa.estado === "convidado"
            ? "SENT"
            : pessoa.estado === "respondendo"
              ? "STARTED"
              : "COMPLETED",
        sentAt: new Date(Date.now() - (indice + 2) * 3600 * 1000),
        expiresAt: expiraEm,
      },
    });

    // Convidado e ainda não abriu: convite existe, avaliação não. É o estado em
    // que o painel tem que mostrar "aguardando resposta" e oferecer reenvio.
    if (pessoa.estado === "convidado") {
      criados++;
      continue;
    }

    const dado = sorteio(semente);
    const duracaoMs = (6 + (indice % 5)) * 60 * 1000;
    const iniciadoEm = new Date(Date.now() - (indice + 1) * 5 * 3600 * 1000);

    if (pessoa.estado === "respondendo") {
      await prisma.assessment.create({
        data: {
          organizationId: empresa.id,
          jobId: vaga.id,
          candidateId: candidato.id,
          invitationId: convite.id,
          status: "IN_PROGRESS",
          instrumentVersion: VERSAO_DO_INSTRUMENTO,
          seed: semente,
          itemOrder: prova.itens as never,
          scenarioOrder: prova.blocos as never,
          startedAt: iniciadoEm,
          consentAt: iniciadoEm,
        },
      });
      criados++;
      continue;
    }

    // ─── Concluído: escora cada módulo com a função de verdade ─────────────
    const modulos: ResultadosPorModulo = {};

    if (vaga.bateria.includes("BIG_FIVE")) {
      const respostas: RespostasBigFive = {};
      for (const item of ITENS_BIG_FIVE) respostas[item.id] = dado.entre(2, 5);
      modulos.BIG_FIVE = paraResultadoDeModuloBigFive(pontuarBigFive(respostas));
    }

    if (vaga.bateria.includes("DISC")) {
      const respostas = prova.blocos
        .filter((id) => BLOCO_DISC_PLANILHA_POR_ID.has(id))
        .map((id) => {
          const bloco = BLOCO_DISC_PLANILHA_POR_ID.get(id)!;
          return { blocoId: id, alternativaId: dado.de(bloco.opcoes).id };
        });
      modulos.DISC = pontuarDiscPlanilha(respostas);
    }

    if (vaga.bateria.includes("PERFIL_COMPORTAMENTAL")) {
      const respostas = prova.blocos
        .filter((id) => BLOCO_PERFIL_COMPORTAMENTAL_POR_ID.has(id))
        .map((id) => {
          const bloco = BLOCO_PERFIL_COMPORTAMENTAL_POR_ID.get(id)!;
          return { blocoId: id, alternativaId: dado.de(bloco.opcoes).id };
        });
      modulos.PERFIL_COMPORTAMENTAL = pontuarPerfilComportamental(respostas);
    }

    if (vaga.bateria.includes("ESTILO_EMOCIONAL")) {
      const respostas = prova.blocos
        .filter((id) => ITEM_ESTILO_EMOCIONAL_POR_ID.has(id))
        .map((id) => ({
          itemId: id,
          alternativaId: dado.de(["verdadeiro", "falso"] as const),
        }));
      modulos.ESTILO_EMOCIONAL = pontuarEstiloEmocional(respostas);
    }

    if (vaga.bateria.includes("SJT")) {
      const respostas: RespostaSjt[] = prova.blocos
        .filter((id) => CENARIO_SJT_POR_ID.has(id))
        .map((id) => {
          const cenario = CENARIO_SJT_POR_ID.get(id)!;
          return { cenarioId: id, alternativaId: dado.de(cenario.alternativas).id };
        });
      modulos.SJT = paraResultadoDeModuloSjt(pontuarSjt(respostas));
    }

    /*
     * O Mapeamento Baliza precisaria de resposta item a item para escorar de
     * verdade, e isso o `seed.ts` já faz bem. Aqui ele entra pela mesma porta
     * dos outros: os cinco fatores sorteados numa faixa plausível e gravados no
     * módulo. O que este script existe para conferir é a montagem da FICHA com
     * bateria variada — não a psicometria, que tem 339 testes cuidando dela.
     */
    if (vaga.bateria.includes("PRUMO")) {
      modulos.PRUMO = {
        teste: "PRUMO",
        fatores: {
          C: dado.entre(35, 90),
          E: dado.entre(35, 90),
          X: dado.entre(35, 90),
          A: dado.entre(35, 90),
          O: dado.entre(35, 90),
        },
      };
    }

    // A regra que mais importa conferir na tela: sem fonte de fator, o fit é
    // AUSENTE. Nunca zero.
    const fonte = escoresParaFit(modulos);
    const fit = fonte ? calcularFit(fonte.escores, vaga.perfil) : null;

    const concluidoEm = new Date(iniciadoEm.getTime() + duracaoMs);

    await prisma.assessment.create({
      data: {
        organizationId: empresa.id,
        jobId: vaga.id,
        candidateId: candidato.id,
        invitationId: convite.id,
        status: "COMPLETED",
        instrumentVersion: VERSAO_DO_INSTRUMENTO,
        seed: semente,
        itemOrder: prova.itens as never,
        scenarioOrder: prova.blocos as never,
        scores: (fonte?.escores ?? null) as never,
        moduleResults: modulos as never,
        fitScore: fit?.score ?? null,
        fitDetail: fit
          ? ({
              puxaramPraCima: fit.puxaramPraCima,
              puxaramPraBaixo: fit.puxaramPraBaixo,
              ignoradas: fit.ignoradas,
              contribuicoes: fit.contribuicoes,
            } as never)
          : undefined,
        startedAt: iniciadoEm,
        completedAt: concluidoEm,
        durationMs: duracaoMs,
        consentAt: iniciadoEm,
        ...(pessoa.decisao
          ? {
              decision: pessoa.decisao,
              decisionNote: pessoa.nota ?? null,
              decidedAt: new Date(concluidoEm.getTime() + 3600 * 1000),
            }
          : {}),
      },
    });

    criados++;
  }

  // ─── Relatório do que ficou ──────────────────────────────────────────────
  console.log("");
  console.log(`Empresa: ${empresa.name}  ·  /${empresa.slug}`);
  console.log(`Senha de toda a equipe: ${SENHA}`);
  console.log("");
  for (const p of EQUIPE) console.log(`  ${p.papel.padEnd(10)} ${p.email}`);
  console.log("");
  for (const v of VAGAS) console.log(`  ${v.titulo.padEnd(26)} ${v.bateria.join(" + ")}`);
  console.log("");
  console.log(`${criados} candidatos criados nesta execução.`);
  console.log("Rode com --limpar para apagar e recriar do zero.");

  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error(erro);
  await prisma.$disconnect();
  process.exit(1);
});
