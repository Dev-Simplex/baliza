"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  entrarPeloLinkDaVaga,
  type EstadoDaEntrada,
} from "@/lib/actions/avaliacao";

export function FormularioDeEntrada({ publicToken }: { publicToken: string }) {
  const [estado, acao, pendente] = useActionState(
    entrarPeloLinkDaVaga.bind(null, publicToken),
    {} as EstadoDaEntrada,
  );

  return (
    <form action={acao} className="mt-5 space-y-4">
      {/* `h-11` nos campos: a altura padrão do sistema de design é de painel,
          onde se usa mouse. Aqui é o primeiro toque de um candidato no celular,
          e campo de 32 px é alvo de dedo ruim — o custo de errar é a resposta
          inteira. */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          name="nome"
          required
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          tamanho="lg"
          aria-invalid={Boolean(estado.campos?.nome)}
          aria-describedby={estado.campos?.nome ? "erro-nome" : undefined}
        />
        {estado.campos?.nome && (
          <p id="erro-nome" className="text-xs text-destructive">
            {estado.campos.nome}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="go"
          tamanho="lg"
          aria-invalid={Boolean(estado.campos?.email)}
          aria-describedby={
            estado.campos?.email ? "erro-email-candidato" : "ajuda-email"
          }
        />
        {estado.campos?.email ? (
          <p id="erro-email-candidato" className="text-xs text-destructive">
            {estado.campos.email}
          </p>
        ) : (
          <p id="ajuda-email" className="t-legenda text-muted-foreground">
            É por ele que a empresa te identifica no processo.
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 t-corpo-sm leading-relaxed">
        <input
          type="checkbox"
          name="consentimento"
          required
          className="mt-0.5 size-4 shrink-0 accent-[var(--marca-sinal)]"
        />
        <span className="text-muted-foreground">
          Concordo que minhas respostas sejam usadas para avaliar minha aderência
          a esta vaga, e sei que posso pedir a exclusão dos meus dados a qualquer
          momento.
        </span>
      </label>
      {estado.campos?.consentimento && (
        <p className="text-xs text-destructive">{estado.campos.consentimento}</p>
      )}

      {estado.erro && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {estado.erro}
        </div>
      )}

      <Button
        type="submit"
        variant="marca"
        disabled={pendente}
        size="lg"
        className="w-full"
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
    </form>
  );
}
