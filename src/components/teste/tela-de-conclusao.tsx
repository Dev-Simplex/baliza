import { Check, Lock, Mail } from "lucide-react";

import { MolduraPublica } from "@/components/teste/moldura-publica";

/**
 * O fim da prova, para o candidato.
 *
 * ─── O que esta tela deliberadamente NÃO faz ───────────────────────────────
 * Não mostra escore, dimensão, arquétipo, gráfico nem as respostas dadas. O
 * resultado e os dados registrados são da empresa que aplicou o teste, e é ela
 * quem decide se, quando e como conversa sobre isso com a pessoa.
 *
 * Isso é uma reversão consciente: até aqui o produto entregava o relatório ao
 * candidato por um endereço próprio (`/r/<token>`), e a promessa aparecia no
 * site, na abertura da prova e no e-mail de convite. Toda essa cópia saiu junto
 * — prometer retorno e não entregar é pior do que não prometer, porque a pessoa
 * termina a prova esperando por uma tela que não existe.
 *
 * O que fica: para onde a pessoa vai quando quiser os próprios dados. A LGPD
 * (art. 18) garante a ela pedir acesso, correção e exclusão; o que mudou foi o
 * caminho — deixou de ser um link automático e passou a ser um pedido à empresa,
 * que é a controladora. Essa frase não é enfeite jurídico: sem ela, a tela
 * fecharia a porta sem dizer onde fica a outra.
 */
export function TelaDeConclusao({
  nome,
  empresa,
  vaga,
}: {
  nome: string | null;
  empresa: string;
  vaga: string;
}) {
  const primeiroNome = nome?.split(" ")[0];

  return (
    <MolduraPublica
      largura="media"
      rodape={
        <>
          Este é um questionário de autopercepção de comportamento no trabalho.
          Não é teste psicológico nem avaliação psicológica, e o resultado é um
          insumo para a conversa — não uma decisão automática.
        </>
      }
    >
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-full bg-dentro-suave text-dentro"
      >
        <Check className="size-5" />
      </span>

      <p className="etiqueta mt-6">
        {empresa} · {vaga}
      </p>

      <h1 className="mt-3 t-titulo">
        {primeiroNome ? `Pronto, ${primeiroNome}.` : "Pronto."} Suas respostas
        foram enviadas.
      </h1>

      {/* Sem artigo antes do nome da empresa, de propósito: "A {empresa}"
          sai errado em metade dos nomes reais ("A Itaú", "A Bradesco") e
          ridículo nos que já vêm com artigo. Começar pelo nome é o único
          jeito que funciona para todos sem pedir o gênero no cadastro. */}
      <p className="mt-4 t-corpo leading-relaxed text-muted-foreground">
        Não falta mais nada da sua parte, e você pode fechar esta página.{" "}
        {empresa} recebeu o seu mapeamento e dá seguimento ao processo pelos
        canais de sempre.
      </p>

      <ul className="mt-8 space-y-3.5">
        <Linha Icone={Lock} titulo="O resultado fica com a empresa">
          A leitura do seu mapeamento é usada por quem conduz o processo
          seletivo, junto da entrevista. Ela não é divulgada nesta tela.
        </Linha>
        <Linha Icone={Mail} titulo="Seus dados continuam sendo seus">
          Você pode pedir acesso, correção ou exclusão a qualquer momento — fale
          com quem te enviou o convite, ou responda o e-mail dele.
        </Linha>
      </ul>
    </MolduraPublica>
  );
}

function Linha({
  Icone,
  titulo,
  children,
}: {
  Icone: typeof Lock;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="t-corpo-sm font-medium">{titulo}</p>
        <p className="t-legenda leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  );
}
