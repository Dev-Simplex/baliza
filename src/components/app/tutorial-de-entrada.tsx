"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChartNoAxesColumn,
  LayoutDashboard,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { concluirTutorialDeEntrada } from "@/lib/actions/sessao";
import { NOMES_DE_FATOR } from "@/lib/instrument/types";

/**
 * A apresentação que abre sozinha na primeira entrada.
 *
 * ─── Ela NÃO substitui a página `/como-funciona` ──────────────────────────
 * As duas respondem perguntas diferentes, e por isso convivem. A página explica
 * o CONCEITO e fica para sempre — é onde alguém volta três dias depois, olhando
 * o primeiro resultado, para descobrir o que significa "aderência 58,1". Esta
 * apresentação ensina ONDE AS COISAS FICAM, coisa que texto nenhum resolve bem,
 * e some depois de vista uma vez.
 *
 * ─── Por que quatro passos, e por que o terceiro é interativo ─────────────
 * O terceiro é o único conceito que, se a pessoa não entender, faz ela usar o
 * produto errado: que o número é aderência A UMA VAGA, e não nota do candidato.
 * Ler isso convence pouco; ver a MESMA pessoa valer 91 numa vaga e 38 em outra,
 * trocando com um clique, convence de primeira. Os outros três passos são texto
 * porque não têm nada para demonstrar.
 *
 * ─── Interromper alguém tem custo, então há regras ────────────────────────
 * · Abre uma vez só, e "pular" conta como visto — quem disse que não quer não
 *   deve reencontrar a caixa amanhã.
 * · Esc e clique fora fecham, como qualquer diálogo. Prender a pessoa dentro
 *   de um tutorial para "garantir" que ela leia é o oposto de ensinar.
 * · Nenhum passo pede dado nem executa ação: é só apresentação. A primeira
 *   coisa que a pessoa fizer no produto vai ser escolha dela.
 */

/** Os números do passo 3 são ILUSTRATIVOS, e a tela diz isso. */
const EXEMPLOS = {
  vendedor: {
    vaga: "Vendedor de loja",
    numero: "91",
    pede: "Energia Social e Abertura ao Novo pesam muito; Organização pesa pouco.",
    porque:
      "Marina é falante, encara cliente novo sem travar e improvisa bem. É quase tudo o que esta vaga pede.",
  },
  conferente: {
    vaga: "Conferente de estoque",
    numero: "38",
    pede: "Organização e Entrega pesam muito; Energia Social não pesa.",
    porque:
      "As mesmas respostas de Marina. Só que aqui o que conta é conferir nota fiscal sem pular linha — e é justamente onde ela é mais fraca.",
  },
} as const;

const ONDE_FICAM = [
  {
    Icone: LayoutDashboard,
    nome: "Visão geral",
    texto: "O resumo de tudo e o que está esperando você.",
  },
  {
    Icone: BriefcaseBusiness,
    nome: "Vagas",
    texto: "Onde tudo começa: você cria a vaga e tira dela o link do candidato.",
  },
  {
    Icone: Users,
    nome: "Candidatos",
    texto: "Quem já respondeu, o resultado de cada um e o seu parecer.",
  },
  {
    Icone: ChartNoAxesColumn,
    nome: "Relatórios",
    texto: "O processo inteiro: quantos responderam, quanto tempo levaram.",
  },
] as const;

export function TutorialDeEntrada({ nome }: { nome?: string | null }) {
  const [aberto, setAberto] = useState(true);
  const [passo, setPasso] = useState(0);
  const [exemplo, setExemplo] = useState<keyof typeof EXEMPLOS>("vendedor");
  const [, transicao] = useTransition();

  const ultimo = 3;

  function encerrar() {
    setAberto(false);
    // Não bloqueia o fechamento: a caixa some na hora e a gravação acontece
    // atrás. Esperar o servidor para fechar um tutorial seria cobrar da pessoa
    // o tempo de uma coisa que ela já decidiu que não quer mais ver.
    transicao(async () => {
      await concluirTutorialDeEntrada();
    });
  }

  const dados = EXEMPLOS[exemplo];

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? setAberto(true) : encerrar())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {passo === 0 && (nome ? `Bem-vindo, ${nome.split(" ")[0]}` : "Bem-vindo ao Prumo")}
            {passo === 1 && "Onde ficam as coisas"}
            {passo === 2 && "A única coisa que costuma confundir"}
            {passo === 3 && "Por onde começar"}
          </DialogTitle>
          <DialogDescription>
            {passo === 0 && "Um minuto, quatro telas. Dá para pular a qualquer momento."}
            {passo === 1 && "São quatro lugares no menu da esquerda."}
            {passo === 2 && "Clique nas duas vagas e veja o que acontece."}
            {passo === 3 && "O caminho mais curto até o primeiro resultado."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-64">
          {/* ─── 1. O que é ────────────────────────────────────────────── */}
          {passo === 0 && (
            <div className="space-y-3 t-corpo leading-relaxed">
              <p>
                O Prumo ajuda a decidir quem chamar para conversar. Você descreve
                o que a vaga pede de comportamento, manda um link para os
                candidatos, e ele mostra quem chega mais perto.
              </p>
              <p className="text-muted-foreground">
                Ele não é prova de conhecimento, não tem resposta certa e{" "}
                <strong className="font-semibold text-foreground">
                  não reprova ninguém
                </strong>
                . Serve para você entrar na entrevista sabendo o que perguntar.
              </p>
            </div>
          )}

          {/* ─── 2. Onde ficam as coisas ───────────────────────────────── */}
          {passo === 1 && (
            <ul className="space-y-2.5">
              {ONDE_FICAM.map(({ Icone, nome: n, texto }) => (
                <li key={n} className="flex gap-3 rounded-lg border p-3">
                  <Icone className="mt-0.5 size-4 shrink-0 text-marca" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n}</p>
                    <p className="t-corpo-sm leading-relaxed text-muted-foreground">
                      {texto}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* ─── 3. O passo interativo ─────────────────────────────────── */}
          {passo === 2 && (
            <div>
              <div
                role="group"
                aria-label="Escolha a vaga para comparar"
                className="flex gap-2"
              >
                {(Object.keys(EXEMPLOS) as Array<keyof typeof EXEMPLOS>).map(
                  (k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setExemplo(k)}
                      aria-pressed={exemplo === k}
                      className={`flex-1 rounded-lg border px-3 py-2 t-corpo-sm transition-colors ${
                        exemplo === k
                          ? "border-marca/50 bg-marca-suave text-marca"
                          : "border-input hover:bg-secondary"
                      }`}
                    >
                      {EXEMPLOS[k].vaga}
                    </button>
                  ),
                )}
              </div>

              <div className="mt-4 rounded-xl border p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Marina Silva</p>
                    <p className="t-legenda text-muted-foreground">
                      a mesma pessoa, a mesma resposta
                    </p>
                  </div>
                  <p
                    aria-live="polite"
                    className="leitura shrink-0 text-3xl font-semibold text-marca"
                  >
                    {dados.numero}
                  </p>
                </div>

                <p className="mt-3 t-corpo-sm leading-relaxed">
                  <strong className="font-medium">Esta vaga pede:</strong>{" "}
                  {dados.pede}
                </p>
                <p className="mt-2 t-corpo-sm leading-relaxed text-muted-foreground">
                  {dados.porque}
                </p>
              </div>

              <p className="mt-3 t-legenda leading-relaxed text-muted-foreground">
                É por isso que o número não é nota: ele mede a distância até{" "}
                <em>uma vaga</em>. Números de exemplo, para ilustrar.
              </p>
            </div>
          )}

          {/* ─── 4. Por onde começar ───────────────────────────────────── */}
          {passo === 3 && (
            <div className="space-y-3 t-corpo leading-relaxed">
              <p>
                Crie uma vaga, ajuste o peso das cinco coisas que o Prumo mede (
                {NOMES_DE_FATOR.C.ui}, {NOMES_DE_FATOR.E.ui}, {NOMES_DE_FATOR.X.ui},{" "}
                {NOMES_DE_FATOR.A.ui} e {NOMES_DE_FATOR.O.ui}) e mande o link
                para uma pessoa. O resultado aparece sozinho quando ela terminar.
              </p>
              <p className="text-muted-foreground">
                No painel fica uma lista de primeiros passos que se marca sozinha
                conforme você avança. E o guia completo, com tudo explicado, mora
                em{" "}
                <Link
                  href="/como-funciona"
                  onClick={encerrar}
                  className="text-marca underline underline-offset-2"
                >
                  Como funciona
                </Link>{" "}
                — sempre no menu, sempre disponível.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          {/* Marcadores de posição: dizem quanto falta sem prometer interação
              que eles não têm — são indicadores, não botões. */}
          <div className="flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-colors ${
                  i === passo ? "bg-marca" : "bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {passo > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPasso((p) => p - 1)}
              >
                Voltar
              </Button>
            )}
            {passo < ultimo ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={encerrar}
                >
                  Pular
                </Button>
                <Button size="sm" onClick={() => setPasso((p) => p + 1)}>
                  Continuar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={encerrar}>
                Começar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
