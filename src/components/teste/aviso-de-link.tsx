import Link from "next/link";

import { MolduraPublica } from "@/components/teste/moldura-publica";

/**
 * Tela de link que não abre, na língua de quem está do outro lado.
 *
 * O 404 geral do site oferece "Ir para o painel" — o que faz sentido para quem
 * tem conta e nenhum para o candidato, que não tem e nunca vai ter. Ele digitou
 * errado o endereço ditado no telefone, ou recebeu um link truncado pelo
 * aplicativo de mensagem; a saída dele é o código de 4 dígitos ou pedir o link
 * de novo, e é isso que precisa estar escrito aqui.
 */
export function AvisoDeLink({
  titulo,
  children,
  mostrarCaminhoDoCodigo = true,
}: {
  titulo: string;
  children: React.ReactNode;
  mostrarCaminhoDoCodigo?: boolean;
}) {
  return (
    <MolduraPublica>
      <p className="etiqueta">Mapeamento comportamental</p>
      <h1 className="mt-3 t-titulo">{titulo}</h1>
      <div className="mt-3 space-y-3 t-corpo leading-relaxed text-muted-foreground">
        {children}
      </div>

      {mostrarCaminhoDoCodigo && (
        <p className="mt-8 rounded-xl border border-dashed px-5 py-4 t-corpo-sm leading-relaxed text-muted-foreground">
          Recebeu um código de 4 dígitos? Entre por{" "}
          <Link
            href="/acesso"
            className="font-medium text-foreground underline underline-offset-4"
          >
            /acesso
          </Link>{" "}
          — vai para o mesmo lugar que o link.
        </p>
      )}
    </MolduraPublica>
  );
}
