import { Esqueleto } from "@/components/ui/esqueleto";

export default function CarregandoVagas() {
  return (
    <div className="mx-auto max-w-6xl" aria-busy="true">
      <span className="sr-only">Carregando as vagas</span>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <Esqueleto className="h-2.5 w-20" />
          <Esqueleto className="mt-2 h-8 w-28" />
        </div>
        <Esqueleto className="h-8 w-28 rounded-lg" />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="rounded-xl border bg-card p-5 shadow-baixa">
            <Esqueleto className="h-4 w-44" />
            <Esqueleto className="mt-2 h-2.5 w-32" />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j}>
                  <Esqueleto className="h-2.5 w-14" />
                  <Esqueleto className="mt-1.5 h-4 w-8" />
                </div>
              ))}
            </div>
            <Esqueleto className="mt-4 h-2.5 w-24" />
          </li>
        ))}
      </ul>
    </div>
  );
}
