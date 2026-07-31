import { cn } from "@/lib/utils";

/**
 * Estado vazio.
 *
 * Tela vazia é convite para agir, não aviso de erro. Por isso o padrão sempre
 * carrega uma ação — e o texto explica o que aparece ali depois, não que "não
 * há dados".
 */
export function EstadoVazio({
  icone: Icone,
  titulo,
  descricao,
  acao,
  compacto = false,
  className,
}: {
  icone?: React.ComponentType<{ className?: string }>;
  titulo: string;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  compacto?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed px-6 text-center",
        compacto ? "py-10" : "py-16",
        className,
      )}
    >
      {Icone && (
        <span className="mb-4 grid size-11 place-items-center rounded-xl bg-secondary">
          <Icone className="size-5 text-muted-foreground" />
        </span>
      )}

      <h2 className="t-cartao">{titulo}</h2>

      {descricao && (
        <p className="t-corpo mt-2 max-w-md text-muted-foreground">{descricao}</p>
      )}

      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}
