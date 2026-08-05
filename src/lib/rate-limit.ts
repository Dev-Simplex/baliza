import { ipAnonimoDaRequisicao, ipEhConfiavel } from "@/lib/ip";
import { prisma } from "@/lib/prisma";

/**
 * Limitação de taxa por janela fixa, com contador em banco.
 *
 * Banco e não memória: o processo Next reinicia a cada deploy e, com mais de
 * uma instância, contador em memória não limita nada — só dá a impressão de
 * limitar, que é pior que não ter.
 *
 * A janela é fixa (não deslizante): mais barata e suficiente pro que ela
 * protege aqui, que é força bruta de login e enxurrada de convite.
 */

export type Resultado = {
  permitido: boolean;
  restantes: number;
  reiniciaEm: Date;
};

export type Opcoes = { max: number; janelaSegundos: number };

export async function limitar(
  chave: string,
  opcoes: Opcoes,
): Promise<Resultado> {
  const agora = new Date();
  const inicioDaJanela = new Date(
    Math.floor(agora.getTime() / (opcoes.janelaSegundos * 1000)) *
      opcoes.janelaSegundos *
      1000,
  );
  const id = `${chave}:${inicioDaJanela.getTime()}`;
  const reiniciaEm = new Date(
    inicioDaJanela.getTime() + opcoes.janelaSegundos * 1000,
  );

  try {
    // O upsert do Prisma vira um `INSERT ... ON CONFLICT DO UPDATE` nativo
    // (conferido no SQL emitido), então duas requisições simultâneas na mesma
    // chave somam as duas. Se algum dia isso virar dois comandos separados, a
    // corrida perde tentativas e o limite passa a superestimar o que sobrou.
    const contador = await prisma.rateLimitCounter.upsert({
      where: { key: id },
      create: { key: id, count: 1, windowStart: inicioDaJanela },
      update: { count: { increment: 1 } },
    });

    return {
      permitido: contador.count <= opcoes.max,
      restantes: Math.max(0, opcoes.max - contador.count),
      reiniciaEm,
    };
  } catch (erro) {
    // Banco indisponível não pode virar porta trancada para todo mundo.
    console.error("[rate-limit] falhou, liberando", erro);
    return { permitido: true, restantes: opcoes.max, reiniciaEm };
  }
}

/**
 * Teto GLOBAL por ação — a rede que segura quando o endereço não vale nada.
 *
 * O limite por IP só protege enquanto o IP for verdade, e sem proxy na frente
 * ele não é (ver `src/lib/ip.ts`): quem inventa um `x-forwarded-for` por
 * requisição ganha um balde por tentativa. Para a maioria das ações isso é
 * aceitável — errar o login não revela nada e o alvo é uma senha de verdade.
 *
 * Para o código de acesso de 4 dígitos, não é: o espaço é de 10.000
 * combinações e a defesa declarada no README É o limite de tentativas. Este
 * teto não depende de origem nenhuma, então nenhum cabeçalho o contorna.
 *
 * Por que só quando o IP NÃO é confiável: atrás de um proxy nosso o limite por
 * IP já resolve, e um teto global vira superfície de negação de serviço —
 * bastaria um cliente esgotá-lo para trancar a tela de todo mundo. Sem proxy,
 * esse risco é o preço de a tela não ser varrível; ela degrada para "use o
 * link que você recebeu", que continua funcionando.
 *
 * 120/hora dá folga larga para o uso real (quem digita código são os poucos
 * candidatos convidados) e transforma a varredura completa em ~83 horas por
 * rodada — contra os poucos minutos de antes.
 *
 * ─── Medido, não deduzido ──────────────────────────────────────────────────
 * 140 POSTs reais em `/acesso`, um `x-forwarded-for` diferente em cada:
 *
 *   · 141 baldes por IP criados, TODOS com contagem 1 — o limite de 6 por IP
 *     não barrou uma única tentativa. Forjar o cabeçalho o anula por completo.
 *   · o teto global contou as 141 e passou a negar da 121ª em diante.
 *
 * O primeiro número é o que importa registrar: a versão anterior deste código
 * anunciava o limite por IP como a defesa do código de 4 dígitos, e a medição
 * mostra que sozinho ele não segura nada. Antes de afrouxar o teto, refaça o
 * experimento em vez de deduzir.
 */
const TETO_GLOBAL: Record<string, Opcoes> = {
  "acesso-por-codigo": { max: 120, janelaSegundos: 3600 },
};

/** Hash do IP: o objetivo é contar, não identificar (LGPD, minimização). */
export async function ipAnonimo() {
  return ipAnonimoDaRequisicao();
}

export async function limitarPorIp(
  acao: string,
  opcoes: Opcoes,
): Promise<Resultado> {
  const porIp = await limitar(`${acao}:${await ipAnonimo()}`, opcoes);

  const teto = TETO_GLOBAL[acao];
  if (!teto || ipEhConfiavel()) return porIp;

  const global = await limitar(`teto-global:${acao}`, teto);
  if (global.permitido) return porIp;

  // Chegar aqui é sinal de varredura, não de movimento: o teto foi
  // dimensionado com folga sobre o uso real. Fica no log porque quem opera
  // precisa saber que está acontecendo — a pessoa que só queria digitar o
  // código está sendo barrada junto.
  console.warn(
    `[rate-limit] teto global de "${acao}" estourado; liberando em ${global.reiniciaEm.toISOString()}`,
  );

  return {
    permitido: false,
    restantes: 0,
    // O mais distante dos dois: dizer que reinicia antes seria mentir.
    reiniciaEm:
      global.reiniciaEm > porIp.reiniciaEm ? global.reiniciaEm : porIp.reiniciaEm,
  };
}

/**
 * Faxina dos contadores vencidos. Não há rota de manutenção: quem chama é o
 * `prisma/manutencao.ts`, pelo cron do servidor, junto do expurgo por retenção.
 */
export async function limparContadoresAntigos() {
  const limite = new Date(Date.now() - 24 * 3600 * 1000);
  const { count } = await prisma.rateLimitCounter.deleteMany({
    where: { windowStart: { lt: limite } },
  });
  return count;
}
