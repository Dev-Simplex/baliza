import { describe, expect, it } from "vitest";

import { ErroDeAutorizacao, podeAoMenos, respostaDeAutorizacao } from "./permissoes";

/**
 * A régua de papéis e a forma da recusa.
 *
 * Existe por causa de um defeito real: as rotas de exportação (CSV da base e
 * PDF do candidato) ficaram atrás de `exigirTenant()` só, e um VIEWER — o papel
 * de MENOR privilégio — baixava tudo. O teste não impede alguém de esquecer a
 * trava numa rota nova; o que ele tranca é a régua embaixo dela, para que
 * "VIEWER não alcança RECRUITER" não vire verdade por acidente de ordenação.
 */
describe("régua de papéis", () => {
  it("VIEWER não alcança RECRUITER — é o degrau que separa ler de exportar", () => {
    expect(podeAoMenos("VIEWER", "RECRUITER")).toBe(false);
    expect(podeAoMenos("VIEWER", "VIEWER")).toBe(true);
  });

  it("quem está acima alcança quem está abaixo", () => {
    expect(podeAoMenos("RECRUITER", "RECRUITER")).toBe(true);
    expect(podeAoMenos("ADMIN", "RECRUITER")).toBe(true);
    expect(podeAoMenos("OWNER", "RECRUITER")).toBe(true);
    expect(podeAoMenos("OWNER", "ADMIN")).toBe(true);
  });

  it("ninguém de baixo alcança quem está acima", () => {
    expect(podeAoMenos("RECRUITER", "ADMIN")).toBe(false);
    expect(podeAoMenos("ADMIN", "OWNER")).toBe(false);
  });
});

describe("recusa em rota de arquivo", () => {
  /**
   * O corpo tem que ser texto legível e o status tem que ser 403. Devolver
   * redirecionamento aqui faria o navegador salvar a página de login com
   * extensão .csv — o download "funciona" e o arquivo é lixo.
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
