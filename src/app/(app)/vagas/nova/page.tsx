import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FormularioDeVaga } from "./formulario";
import { PRESETS } from "@/lib/instrument/presets";

export const metadata: Metadata = { title: "Criar vaga" };

export default function PaginaDeNovaVaga() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/vagas"
        className="etiqueta inline-flex items-center gap-1.5 hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Vagas
      </Link>

      <header className="mt-3">
        <h1 className="t-titulo">Criar vaga</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          O perfil-alvo é a parte que importa: são as faixas que este trabalho
          pede em cada dimensão. Comece por um pronto e ajuste depois.
        </p>
      </header>

      <FormularioDeVaga
        presets={PRESETS.map((p) => ({
          id: p.id,
          nome: p.nome,
          familia: p.familia,
          nota: p.nota,
        }))}
      />
    </div>
  );
}
