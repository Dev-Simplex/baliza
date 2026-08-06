"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  ListChecks,
  Loader2,
  Lock,
  Save,
} from "lucide-react";

import { Marca } from "@/components/marca";
import type { TipoDePergunta } from "@/components/teste/tipos-da-prova";
import { Button } from "@/components/ui/button";
import { iniciarAvaliacao } from "@/lib/actions/avaliacao";
import { minutosDaBateria, type Teste } from "@/lib/instrument/baterias";
import { cn } from "@/lib/utils";

/** O bastante para anunciar a etapa; o conteúdo das perguntas não vem aqui. */
export type ResumoDaEtapa = {
  teste: Teste;
  nome: string;
  perguntas: Array<{ tipo: TipoDePergunta }>;
};

/**
 * Tela de abertura.
 *
 * O candidato precisa de três informações antes de começar, e nenhuma delas é
 * marketing: quanto tempo leva, o que acontece com a resposta dele, e que não
 * existe resposta certa. Tudo o mais é ruído entre a pessoa e a primeira
 * pergunta.
 *
 * Com bateria, entra uma quarta: QUANTOS testes são. Descobrir no meio do
 * caminho que ainda vem outro teste é a forma mais barata de perder alguém que
 * já tinha respondido metade — e prova incompleta não vira relatório.
 */
export function TelaDeAbertura({
  token,
  empresa,
  vaga,
  nome,
  etapas,
}: {
  token: string;
  empresa: string;
  vaga: string;
  nome: string | null;
  etapas: ResumoDaEtapa[];
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  // O tempo aqui é o PROMETIDO pelo catálogo — o mesmo número que o recrutador
  // viu ao montar a vaga, e sempre o teto da faixa do manual. A estimativa
  // afinada do que falta é outra conta, e ela só aparece com a prova andando.
  const minutos = minutosDaBateria(etapas.map((e) => e.teste));
  const totalDePerguntas = etapas.reduce((a, e) => a + e.perguntas.length, 0);

  function comecar() {
    setErro(null);
    iniciarTransicao(async () => {
      // Antes, qualquer falha aqui era silenciosa: o botão voltava ao normal e
      // a tela continuava a mesma, o que é indistinguível de um toque que não
      // pegou. A pessoa toca de novo, de novo, e desiste.
      try {
        const r = await iniciarAvaliacao(token);
        if (!r.ok) {
          setErro(r.erro ?? "Não foi possível abrir o questionário.");
          return;
        }
        router.refresh();
      } catch {
        setErro(
          "Não conseguimos abrir agora — verifique sua conexão e toque de novo.",
        );
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col px-6 py-8">
      <header>
        <Marca href={null} />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="etiqueta">
          {empresa} · {vaga}
        </p>

        <h1 className="mt-4 t-titulo">
          {nome ? `${nome.split(" ")[0]}, vamos` : "Vamos"} mapear como você
          trabalha.
        </h1>

        <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
          Não é prova e não existe resposta certa. São afirmações sobre o dia a
          dia de trabalho, e a única resposta útil é a sincera: o mapeamento só
          ajuda a te colocar no lugar certo se ele for mesmo sobre você.
        </p>

        <ul className="mt-8 space-y-3.5">
          <Linha Icone={Clock} titulo={`Cerca de ${minutos} minutos`}>
            {etapas.length === 1
              ? `${totalDePerguntas} perguntas, uma de cada vez.`
              : `${etapas.length} testes, ${totalDePerguntas} perguntas no total — um teste por vez.`}
          </Linha>

          {/* Com mais de um teste, dizer QUAIS são não é detalhe: é o que
              transforma "quanto ainda falta disso?" em "falta o terceiro". */}
          {etapas.length > 1 && (
            <Linha Icone={ListChecks} titulo="Na ordem">
              {etapas.map((e, i) => (
                <span key={e.teste}>
                  {i > 0 && " · "}
                  {e.nome.split(" — ")[0]} ({e.perguntas.length})
                </span>
              ))}
            </Linha>
          )}
          <Linha Icone={Save} titulo="Salva sozinho">
            Pode fechar e continuar depois pelo mesmo link, de onde parou.
          </Linha>
          <Linha Icone={Lock} titulo="Vai direto para a empresa">
            O resultado é lido por quem conduz o processo. Você pode pedir acesso
            aos seus dados a qualquer momento a quem te enviou o convite.
          </Linha>
        </ul>

        {erro && (
          <p
            role="alert"
            className="mt-8 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm leading-relaxed text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {erro}
          </p>
        )}

        <Button
          onClick={comecar}
          disabled={pendente}
          size="lg"
          className={cn("h-11 w-full gap-2 t-corpo", erro ? "mt-4" : "mt-9")}
        >
          {pendente ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Preparando
            </>
          ) : (
            <>
              Começar
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        {/* Quem entra por convite nunca marcou caixa nenhuma: o cadastro foi
            feito pela empresa. É este toque que é o aceite, então ele precisa
            dizer a que se está concordando — e o carimbo de consentimento é
            gravado aqui, não na hora em que o RH criou o convite. */}
        <p className="mt-3 t-legenda leading-relaxed text-muted-foreground">
          Ao começar, você concorda que suas respostas sejam usadas por{" "}
          {empresa} para avaliar sua aderência a esta vaga. Nenhum dado sensível
          é pedido, e você pode solicitar a exclusão a qualquer momento.
        </p>
      </main>

      <footer className="t-legenda leading-relaxed text-muted-foreground">
        Este é um questionário de autopercepção de comportamento no trabalho. Não
        é teste psicológico nem avaliação psicológica, e o resultado é um insumo
        para a conversa — não uma decisão automática.
      </footer>
    </div>
  );
}

function Linha({
  Icone,
  titulo,
  children,
}: {
  Icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary">
        <Icone className="size-4 text-marca" />
      </span>
      <div>
        <p className="t-corpo font-medium">{titulo}</p>
        <p className="t-corpo-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  );
}
