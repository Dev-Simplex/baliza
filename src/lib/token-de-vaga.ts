import { randomBytes } from "node:crypto";

/**
 * O endereço público da vaga.
 *
 * Este é o ÚNICO token do sistema que uma pessoa lê e digita: ele vai colado no
 * anúncio da vaga, ditado no telefone e impresso em cartaz. Um `cuid`
 * (`cms9a6s0100068qlw57svsnwn`) cumpre a função técnica e falha na humana —
 * parece link suspeito e não dá para conferir de bate-pronto se é a vaga certa.
 *
 * Os outros tokens do sistema continuam opacos DE PROPÓSITO, e a diferença não é
 * estética: o do convite (`/t/…`) e o do resultado (`/r/…`) são credenciais —
 * quem tem o token responde ou lê o relatório de alguém. Esses não podem ser
 * legíveis, porque legível é adivinhável.
 */

/** Sufixo aleatório: 6 caracteres base32 ≈ 1 bilhão de possibilidades. */
const TAMANHO_DO_SUFIXO = 6;
const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789"; // sem l/o/0/1 — confundem quem lê

const MAXIMO_DO_SLUG = 48;

export function sufixoAleatorio(tamanho = TAMANHO_DO_SUFIXO) {
  const bytes = randomBytes(tamanho);
  let saida = "";
  for (let i = 0; i < tamanho; i += 1) {
    saida += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return saida;
}

/** "Executivo de Vendas — Prospecção" → "executivo-de-vendas-prospeccao" */
export function apelidar(texto: string) {
  const semAcento = texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const apelido = semAcento
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAXIMO_DO_SLUG)
    // O corte pode ter deixado um hífen solto na ponta.
    .replace(/-+$/g, "");

  // Título só com símbolos ou em alfabeto não-latino: o sufixo carrega sozinho.
  return apelido || "vaga";
}

/**
 * Token público a partir do título. O sufixo não é enfeite: sem ele, duas vagas
 * com o mesmo título colidiriam, e o endereço seria adivinhável a partir do
 * anúncio — qualquer um mandaria respostas para uma vaga que nunca foi
 * divulgada.
 */
export function gerarTokenDeVaga(titulo: string) {
  return `${apelidar(titulo)}-${sufixoAleatorio()}`;
}
