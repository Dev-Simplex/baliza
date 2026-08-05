import { z } from "zod";

import {
  FATORES,
  NOMES_DE_FATOR,
  type PerfilAlvo,
  type TipoDeDimensao,
} from "@/lib/instrument/types";

/**
 * Leitura e validação do perfil-alvo editado na tela.
 *
 * Mora fora da Server Action de propósito: arquivo `"use server"` só pode
 * exportar função assíncrona, e estas regras são de negócio — precisam de teste
 * sem banco por perto (`perfil-alvo.test.ts`).
 */

/**
 * Largura mínima de uma faixa que pesa, em pontos.
 *
 * O erro de medida de cada dimensão é da ordem de ±5 pontos (8 itens por fator).
 * Uma faixa mais estreita que isso não separa pessoas: separa ruído. E como o
 * cálculo penaliza o desvio até o ideal, faixa de largura zero transforma todo
 * candidato em "fora da faixa" — o ranking inteiro desaba junto.
 */
export const LARGURA_MINIMA_DA_FAIXA = 10;

export const TIPOS_QUE_PESAM: readonly TipoDeDimensao[] = [
  "maior_melhor",
  "faixa_otima",
  "menor_melhor",
] as const;

const dimensaoEnviada = z.object({
  tipo: z.enum(["maior_melhor", "faixa_otima", "menor_melhor", "irrelevante"]),
  // `coerce`: o que chega de um <form> é sempre string.
  peso: z.coerce.number().int().min(0).max(5),
  min: z.coerce.number().min(0).max(100),
  max: z.coerce.number().min(0).max(100),
});

export type LeituraDoPerfil =
  | { ok: true; perfil: PerfilAlvo }
  | { ok: false; erro: string };

/**
 * Monta o perfil-alvo a partir dos campos `C.tipo`, `C.peso`, `C.min`, `C.max`
 * (e assim por diante) — um conjunto por fator.
 *
 * Recusa em vez de consertar quando o dado não faz sentido para o cálculo, e
 * normaliza quando as duas formas de dizer a mesma coisa divergem.
 */
export function lerPerfilAlvo(dados: FormData): LeituraDoPerfil {
  const perfil = {} as PerfilAlvo;
  let quantasPesam = 0;

  for (const fator of FATORES) {
    const analise = dimensaoEnviada.safeParse({
      tipo: dados.get(`${fator}.tipo`),
      peso: dados.get(`${fator}.peso`),
      min: dados.get(`${fator}.min`),
      max: dados.get(`${fator}.max`),
    });

    if (!analise.success) {
      return {
        ok: false,
        erro: `Valor inválido em ${NOMES_DE_FATOR[fator].ui}. Peso de 0 a 5 e faixa de 0 a 100.`,
      };
    }

    let { tipo, peso } = analise.data;
    const { min, max } = analise.data;

    // "Peso 0" e "não entra na conta" são a MESMA decisão dita de dois jeitos.
    // Guardar as duas em desacordo criaria uma dimensão que a interface mostra
    // como relevante e o motor ignora — ver `calcularFit`, que sai fora no
    // peso 0.
    if (tipo === "irrelevante") peso = 0;
    if (peso === 0) tipo = "irrelevante";

    // A faixa de uma dimensão descartada não entra no cálculo; ela fica
    // guardada só para o dia em que o recrutador voltar a dar peso a ela. Por
    // isso aqui basta ordenar, sem exigir largura.
    const faixa: [number, number] =
      peso === 0
        ? [Math.min(min, max), Math.max(min, max)]
        : [min, max];

    if (peso > 0) {
      if (max - min < LARGURA_MINIMA_DA_FAIXA) {
        return {
          ok: false,
          erro: `A faixa de ${NOMES_DE_FATOR[fator].ui} precisa ter no mínimo ${LARGURA_MINIMA_DA_FAIXA} pontos de largura (o início precisa vir antes do fim).`,
        };
      }
      quantasPesam += 1;
    }

    perfil[fator] = { tipo, peso, faixa };
  }

  if (quantasPesam === 0) {
    return {
      ok: false,
      erro: "Pelo menos uma dimensão precisa ter peso. Sem nenhuma, a aderência de todo mundo seria zero e o ranking não diria nada.",
    };
  }

  return { ok: true, perfil };
}

/**
 * Alvo de uma dimensão — a mesma regra de `idealDaDimensao` (scoring.ts).
 *
 * Duplicada aqui porque a tela de edição é componente de cliente, e importar o
 * motor de escoragem arrastaria os 128 itens do instrumento para o pacote do
 * navegador. Se a regra mudar lá, muda aqui.
 */
export function alvoDaDimensao(cfg: {
  tipo: TipoDeDimensao;
  faixa: [number, number];
  ideal?: number;
}): number {
  if (cfg.ideal != null) return cfg.ideal;
  const [lo, hi] = cfg.faixa;
  if (cfg.tipo === "maior_melhor") return hi;
  if (cfg.tipo === "menor_melhor") return lo;
  return (lo + hi) / 2;
}

/** Rótulos dos tipos, na voz da interface de edição. */
export const ROTULO_DO_TIPO: Record<TipoDeDimensao, string> = {
  maior_melhor: "Quanto mais, melhor",
  faixa_otima: "Faixa ótima — penaliza os dois lados",
  menor_melhor: "Quanto menos, melhor",
  irrelevante: "Não entra na conta",
};

/** Peso em palavra: o recrutador decide importância, não número. */
export const ROTULO_DO_PESO: Record<number, string> = {
  0: "Não entra na conta",
  1: "1 — quase não pesa",
  2: "2 — pesa pouco",
  3: "3 — pesa",
  4: "4 — pesa muito",
  5: "5 — decisiva",
};
