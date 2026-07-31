import { Scale } from "lucide-react";

/**
 * Aviso de revisão jurídica.
 *
 * O texto legal deste projeto descreve com precisão o que o sistema faz, o que
 * é útil e verificável — mas descrição técnica correta não é parecer jurídico.
 * O aviso fica no topo, visível, e não em nota de rodapé.
 */
export function AvisoJuridico() {
  return (
    <aside className="mt-8 flex gap-3 rounded-xl border border-marca/30 bg-marca-suave/40 p-4">
      <Scale className="mt-0.5 size-4 shrink-0 text-marca" />
      <p className="t-corpo-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Revisar com jurídico antes de publicar.
        </span>{" "}
        Este texto foi escrito a partir do comportamento real do sistema e serve
        de base fiel, não de parecer. Adeque à sua operação e valide com quem
        responde pelo tema.
      </p>
    </aside>
  );
}

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="t-secao">{titulo}</h2>
      <div className="t-corpo mt-3 space-y-3 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
