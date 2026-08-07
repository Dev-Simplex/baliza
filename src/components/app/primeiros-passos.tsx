"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Painel } from "@/components/ui/painel";
import { concluirPrimeirosPassos } from "@/lib/actions/sessao";
import { cn } from "@/lib/utils";

type Passo = {
  titulo: string;
  descricao: string;
  feito: boolean;
  href?: string;
  acao?: string;
};

/**
 * Primeiros passos — o tutorial do painel.
 *
 * Não é um passeio guiado com balões por cima da tela: é uma lista do caminho
 * real, que se marca sozinha conforme a pessoa faz. Quem já sabe fecha e não vê
 * mais; quem está começando tem a sequência inteira à vista, incluindo a parte
 * que ninguém adivinha — que o ranking só existe depois que alguém responde.
 *
 * O estado mora no usuário, não no navegador, para não voltar a aparecer quando
 * ele troca de máquina.
 */
export function PrimeirosPassos({
  temVaga,
  temCandidato,
  temResposta,
}: {
  temVaga: boolean;
  temCandidato: boolean;
  temResposta: boolean;
}) {
  const [escondido, setEscondido] = useState(false);
  const [salvando, iniciarTransicao] = useTransition();

  const passos: Passo[] = [
    {
      titulo: "Crie uma vaga",
      descricao:
        "O perfil-alvo vem de um preset editável. É contra ele que a aderência é calculada.",
      feito: temVaga,
      href: "/vagas/nova",
      acao: "Criar vaga",
    },
    {
      titulo: "Dê acesso a um candidato",
      descricao:
        "Cadastre a pessoa e entregue o acesso por link, QR Code ou código de 4 dígitos. Em vaga aberta, basta colar o link no anúncio.",
      feito: temCandidato,
      href: temVaga ? "/vagas" : undefined,
      acao: "Ir para as vagas",
    },
    {
      titulo: "Espere a resposta",
      descricao:
        // Sem número fixo: o tempo agora depende da bateria que a vaga
        // escolheu (de 5 a 29 min). Quem quiser o número exato o lê na
        // página da vaga, onde ele é calculado.
        "O tempo depende dos testes que a vaga aplica — a página da vaga mostra. O ranking aparece sozinho quando a primeira pessoa termina.",
      feito: temResposta,
    },
    {
      titulo: "Leia com o roteiro na mão",
      descricao:
        "A aderência nunca vem sozinha: ao lado dela estão o que puxou pra cima, o que puxou pra baixo e as perguntas para fazer na entrevista.",
      feito: temResposta,
      href: temResposta ? "/candidatos" : undefined,
      acao: "Ver candidatos",
    },
  ];

  const concluidos = passos.filter((p) => p.feito).length;

  function dispensar() {
    setEscondido(true);
    iniciarTransicao(async () => {
      await concluirPrimeirosPassos();
    });
  }

  if (escondido) return null;

  return (
    <Painel className="relative">
      <button
        type="button"
        onClick={dispensar}
        disabled={salvando}
        aria-label="Não mostrar mais os primeiros passos"
        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="pr-8">
        <p className="etiqueta">Primeiros passos</p>
        <h2 className="mt-1.5 text-base font-semibold">
          Do zero ao primeiro ranking
        </h2>
        <p className="mt-1 t-corpo-sm text-muted-foreground">
          {concluidos} de {passos.length} — a lista some sozinha quando terminar.
        </p>
      </div>

      <ol className="mt-5 space-y-3">
        {passos.map((passo, i) => (
          <li key={passo.titulo} className="flex gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                passo.feito
                  ? "border-dentro/40 bg-dentro/10 text-dentro"
                  : "text-muted-foreground",
              )}
            >
              {passo.feito ? <Check className="size-3.5" /> : i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  passo.feito && "text-muted-foreground line-through",
                )}
              >
                {passo.titulo}
              </p>
              <p className="mt-0.5 t-legenda leading-relaxed text-muted-foreground">
                {passo.descricao}
              </p>

              {!passo.feito && passo.href && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-1.5"
                  nativeButton={false}
                  render={<Link href={passo.href} />}
                >
                  {passo.acao}
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Painel>
  );
}
