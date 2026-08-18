import { describe, expect, it } from "vitest";

import type { UserRole } from "@/generated/prisma/enums";
import {
  DESCRICAO_DE_PERMISSAO,
  ErroDeAutorizacao,
  PAPEIS,
  PERMISSOES,
  PERMISSOES_POR_PAPEL,
  papeisQuePodeConceder,
  pode,
  podeAoMenos,
  permissoesDe,
  respostaDeAutorizacao,
  type Permissao,
} from "./permissoes";

describe("o que o modelo passou a conseguir dizer", () => {
  /**
   * A frase inteira do modelo, num teste.
   *
   * Com a hierarquia linear que existia antes, "só leitura" queria dizer
   * leitura de TUDO: quem via a lista via também o relatório comportamental e
   * baixava o CSV da base, porque a única forma de negar o relatório era negar
   * o painel junto. Estas três linhas são o que a escada não escrevia.
   */
  it("VIEWER acompanha o processo sem ler as pessoas", () => {
    expect(pode("VIEWER", "candidato:ler")).toBe(true);
    expect(pode("VIEWER", "candidato:ler_perfil")).toBe(false);
    expect(pode("VIEWER", "dados:exportar")).toBe(false);
  });

  it("ler na tela e baixar em arquivo são permissões diferentes", () => {
    // Não é sinônimo: o arquivo escapa da auditoria de leitura e do expurgo por
    // retenção. Um papel futuro pode ter uma sem a outra.
    const soLeitura: Permissao[] = ["vaga:ler", "candidato:ler", "candidato:ler_perfil"];
    expect(soLeitura.includes("dados:exportar" as Permissao)).toBe(false);
  });
});

describe("presets", () => {
  it("ninguém entra no painel sem enxergar nada", () => {
    for (const papel of PAPEIS) {
      expect(pode(papel, "vaga:ler"), papel).toBe(true);
      expect(pode(papel, "candidato:ler"), papel).toBe(true);
    }
  });

  it("escrever sobre vaga e candidato começa no RECRUITER", () => {
    for (const permissao of [
      "vaga:criar",
      "vaga:editar",
      "vaga:encerrar",
      "candidato:convidar",
      "parecer:escrever",
      "dados:exportar",
    ] as const) {
      expect(pode("VIEWER", permissao), permissao).toBe(false);
      expect(pode("RECRUITER", permissao), permissao).toBe(true);
    }
  });

  it("gerir equipe é de ADMIN para cima", () => {
    expect(pode("RECRUITER", "equipe:gerenciar")).toBe(false);
    expect(pode("ADMIN", "equipe:gerenciar")).toBe(true);
    expect(pode("OWNER", "equipe:gerenciar")).toBe(true);
  });

  it("retenção e chaves de API são só do dono", () => {
    for (const permissao of ["retencao:configurar", "chave_api:gerenciar"] as const) {
      expect(pode("ADMIN", permissao), permissao).toBe(false);
      expect(pode("OWNER", permissao), permissao).toBe(true);
    }
  });

  it("o OWNER tem tudo", () => {
    expect([...permissoesDe("OWNER")].sort()).toEqual([...PERMISSOES].sort());
  });

  it("nenhum preset inventa permissão que não existe", () => {
    const conhecidas = new Set<string>(PERMISSOES);
    for (const [papel, lista] of Object.entries(PERMISSOES_POR_PAPEL))
      for (const permissao of lista)
        expect(conhecidas.has(permissao), `${papel} → ${permissao}`).toBe(true);
  });

  it("toda permissão tem descrição — a tela de equipe mostra o texto, não o id", () => {
    for (const permissao of PERMISSOES)
      expect(DESCRICAO_DE_PERMISSAO[permissao]?.length ?? 0, permissao).toBeGreaterThan(0);
  });

  it("permissão desconhecida é negada, não ignorada", () => {
    expect(pode("OWNER", "vaga:apagar_tudo" as Permissao)).toBe(false);
    expect(pode("MARCIANO" as UserRole, "vaga:ler")).toBe(false);
  });
});

describe("quem pode conceder qual papel", () => {
  /**
   * A trava que impede `equipe:gerenciar` de virar escada para virar OWNER: um
   * ADMIN que promovesse alguém a OWNER teria contornado a única permissão que
   * não tem, bastando promover um cúmplice — ou a si mesmo pela mão dele.
   */
  it("ninguém concede acima do próprio papel", () => {
    expect(papeisQuePodeConceder("ADMIN")).toEqual(["VIEWER", "RECRUITER", "ADMIN"]);
    expect(papeisQuePodeConceder("OWNER")).toEqual([
      "VIEWER",
      "RECRUITER",
      "ADMIN",
      "OWNER",
    ]);
  });

  it("a régua de hierarquia sobrevive só para isso", () => {
    expect(podeAoMenos("ADMIN", "OWNER")).toBe(false);
    expect(podeAoMenos("OWNER", "ADMIN")).toBe(true);
  });
});

describe("recusa em rota de arquivo", () => {
  /**
   * O corpo tem que ser texto legível e o status 403. Devolver redirecionamento
   * aqui faria o navegador salvar a página de login com extensão .csv — o
   * download "funciona" e o arquivo é lixo.
   */
  it("vira 403 com corpo legível, não redirecionamento", async () => {
    const resposta = respostaDeAutorizacao(
      new ErroDeAutorizacao("Seu perfil de acesso não permite exportar.", 403),
    );

    expect(resposta).not.toBeNull();
    expect(resposta!.status).toBe(403);
    expect(resposta!.headers.get("Cache-Control")).toBe("no-store");
    await expect(resposta!.text()).resolves.toContain("não permite exportar");
  });

  it("erro que não é de autorização passa direto — quem chamou relança", () => {
    expect(respostaDeAutorizacao(new Error("banco caiu"))).toBeNull();
  });
});
