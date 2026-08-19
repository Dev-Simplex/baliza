import { describe, expect, it, vi } from "vitest";

import type { Contexto } from "@/lib/tenant";

/**
 * O que a tela de Configurações recusa, e com que frase.
 *
 * Só os caminhos de RECUSA: eles retornam antes de encostar no banco, e é isso
 * que deixa este teste rodar em máquina limpa, sem Postgres — como o resto da
 * suíte. O caminho feliz é gravação, e gravação se confere contra banco de
 * verdade, não contra dublê.
 *
 * A recusa importa porque o texto dela vai PARA A TELA. Um esquema que devolve
 * "Invalid input: expected string, received null" tecnicamente validou; para
 * quem está com o formulário aberto, ele não disse nada.
 */

const contexto = {
  userId: "u1",
  organizationId: "o1",
  role: "OWNER",
  nome: "Dona",
  email: "dona@exemplo.com",
  isPlatformAdmin: false,
  pode: () => true,
} as unknown as Contexto;

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/tenant", () => ({ exigirPermissao: async () => contexto }));

/**
 * Banco dublê, e só para o caminho feliz de UM caso.
 *
 * O dublê existe para o teste de campo ausente poder atravessar a validação
 * inteira sem Postgres. Ele não confere gravação — isso se faz contra banco de
 * verdade — mas confere o que a validação ENTREGA à gravação, que é onde mora
 * a regra de que vazio vira null.
 */
const gravado: { dados?: Record<string, unknown> } = {};
vi.mock("@/lib/audit", () => ({ registrarAuditoria: async () => {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUniqueOrThrow: async () => ({
        name: "Acme",
        segment: null,
        website: null,
        document: null,
        retentionMonths: 12,
      }),
      update: async (args: { data: Record<string, unknown> }) => {
        gravado.dados = args.data;
        return {};
      },
    },
  },
}));

const { atualizarEmpresa, atualizarRetencao } = await import("./empresa");

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

describe("dados da empresa", () => {
  it("exige nome com pelo menos dois caracteres", async () => {
    const r = await atualizarEmpresa({}, formulario({ nome: "A" }));
    expect(r.erro).toMatch(/2 caracteres/);
  });

  it("recusa site sem protocolo, dizendo qual é o remédio", async () => {
    const r = await atualizarEmpresa(
      {},
      formulario({ nome: "Acme", site: "acme.com.br" }),
    );
    expect(r.erro).toMatch(/https/);
  });

  /**
   * Campo AUSENTE é campo vazio, e não erro.
   *
   * `FormData.get` devolve null para o que não veio. Uma aba aberta desde antes
   * da última publicação pode postar um formulário sem um campo que passou a
   * existir depois — é o mesmo cenário que `versao-velha.ts` trata — e a pessoa
   * receberia "expected string, received null" em vez de conseguir salvar.
   */
  it("aceita formulário sem os campos opcionais, e grava vazio como null", async () => {
    const r = await atualizarEmpresa({}, formulario({ nome: "Acme" }));
    expect(r).toEqual({ ok: true });
    expect(gravado.dados).toEqual({
      name: "Acme",
      segment: null,
      website: null,
      document: null,
    });
  });
});

describe("prazo de retenção", () => {
  it("recusa prazo fora da lista fechada", async () => {
    const r = await atualizarRetencao({}, formulario({ meses: "999" }));
    expect(r).toEqual({ erro: "Prazo inválido." });
  });

  it("recusa prazo que não é número", async () => {
    const r = await atualizarRetencao({}, formulario({ meses: "doze" }));
    expect(r).toEqual({ erro: "Prazo inválido." });
  });
});
