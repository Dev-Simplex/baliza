"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { entrar, type EstadoDoFormulario } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INICIAL: EstadoDoFormulario = {};

export function FormularioDeLogin({ proximo }: { proximo?: string }) {
  const [estado, acao, pendente] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} className="mt-8 space-y-4">
      <input type="hidden" name="proximo" value={proximo ?? "/dashboard"} />

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          tamanho="lg"
          autoComplete="email"
          required
          placeholder="voce@empresa.com.br"
          aria-invalid={Boolean(estado.campos?.email)}
          aria-describedby={estado.campos?.email ? "erro-email" : undefined}
        />
        {estado.campos?.email && (
          <p id="erro-email" className="text-xs text-destructive">
            {estado.campos.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          tamanho="lg"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(estado.campos?.senha)}
        />
        {estado.campos?.senha && (
          <p className="text-xs text-destructive">{estado.campos.senha}</p>
        )}
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

      <Button
        type="submit"
        variant="marca"
        size="lg"
        disabled={pendente}
        className="w-full"
      >
        {pendente ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
