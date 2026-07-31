"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { cadastrar, type EstadoDoFormulario } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INICIAL: EstadoDoFormulario = {};

export function FormularioDeCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, INICIAL);

  return (
    <form action={acao} className="mt-8 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="empresa">Empresa</Label>
        <Input
          id="empresa"
          name="empresa"
          required
          placeholder="Acme Indústrias"
          aria-invalid={Boolean(estado.campos?.empresa)}
        />
        {estado.campos?.empresa && (
          <p className="text-xs text-destructive">{estado.campos.empresa}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Seu nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          autoComplete="name"
          placeholder="Marina Coelho"
          aria-invalid={Boolean(estado.campos?.nome)}
        />
        {estado.campos?.nome && (
          <p className="text-xs text-destructive">{estado.campos.nome}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail de trabalho</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          aria-invalid={Boolean(estado.campos?.email)}
        />
        {estado.campos?.email && (
          <p className="text-xs text-destructive">{estado.campos.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="new-password"
          aria-invalid={Boolean(estado.campos?.senha)}
          aria-describedby="dica-senha"
        />
        <p
          id="dica-senha"
          className={
            estado.campos?.senha
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {estado.campos?.senha ?? "Mínimo de 8 caracteres, com letra e número."}
        </p>
      </div>

      {estado.erro && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {estado.erro}
        </div>
      )}

      <Button type="submit" disabled={pendente} className="w-full gap-2">
        {pendente ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Criando conta
          </>
        ) : (
          <>
            Criar conta
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Ao criar a conta você concorda com os{" "}
        <a href="/termos" className="underline underline-offset-2">
          termos de uso
        </a>{" "}
        e com a{" "}
        <a href="/privacidade" className="underline underline-offset-2">
          política de privacidade
        </a>
        .
      </p>
    </form>
  );
}
